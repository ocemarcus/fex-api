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
  createTestWebhook,
  clearDatabase,
  TestContext,
} from "../test-setup";

describe("PSP Key & Webhook Modules - Integration Tests", () => {
  let context: TestContext;
  let jwtService: JwtService;
  let rsaService: RsaService;
  let pspId: string;
  let authToken: string;

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

    const pspDto = createTestPsp();
    const response = await request(context.app.getHttpServer())
      .post("/api/psp")
      .send(pspDto)
      .expect(HttpStatus.CREATED);

    pspId = response.body.id;

    const apiKeyResponse = await request(context.app.getHttpServer())
      .post("/api/psp/api-key")
      .send({ pspId })
      .expect(HttpStatus.CREATED);

    authToken = await jwtService.signAsync({ pspId });
  });

  describe("POST /api/psp/key - Create PSP Key", () => {
    it("should create a key for authenticated PSP", async () => {
      const keyDto = createTestKey(pspId);

      const response = await request(context.app.getHttpServer())
        .post("/api/psp/key")
        .set("Authorization", `Bearer ${authToken}`)
        .send(keyDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        key: keyDto.key,
        name: keyDto.name,
        document: keyDto.document,
      });
    });

    it("should reject duplicate key for same PSP", async () => {
      const keyDto = createTestKey(pspId);

      await request(context.app.getHttpServer())
        .post("/api/psp/key")
        .set("Authorization", `Bearer ${authToken}`)
        .send(keyDto)
        .expect(HttpStatus.CREATED);

      await request(context.app.getHttpServer())
        .post("/api/psp/key")
        .set("Authorization", `Bearer ${authToken}`)
        .send(keyDto)
        .expect(HttpStatus.CONFLICT);
    });

    it("should require authentication", async () => {
      const keyDto = createTestKey(pspId);

      await request(context.app.getHttpServer())
        .post("/api/psp/key")
        .send(keyDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("should validate required fields", async () => {
      await request(context.app.getHttpServer())
        .post("/api/psp/key")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe("GET /api/psp/key/:key - Get Key Info", () => {
    let keyId: string;
    let keyValue: string;

    beforeEach(async () => {
      const keyDto = createTestKey(pspId);
      const response = await request(context.app.getHttpServer())
        .post("/api/psp/key")
        .set("Authorization", `Bearer ${authToken}`)
        .send(keyDto)
        .expect(HttpStatus.CREATED);

      keyId = response.body.id;
      keyValue = response.body.key;
    });

    it("should get key info by key value", async () => {
      const response = await request(context.app.getHttpServer())
        .get(`/api/psp/key/${keyValue}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: keyId,
        key: keyValue,
        name: expect.any(String),
        document: expect.any(String),
      });
    });

    it("should reject access to non-existent key", async () => {
      await request(context.app.getHttpServer())
        .get("/api/psp/key/non-existent-key")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("should reject access from other PSP", async () => {
      const otherPspDto = createTestPsp();
      const otherResponse = await request(context.app.getHttpServer())
        .post("/api/psp")
        .send(otherPspDto)
        .expect(HttpStatus.CREATED);

      const otherAuthToken = await jwtService.signAsync({ pspId: otherResponse.body.id });

      await request(context.app.getHttpServer())
        .get(`/api/psp/key/${keyValue}`)
        .set("Authorization", `Bearer ${otherAuthToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe("POST /api/psp/webhook - Create Webhook", () => {
    it("should create webhook for authenticated PSP", async () => {
      const webhookDto = createTestWebhook(pspId);

      const response = await request(context.app.getHttpServer())
        .post("/api/psp/webhook")
        .set("Authorization", `Bearer ${authToken}`)
        .send(webhookDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        targetUrl: webhookDto.targetUrl,
      });
    });

    it("should reject duplicate webhook for same PSP", async () => {
      const webhookDto = createTestWebhook(pspId);

      await request(context.app.getHttpServer())
        .post("/api/psp/webhook")
        .set("Authorization", `Bearer ${authToken}`)
        .send(webhookDto)
        .expect(HttpStatus.CREATED);

      await request(context.app.getHttpServer())
        .post("/api/psp/webhook")
        .set("Authorization", `Bearer ${authToken}`)
        .send(webhookDto)
        .expect(HttpStatus.CONFLICT);
    });

    it("should require authentication", async () => {
      const webhookDto = createTestWebhook(pspId);

      await request(context.app.getHttpServer())
        .post("/api/psp/webhook")
        .send(webhookDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe("PATCH /api/psp/webhook/:id/test - Test Webhook", () => {
    let webhookId: string;

    beforeEach(async () => {
      const webhookDto = createTestWebhook(pspId);
      const response = await request(context.app.getHttpServer())
        .post("/api/psp/webhook")
        .set("Authorization", `Bearer ${authToken}`)
        .send(webhookDto)
        .expect(HttpStatus.CREATED);

      webhookId = response.body.id;
    });

    it("should test webhook endpoint", async () => {
      const response = await request(context.app.getHttpServer())
        .patch(`/api/psp/webhook/${webhookId}/test`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ payload: { test: true } })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        success: true,
      });
    });

    it("should reject test for non-existent webhook", async () => {
      await request(context.app.getHttpServer())
        .patch("/api/psp/webhook/non-existent-id/test")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ payload: { test: true } })
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
