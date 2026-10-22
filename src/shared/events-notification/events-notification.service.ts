import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { EventsNotificationRepository } from "./repository/events-notification.repository";
import { Client } from "pg";

import { EventsNotificationSchema } from "@shared/database/schema/events-notification.schema";
import { InferSelectModel } from "drizzle-orm";
import { EventsNotificationType } from "./utils/utils";
import pLimit from "p-limit";
import { HttpService } from "@nestjs/axios";
import { LOGGER_EVENTS } from "@shared/utils/logger.events";
import { generateId } from "@shared/utils/utils";

@Injectable()
export class EventsNotificationService implements OnApplicationShutdown {
  private workerRunning = false;
  private hasPendingWork = false;
  private workerTimeout: NodeJS.Timeout | null = null; // Guardar a referência do timer

  private readonly client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  private readonly logger = new Logger(EventsNotificationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly eventsNotificationRepository: EventsNotificationRepository,
  ) {}

  async onModuleInit() {
    this.logger.log({
      event: LOGGER_EVENTS.EVENTS_NOTIFICATION,
      msg: "Iniciando processo de NOTIFY",
    });

    this.client.on("end", () => this.logger.log("end"));

    this.client.on("notification", () => {
      this.hasPendingWork = true;
      this.scheduleWorker();
    });
    this.client.on("error", (err) => this.logger.error(err));

    await this.client.connect();
    await this.client.query("LISTEN events_notification");

    this.hasPendingWork = true;
    this.scheduleWorker();
  }
  async onApplicationShutdown() {
    this.logger.log({
      event: LOGGER_EVENTS.EVENTS_NOTIFICATION,
      msg: "Finalizar conexão com NOTIFY ",
    });
    await this.client.end();
  }

  private scheduleWorker() {
    if (this.workerRunning) {
      return;
    }
    if (this.workerTimeout) {
      clearTimeout(this.workerTimeout);
    }

    this.workerTimeout = setTimeout(() => {
      this.workerTimeout = null;
      void this.runWorker();
    }, 150);
  }

  async runWorker() {
    if (this.workerRunning) return;

    this.workerRunning = true;

    try {
      while (this.hasPendingWork) {
        this.hasPendingWork = false;
        await this.drainQueue();
      }
    } finally {
      this.workerRunning = false;

      if (this.hasPendingWork) {
        this.scheduleWorker();
      }
    }
  }
  async drainQueue() {
    while (true) {
      const messages = await this.eventsNotificationRepository.findPending(100);
      if (!messages.length) break;

      await this.processBatch(messages);
    }
  }
  async processBatch(messages: InferSelectModel<typeof EventsNotificationSchema>[]) {
    const limit = pLimit(10);

    const tranceId = generateId();

    this.logger.log({
      tranceId,
      event: LOGGER_EVENTS.EVENTS_NOTIFICATION,
      msg: `Enviar o total de mensagens para webhook ${messages.length}`,
    });

    const tasks = messages.map((message) =>
      limit(async () => {
        const event =
          message.eventType === EventsNotificationType.TRANSFER_ACK
            ? LOGGER_EVENTS.EVENTS_NOTIFICATION_TRANSFER_ACK
            : LOGGER_EVENTS.EVENTS_NOTIFICATION_TRANSFER_IN;

        const payload = Buffer.from(message.payload!, "base64").toString("utf-8");

        if (message.eventType === EventsNotificationType.TRANSFER_ACK) {
          //Todo: emit SSE
          this.logger.log({
            tranceId,
            event,
            msg: "Emitir eventos de confirmação",
            payload,
          });
        }
        try {
          await this.httpService.axiosRef.post(message.targetUrl, payload, {
            headers: {
              "Content-Type": "application/json",
            },
          });

          await this.eventsNotificationRepository.ack(message.id.toString());

          this.logger.log({
            tranceId,
            event,
            msg: "Mensagem enviada com sucesso",
            payload,
          });
        } catch (error) {
          this.logger.error({
            tranceId,
            event,
            error: error?.message,
            payload,
          });
        }
      }),
    );
    await Promise.allSettled(tasks);
  }
}
