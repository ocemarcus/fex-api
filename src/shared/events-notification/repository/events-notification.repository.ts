import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE, DrizzleDB } from "@shared/database/database.service";
import {
  EventsNotificationSchema,
  eventsStatusEnum,
} from "@shared/database/schema/events-notification.schema";
import { eq, InferEnum, asc, inArray } from "drizzle-orm";
import { EventsNotificationType } from "../utils/utils";

export type EvetnsNotificationStatus = InferEnum<typeof eventsStatusEnum>;

@Injectable()
export class EventsNotificationRepository {
  private readonly eventNotification = EventsNotificationSchema;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  public async create(
    data: {
      pspId: string;
      payload: string;
      targetUrl: string;
      id: string;
      eventType: EventsNotificationType;
    },
    tx: any,
  ) {
    await tx.insert(this.eventNotification).values({
      ...data,
      id: BigInt(data.id),
      pspId: BigInt(data.pspId),
    });
  }
  public async findPending(limit = 100) {
    return await this.db.transaction(async (tx) => {
      const messages = await tx
        .select()
        .from(this.eventNotification)
        .where(eq(this.eventNotification.status, "PENDING"))
        .orderBy(asc(this.eventNotification.id))
        .limit(limit)
        .for("update", { skipLocked: true });

      if (!messages.length) return [];

      const ids = messages.map((item) => item.id);

      await tx
        .update(this.eventNotification)
        .set({ status: "PROCESSING" })
        .where(inArray(this.eventNotification.id, ids));

      return messages;
    });
  }
  public async ack(id: string) {
    await this.db
      .update(this.eventNotification)
      .set({ status: "SENT" })
      .where(eq(this.eventNotification.id, BigInt(id)));
  }
}
