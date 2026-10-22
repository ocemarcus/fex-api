import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RsaService } from "@shared/crypto/rsa.service";
import request from "supertest";
import {
  createTestApp,
  cleanupTestApp,
  createTestPsp,
  createTestKey,
  createTestTransfer,
  createTestWebhook,
  clearDatabase,
  TestContext,
} from "../test-setup";

describe("Transfer Module - Integration Tests", () => {
  let context: TestContext;
  let jwtService: JwtService;
  let rsaService: RsaService;
  let originPspId: string;
  let originAuthToken: string;
  let destinationPspId: string;
  let destinationAuthToken: string;
  let destinationApiKey: string;
  let destinationPrivateKey: string;
  let destinationPublicKey: string;
  let keyId: string;
  let webhookId: string;

  beforeAll(async () => {
    context = await createTestApp();
    jwtService = context.module.get<JwtService>(JwtService);
    rsaService = context.module.get<RsaService>(RsaService);
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

    // Create webhook for origin PSP (needed for transfer confirmation)
    const originWebhookDto = createTestWebhook(originPspId);
    await request(context.app.getHttpServer())
      .post("/api/psp/webhook")
      .set("Authorization", `Bearer ${originAuthToken}`)
      .send(originWebhookDto)
      .expect(HttpStatus.CREATED);

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
    destinationApiKey = destApiKeyResponse.body.apiKey;
    destinationPrivateKey = destApiKeyResponse.body.privateKey;
    destinationPublicKey = destApiKeyResponse.body.publicKey;

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

  describe("POST /api/psp/transfer - Create Transfer", () => {
    it("should create a transfer successfully", async () => {
      const transferDto = createTestTransfer(originPspId, keyId);

      const response = await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        key: expect.any(String),
        id: expect.any(String),
        amount: expect.any(Number),
      });
    });

    it("should reject transfer to own key", async () => {
      const ownKeyDto = createTestKey(originPspId);
      const ownKeyResponse = await request(context.app.getHttpServer())
        .post("/api/psp/key")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send(ownKeyDto)
        .expect(HttpStatus.CREATED);

      const transferDto = createTestTransfer(originPspId, ownKeyResponse.body.id);

      await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("should reject transfer to non-existent key", async () => {
      const transferDto = createTestTransfer(originPspId, "9999999999999999999");

      await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("should require authentication", async () => {
      const transferDto = createTestTransfer(originPspId, keyId);

      await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .send(transferDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("should validate required fields", async () => {
      await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe("GET /api/psp/transfer/:id - Get Transfer Details", () => {
    let transferId: string;

    beforeEach(async () => {
      const transferDto = createTestTransfer(originPspId, keyId);
      const response = await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.CREATED);
      transferId = response.body.id;
    });

    it("should get transfer details as origin PSP", async () => {
      const response = await request(context.app.getHttpServer())
        .get(`/api/psp/transfer/${transferId}`)
        .set("Authorization", `Bearer ${originAuthToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: transferId,
        amount: expect.any(Number),
        status: expect.any(String),
      });
    });

    it("should get transfer details as destination PSP", async () => {
      const response = await request(context.app.getHttpServer())
        .get(`/api/psp/transfer/${transferId}`)
        .set("Authorization", `Bearer ${destinationAuthToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: transferId,
        amount: expect.any(Number),
        status: expect.any(String),
      });
    });

    it("should reject access from unauthorized PSP", async () => {
      const otherPspDto = createTestPsp();
      const otherResponse = await request(context.app.getHttpServer())
        .post("/api/psp")
        .send(otherPspDto)
        .expect(HttpStatus.CREATED);

      const otherAuthToken = await jwtService.signAsync({ pspId: otherResponse.body.id });

      await request(context.app.getHttpServer())
        .get(`/api/psp/transfer/${transferId}`)
        .set("Authorization", `Bearer ${otherAuthToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it("should return 404 for non-existent transfer", async () => {
      await request(context.app.getHttpServer())
        .get("/api/psp/transfer/non-existent-id")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /api/psp/transfer/ack - Confirm Transfer", () => {
    let transferId: string;

    beforeEach(async () => {
      const transferDto = createTestTransfer(originPspId, keyId);
      const response = await request(context.app.getHttpServer())
        .post("/api/psp/transfer")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send(transferDto)
        .expect(HttpStatus.CREATED);
      transferId = response.body.id;
    });

    it("should confirm transfer as destination PSP", async () => {
      const response = await request(context.app.getHttpServer())
        .patch("/api/psp/transfer/ack")
        .set("Authorization", `Bearer ${destinationAuthToken}`)
        .send({ id: transferId, status: "OK" })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        success: true,
      });
    });

    it("should reject confirmation from origin PSP", async () => {
      await request(context.app.getHttpServer())
        .patch("/api/psp/transfer/ack")
        .set("Authorization", `Bearer ${originAuthToken}`)
        .send({ id: transferId, status: "OK" })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("should reject confirmation for non-existent transfer", async () => {
      await request(context.app.getHttpServer())
        .patch("/api/psp/transfer/ack")
        .set("Authorization", `Bearer ${destinationAuthToken}`)
        .send({ id: "9999999999999999999", status: "OK" })
        .expect(HttpStatus.NOT_FOUND);
    });

    it("should validate status enum", async () => {
      await request(context.app.getHttpServer())
        .patch("/api/psp/transfer/ack")
        .set("Authorization", `Bearer ${destinationAuthToken}`)
        .send({ id: transferId, status: "INVALID_STATUS" })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
