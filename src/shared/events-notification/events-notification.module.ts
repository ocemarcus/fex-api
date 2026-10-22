import { Module } from "@nestjs/common";
import { EventsNotificationService } from "./events-notification.service";
import { ScheduleModule } from "@nestjs/schedule";
import { EventsNotificationRepository } from "./repository/events-notification.repository";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  providers: [EventsNotificationService, EventsNotificationRepository],
})
export class EventsNotificationModule {}
