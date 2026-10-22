import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RsaService } from "@shared/crypto/rsa.service";
import request from "supertest";
import {
  createTestApp,
  cleanupTestApp,
  createTestPsp,
  clearDatabase,
  TestContext,
} from "../test-setup";

describe("PSP Module - Integration Tests", () => {
  let context: TestContext;
  let jwtService: JwtService;
  let rsaService: RsaService;
  let authToken: string;
  let pspId: string;
  let apiKey: string;
  let privateKey: string;
  let publicKey: string;
  let pspDocument: string;

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
    pspDocument = pspDto.document;

    const apiKeyResponse = await request(context.app.getHttpServer())
      .post("/api/psp/api-key")
      .send({ pspId })
      .expect(HttpStatus.CREATED);

    apiKey = apiKeyResponse.body.apiKey;
    privateKey = apiKeyResponse.body.privateKey;
    publicKey = apiKeyResponse.body.publicKey;

    const payload = { pspId };
    authToken = await jwtService.signAsync(payload);
  });

  describe("POST /api/psp - Create PSP", () => {
    it("should create a new PSP successfully", async () => {
      const pspDto = createTestPsp();
      console.log("Test document:", pspDto.document);
      console.log("BeforeEach document:", pspDocument);

      const response = await request(context.app.getHttpServer())
        .post("/api/psp")
        .send(pspDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: pspDto.name,
        document: pspDto.document,
      });
    });

    it("should reject duplicate document", async () => {
      const duplicatePspDto = createTestPsp();
      duplicatePspDto.document = pspDocument;

      await request(context.app.getHttpServer())
        .post("/api/psp")
        .send(duplicatePspDto)
        .expect(HttpStatus.CONFLICT);
    });

    it("should validate required fields", async () => {
      await request(context.app.getHttpServer())
        .post("/api/psp")
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe("POST /api/psp/api-key - Create API Key", () => {
    it("should create API key for existing PSP", async () => {
      const response = await request(context.app.getHttpServer())
        .post("/api/psp/api-key")
        .send({ pspId })
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        apiKey: expect.any(String),
        publicKey: expect.any(String),
        privateKey: expect.any(String),
      });
    });

    it("should reject invalid PSP ID", async () => {
      await request(context.app.getHttpServer())
        .post("/api/psp/api-key")
        .send({ pspId: "invalid-id" })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should generate valid RSA key pair", async () => {
      const response = await request(context.app.getHttpServer())
        .post("/api/psp/api-key")
        .send({ pspId })
        .expect(HttpStatus.CREATED);

      const isValid = rsaService.isKeyPairValid(response.body.privateKey, response.body.publicKey);
      expect(isValid).toBe(true);
    });
  });

  describe("POST /api/psp/auth - Authenticate PSP", () => {
    it("should authenticate with valid credentials", async () => {
      const response = await request(context.app.getHttpServer())
        .post("/api/psp/auth")
        .send({
          apiKey,
          privateKey,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        jwt: expect.any(String),
        expireIn: expect.any(Number),
      });

      const payload = await jwtService.verifyAsync(response.body.jwt);
      expect(payload.pspId).toBe(pspId);
    });

    it("should reject invalid API key format", async () => {
      await request(context.app.getHttpServer())
        .post("/api/psp/auth")
        .send({
          apiKey: "invalid-api-key",
          privateKey,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should reject non-existent API key", async () => {
      const nonExistentApiKey = "00000000-0000-0000-0000-000000000000";
      await request(context.app.getHttpServer())
        .post("/api/psp/auth")
        .send({
          apiKey: nonExistentApiKey,
          privateKey,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("should reject invalid private key", async () => {
      const anotherKeyPair = rsaService.generateKeyPair();

      await request(context.app.getHttpServer())
        .post("/api/psp/auth")
        .send({
          apiKey,
          privateKey: anotherKeyPair.privateKey,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("should reject mismatched key pair", async () => {
      const anotherApiKeyResponse = await request(context.app.getHttpServer())
        .post("/api/psp/api-key")
        .send({ pspId })
        .expect(HttpStatus.CREATED);

      await request(context.app.getHttpServer())
        .post("/api/psp/auth")
        .send({
          apiKey: apiKey,
          privateKey: anotherApiKeyResponse.body.privateKey,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
