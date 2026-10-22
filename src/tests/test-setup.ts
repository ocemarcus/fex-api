import { vi } from "vitest";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { DrizzleDB, DRIZZLE } from "../shared/database/database.service";
import { EventsNotificationService } from "../shared/events-notification/events-notification.service";
import { generateId, toCents } from "../shared/utils/utils";

export interface TestContext {
  app: INestApplication;
  module: TestingModule;
  db: DrizzleDB;
}

const mockEventsNotificationService = {
  onModuleInit: vi.fn(),
  onApplicationShutdown: vi.fn(),
  drainQueue: vi.fn(),
  runWorker: vi.fn(),
  scheduleWorker: vi.fn(),
};

let sharedModule: TestingModule | null = null;
let sharedApp: INestApplication | null = null;

export async function createTestApp(): Promise<TestContext> {
  process.env.JWT_EXPIRES_IN = "3600";

  if (!sharedModule) {
    sharedModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EventsNotificationService)
      .useValue(mockEventsNotificationService)
      .compile();

    sharedApp = sharedModule.createNestApplication();
    sharedApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await sharedApp.init();
  }

  const db = sharedModule.get<DrizzleDB>(DRIZZLE);

  return { app: sharedApp!, module: sharedModule, db };
}

export async function cleanupTestApp(context: TestContext): Promise<void> {
  vi.clearAllMocks();
}

export async function clearDatabase(db: DrizzleDB): Promise<void> {
  const tables = ["eventsNotification", "transfer", "pspWebHoook", "pspKey", "pspApiKey", "psp"];

  for (const table of tables) {
    try {
      await db.execute(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    } catch (error) {
      console.error(`Failed to truncate ${table}:`, error);
    }
  }
}

let pspCounter = 0;

export function createTestPsp() {
  pspCounter++;
  return {
    name: `Test PSP ${generateId()}`,
    document: `12.345.678/0001-${generateId().slice(0, 10)}-${pspCounter}`,
  };
}

export function createTestKey(pspId: string) {
  return {
    pspId,
    key: `+55${generateId().slice(0, 11)}`,
    name: `Test Key ${generateId()}`,
    document: `98.765.432/0001-${generateId().slice(0, 2)}`,
  };
}

export function createTestTransfer(pspOriginId: string, keyId: string) {
  return {
    keyId,
    holder: {
      name: "Test Holder",
      document: "123.456.789-00",
    },
    amount: toCents(100.5),
  };
}

export function createTestWebhook(pspId: string) {
  return {
    pspId,
    targetUrl: "https://webhook.site/test-webhook",
  };
}

export async function waitForEventProcessing(ms = 500): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
