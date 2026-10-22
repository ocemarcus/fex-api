import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RsaService } from "@shared/crypto/rsa.service";
import request from "supertest";
import { EventsNotificationRepository } from "@shared/events-notification/repository/events-notification.repository";
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

describe("End-to-End Tests - Full Transfer Flow", () => {
  let context: TestContext;
  let jwtService: JwtService;
  let rsaService: RsaService;
  let eventsRepo: EventsNotificationRepository;

  let senderPspId: string;
  let senderAuthToken: string;
  let senderApiKey: string;
  let senderPrivateKey: string;
  let senderPublicKey: string;

  let receiverPspId: string;
  let receiverAuthToken: string;
  let receiverApiKey: string;
  let receiverPrivateKey: string;
  let receiverPublicKey: string;

  let keyId: string;
  let webhookId: string;

  beforeAll(async () => {
    context = await createTestApp();
    jwtService = context.module.get<JwtService>(JwtService);
    rsaService = context.module.get<RsaService>(RsaService);
    eventsRepo = context.module.get<EventsNotificationRepository>(EventsNotificationRepository);
  });

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  beforeEach(async () => {
    await clearDatabase(context.db);

    const senderPspDto = createTestPsp();
    const senderResponse = await request(context.app.getHttpServer())
      .post("/api/psp")
      .send(senderPspDto)
      .expect(HttpStatus.CREATED);
    senderPspId = senderResponse.body.id;

    const senderApiKeyResponse = await request(context.app.getHttpServer())
      .post("/api/psp/api-key")
      .send({ pspId: senderPspId })
      .expect(HttpStatus.CREATED);
    senderApiKey = senderApiKeyResponse.body.apiKey;
    senderPrivateKey = senderApiKeyResponse.body.privateKey;
    senderPublicKey = senderApiKeyResponse.body.publicKey;

    senderAuthToken = await jwtService.signAsync({ pspId: senderPspId });

    // Create webhook for sender PSP (needed for transfer confirmation)
    const senderWebhookDto = createTestWebhook(senderPspId);
    await request(context.app.getHttpServer())
      .post("/api/psp/webhook")
      .set("Authorization", `Bearer ${senderAuthToken}`)
      .send(senderWebhookDto)
      .expect(HttpStatus.CREATED);

    const receiverPspDto = createTestPsp();
    const receiverResponse = await request(context.app.getHttpServer())
      .post("/api/psp")
      .send(receiverPspDto)
      .expect(HttpStatus.CREATED);
    receiverPspId = receiverResponse.body.id;

    const receiverApiKeyResponse = await request(context.app.getHttpServer())
      .post("/api/psp/api-key")
      .send({ pspId: receiverPspId })
      .expect(HttpStatus.CREATED);
    receiverApiKey = receiverApiKeyResponse.body.apiKey;
    receiverPrivateKey = receiverApiKeyResponse.body.privateKey;
    receiverPublicKey = receiverApiKeyResponse.body.publicKey;

    receiverAuthToken = await jwtService.signAsync({ pspId: receiverPspId });

    const keyDto = createTestKey(receiverPspId);
    const keyResponse = await request(context.app.getHttpServer())
      .post("/api/psp/key")
      .set("Authorization", `Bearer ${receiverAuthToken}`)
      .send(keyDto)
      .expect(HttpStatus.CREATED);
    keyId = keyResponse.body.id;

    const webhookDto = createTestWebhook(receiverPspId);
    const webhookResponse = await request(context.app.getHttpServer())
      .post("/api/psp/webhook")
      .set("Authorization", `Bearer ${receiverAuthToken}`)
      .send(webhookDto)
      .expect(HttpStatus.CREATED);
    webhookId = webhookResponse.body.id;
  });

  describe("Complete Transfer Lifecycle", () => {
    it("should execute full transfer flow: create -> notify -> confirm -> notify", async () => {
      const mockPost = vi
        .spyOn(context.module.get("HttpService").axiosRef, "post")
        .mockResolvedValue({ data: {} });

      const transferDto = createTestTransfer(senderPspId, keyId);

      const createResponse = await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${senderAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.CREATED);

      const transferId = createResponse.body.id;
      expect(createResponse.body).toMatchObject({
        key: expect.any(String),
        id: transferId,
        amount: expect.any(Number),
      });

      await waitForEventProcessing(1000);

      let pending = await eventsRepo.findPending(100);
      const transferInEvent = pending.find(
        (p) =>
          p.eventType === EventsNotificationType.TRANSFER_IN &&
          p.pspId.toString() === receiverPspId,
      );
      expect(transferInEvent).toBeDefined();

      const confirmResponse = await request(context.app.getHttpServer())
        .patch("/api/psp/transfer/ack")
        .set("Authorization", `Bearer ${receiverAuthToken}`)
        .send({ id: transferId, status: "OK" })
        .expect(HttpStatus.OK);

      expect(confirmResponse.body).toMatchObject({ success: true });

      await waitForEventProcessing(1000);

      pending = await eventsRepo.findPending(100);
      const transferAckEvent = pending.find(
        (p) =>
          p.eventType === EventsNotificationType.TRANSFER_ACK && p.pspId.toString() === senderPspId,
      );
      expect(transferAckEvent).toBeDefined();

      const getResponse = await request(context.app.getHttpServer())
        .get(`/api/psp/transfer/${transferId}`)
        .set("Authorization", `Bearer ${receiverAuthToken}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: transferId,
        status: "OK",
      });

      mockPost.mockRestore();
    });

    it("should handle transfer rejection flow", async () => {
      const mockPost = vi
        .spyOn(context.module.get("HttpService").axiosRef, "post")
        .mockResolvedValue({ data: {} });

      const transferDto = createTestTransfer(senderPspId, keyId);

      const createResponse = await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${senderAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.CREATED);

      const transferId = createResponse.body.id;

      await waitForEventProcessing(1000);

      await request(context.app.getHttpServer())
        .patch("/api/psp/transfer/ack")
        .set("Authorization", `Bearer ${receiverAuthToken}`)
        .send({ id: transferId, status: "REJECT", reason: "Insufficient funds" })
        .expect(HttpStatus.OK);

      await waitForEventProcessing(1000);

      const pending = await eventsRepo.findPending(100);
      const transferAckEvent = pending.find(
        (p) =>
          p.eventType === EventsNotificationType.TRANSFER_ACK && p.pspId.toString() === senderPspId,
      );
      expect(transferAckEvent).toBeDefined();

      const payload = JSON.parse(
        Buffer.from(transferAckEvent!.payload!, "base64").toString("utf-8"),
      );
      expect(payload.status).toBe("REJECT");
      expect(payload.reason).toBe("Insufficient funds");

      mockPost.mockRestore();
    });

    it("should handle multiple concurrent transfers", async () => {
      const mockPost = vi
        .spyOn(context.module.get("HttpService").axiosRef, "post")
        .mockResolvedValue({ data: {} });

      const transferDtos = [
        createTestTransfer(senderPspId, keyId),
        createTestTransfer(senderPspId, keyId),
        createTestTransfer(senderPspId, keyId),
      ];

      const createResponses = await Promise.all(
        transferDtos.map((dto) =>
          request(context.app.getHttpServer())
            .post("/api/psp/transfer")
            .set("Authorization", `Bearer ${senderAuthToken}`)
            .send(dto)
            .expect(HttpStatus.CREATED),
        ),
      );

      const transferIds = createResponses.map((r) => r.body.id);
      expect(transferIds).toHaveLength(3);

      await waitForEventProcessing(1500);

      let pending = await eventsRepo.findPending(100);
      const transferInEvents = pending.filter(
        (p) =>
          p.eventType === EventsNotificationType.TRANSFER_IN &&
          p.pspId.toString() === receiverPspId,
      );
      expect(transferInEvents.length).toBeGreaterThanOrEqual(3);

      await Promise.all(
        transferIds.map((id) =>
          request(context.app.getHttpServer())
            .patch("/api/psp/transfer/ack")
            .set("Authorization", `Bearer ${receiverAuthToken}`)
            .send({ id, status: "OK" })
            .expect(HttpStatus.OK),
        ),
      );

      await waitForEventProcessing(1500);

      pending = await eventsRepo.findPending(100);
      const transferAckEvents = pending.filter(
        (p) =>
          p.eventType === EventsNotificationType.TRANSFER_ACK && p.pspId.toString() === senderPspId,
      );
      expect(transferAckEvents.length).toBeGreaterThanOrEqual(3);

      mockPost.mockRestore();
    });
  });

  describe("Authentication and Authorization", () => {
    it("should authenticate sender and receiver independently", async () => {
      const senderAuthResponse = await request(context.app.getHttpServer())
        .post("/api/psp/auth")
        .send({
          apiKey: senderApiKey,
          privateKey: senderPrivateKey,
        })
        .expect(HttpStatus.OK);

      const receiverAuthResponse = await request(context.app.getHttpServer())
        .post("/api/psp/auth")
        .send({
          apiKey: receiverApiKey,
          privateKey: receiverPrivateKey,
        })
        .expect(HttpStatus.OK);

      expect(senderAuthResponse.body.jwt).toBeDefined();
      expect(receiverAuthResponse.body.jwt).toBeDefined();

      const senderPayload = await jwtService.verifyAsync(senderAuthResponse.body.jwt);
      const receiverPayload = await jwtService.verifyAsync(receiverAuthResponse.body.jwt);

      expect(senderPayload.pspId).toBe(senderPspId);
      expect(receiverPayload.pspId).toBe(receiverPspId);
    });

    it("should reject cross-PSP access to transfer details", async () => {
      const transferDto = createTestTransfer(senderPspId, keyId);
      const createResponse = await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${senderAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.CREATED);

      const transferId = createResponse.body.id;

      const thirdPartyPspDto = createTestPsp();
      const thirdPartyResponse = await request(context.app.getHttpServer())
        .post("/api/psp")
        .send(thirdPartyPspDto)
        .expect(HttpStatus.CREATED);

      const thirdPartyAuthToken = await jwtService.signAsync({ pspId: thirdPartyResponse.body.id });

      await request(context.app.getHttpServer())
        .get(`/api/psp/transfer/${transferId}`)
        .set("Authorization", `Bearer ${thirdPartyAuthToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe("Key Management", () => {
    it("should allow receiver to create multiple keys", async () => {
      const keyDto1 = createTestKey(receiverPspId);
      const keyDto2 = createTestKey(receiverPspId);

      const response1 = await request(context.app.getHttpServer())
        .post("/api/psp/key")
        .set("Authorization", `Bearer ${receiverAuthToken}`)
        .send(keyDto1)
        .expect(HttpStatus.CREATED);

      const response2 = await request(context.app.getHttpServer())
        .post("/api/psp/key")
        .set("Authorization", `Bearer ${receiverAuthToken}`)
        .send(keyDto2)
        .expect(HttpStatus.CREATED);

      expect(response1.body.id).not.toBe(response2.body.id);
    });

    it("should allow sender to query receiver's key info", async () => {
      const getResponse = await request(context.app.getHttpServer())
        .get(`/api/psp/key/${keyId}`)
        .set("Authorization", `Bearer ${senderAuthToken}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: keyId,
        key: expect.any(String),
      });
    });
  });

  describe("Webhook Management", () => {
    it("should allow receiver to manage webhooks", async () => {
      const webhookDto = createTestWebhook(receiverPspId);
      webhookDto.targetUrl = "https://webhook.site/another-test";

      const response = await request(context.app.getHttpServer())
        .post("/api/psp/webhook")
        .set("Authorization", `Bearer ${receiverAuthToken}`)
        .send(webhookDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        targetUrl: webhookDto.targetUrl,
      });
    });

    it("should test webhook endpoint", async () => {
      const mockPost = vi
        .spyOn(context.module.get("HttpService").axiosRef, "post")
        .mockResolvedValue({ data: {} });

      await request(context.app.getHttpServer())
        .patch(`/api/psp/webhook/${webhookId}/test`)
        .set("Authorization", `Bearer ${receiverAuthToken}`)
        .send({ payload: { test: true } })
        .expect(HttpStatus.OK);

      expect(mockPost).toHaveBeenCalled();
      mockPost.mockRestore();
    });
  });
});
