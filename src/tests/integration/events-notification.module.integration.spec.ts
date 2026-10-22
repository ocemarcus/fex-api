import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RsaService } from "@shared/crypto/rsa.service";
import request from "supertest";
import { EventsNotificationRepository } from "@shared/events-notification/repository/events-notification.repository";
import { EventsNotificationService } from "@shared/events-notification/events-notification.service";
import {
  createTestApp,
  cleanupTestApp,
  createTestPsp,
  createTestKey,
  createTestTransfer,
  createTestWebhook,
  clearDatabase,
  waitForEventProcessing,
  TestContext,
} from "../test-setup";
import { EventsNotificationType } from "@shared/events-notification/utils/utils";

describe("Events-Notification Module - Integration Tests", () => {
  let context: TestContext;
  let jwtService: JwtService;
  let rsaService: RsaService;
  let eventsRepo: EventsNotificationRepository;
  let eventsService: EventsNotificationService;
  let originPspId: string;
  let originAuthToken: string;
  let destinationPspId: string;
  let destinationAuthToken: string;
  let keyId: string;
  let webhookId: string;

  beforeAll(async () => {
    context = await createTestApp();
    jwtService = context.module.get<JwtService>(JwtService);
    rsaService = context.module.get<RsaService>(RsaService);
    eventsRepo = context.module.get<EventsNotificationRepository>(EventsNotificationRepository);
    eventsService = context.module.get<EventsNotificationService>(EventsNotificationService);
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  beforeEach(async () => {
    await clearDatabase(context.db);

    const originPspDto = createTestPsp();
    const originResponse = await request(context.app.getHttpServer())
      .post("/api/psp")
      .send(originPspDto)
      .expect(HttpStatus.CREATED);
    originPspId = originResponse.body.id;

    const originApiKeyResponse = await request(context.app.getHttpServer())
      .post("/api/psp/api-key")
      .send({ pspId: originPspId })
      .expect(HttpStatus.CREATED);

    originAuthToken = await jwtService.signAsync({ pspId: originPspId });

    const destinationPspDto = createTestPsp();
    const destResponse = await request(context.app.getHttpServer())
      .post("/api/psp")
      .send(destinationPspDto)
      .expect(HttpStatus.CREATED);
    destinationPspId = destResponse.body.id;

    const destApiKeyResponse = await request(context.app.getHttpServer())
      .post("/api/psp/api-key")
      .send({ pspId: destinationPspId })
      .expect(HttpStatus.CREATED);

    destinationAuthToken = await jwtService.signAsync({ pspId: destinationPspId });

    const keyDto = createTestKey(destinationPspId);
    const keyResponse = await request(context.app.getHttpServer())
      .post("/api/psp/key")
      .set("Authorization", `Bearer ${destinationAuthToken}`)
      .send(keyDto)
      .expect(HttpStatus.CREATED);
    keyId = keyResponse.body.id;

    const webhookDto = createTestWebhook(destinationPspId);
    const webhookResponse = await request(context.app.getHttpServer())
      .post("/api/psp/webhook")
      .set("Authorization", `Bearer ${destinationAuthToken}`)
      .send(webhookDto)
      .expect(HttpStatus.CREATED);
    webhookId = webhookResponse.body.id;
  });

  describe("EventsNotificationRepository", () => {
    it("should create and find pending notifications", async () => {
      const notificationData = {
        pspId: destinationPspId,
        payload: "base64payload",
        targetUrl: "https://example.com/webhook",
        id: "test-id-1",
        eventType: EventsNotificationType.TRANSFER_IN,
      };

      await context.module.get("DRIZZLE").transaction(async (tx: any) => {
        await eventsRepo.create(notificationData, tx);
      });

      const pending = await eventsRepo.findPending(10);
      expect(pending.length).toBeGreaterThanOrEqual(1);
      const found = pending.find((p) => p.id.toString() === "test-id-1");
      expect(found).toBeDefined();
      expect(found?.status).toBe("PROCESSING");
    });

    it("should ack notification", async () => {
      const notificationData = {
        pspId: destinationPspId,
        payload: "base64payload",
        targetUrl: "https://example.com/webhook",
        id: "test-id-2",
        eventType: EventsNotificationType.TRANSFER_IN,
      };

      await context.module.get("DRIZZLE").transaction(async (tx: any) => {
        await eventsRepo.create(notificationData, tx);
      });

      const pending = await eventsRepo.findPending(10);
      const found = pending.find((p) => p.id.toString() === "test-id-2");
      expect(found).toBeDefined();

      await eventsRepo.ack(found!.id.toString());

      const pendingAfterAck = await eventsRepo.findPending(10);
      const acked = pendingAfterAck.find((p) => p.id.toString() === "test-id-2");
      expect(acked).toBeUndefined();
    });
  });

  describe("EventsNotificationService", () => {
    it("should process pending notifications", async () => {
      const mockPost = vi
        .spyOn(eventsService["httpService"].axiosRef, "post")
        .mockResolvedValue({ data: {} });

      const notificationData = {
        pspId: destinationPspId,
        payload: Buffer.from(JSON.stringify({ test: "data" })).toString("base64"),
        targetUrl: "https://example.com/webhook",
        id: "test-service-1",
        eventType: EventsNotificationType.TRANSFER_IN,
      };

      await context.module.get("DRIZZLE").transaction(async (tx: any) => {
        await eventsRepo.create(notificationData, tx);
      });

      await eventsService.drainQueue();
      await waitForEventProcessing();

      expect(mockPost).toHaveBeenCalled();
      mockPost.mockRestore();
    });

    it("should handle webhook failure gracefully", async () => {
      const mockPost = vi
        .spyOn(eventsService["httpService"].axiosRef, "post")
        .mockRejectedValue(new Error("Network error"));

      const notificationData = {
        pspId: destinationPspId,
        payload: Buffer.from(JSON.stringify({ test: "data" })).toString("base64"),
        targetUrl: "https://example.com/webhook",
        id: "test-service-2",
        eventType: EventsNotificationType.TRANSFER_IN,
      };

      await context.module.get("DRIZZLE").transaction(async (tx: any) => {
        await eventsRepo.create(notificationData, tx);
      });

      await eventsService.drainQueue();
      await waitForEventProcessing();

      const pending = await eventsRepo.findPending(10);
      const found = pending.find((p) => p.id.toString() === "test-service-2");
      expect(found).toBeDefined();
      expect(found?.status).toBe("PROCESSING");

      mockPost.mockRestore();
    });
  });

  describe("Transfer Event Flow", () => {
    it("should create TRANSFER_IN event when transfer is created", async () => {
      const transferDto = createTestTransfer(originPspId, keyId);

      await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.CREATED);

      await waitForEventProcessing(1000);

      const pending = await eventsRepo.findPending(100);
      const transferInEvent = pending.find(
        (p) =>
          p.eventType === EventsNotificationType.TRANSFER_IN &&
          p.pspId.toString() === destinationPspId,
      );

      expect(transferInEvent).toBeDefined();
    });

    it("should create TRANSFER_ACK event when transfer is confirmed", async () => {
      const transferDto = createTestTransfer(originPspId, keyId);
      const transferResponse = await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.CREATED);

      const transferId = transferResponse.body.id;

      await request(context.app.getHttpServer())
        .patch("/api/psp/transfer/ack")
        .set("Authorization", `Bearer ${destinationAuthToken}`)
        .send({ id: transferId, status: "OK" })
        .expect(HttpStatus.OK);

      await waitForEventProcessing(1000);

      const pending = await eventsRepo.findPending(100);
      const transferAckEvent = pending.find(
        (p) =>
          p.eventType === EventsNotificationType.TRANSFER_ACK && p.pspId.toString() === originPspId,
      );

      expect(transferAckEvent).toBeDefined();
    });
  });
});
