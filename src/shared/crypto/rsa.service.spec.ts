import { describe, expect, it } from "vitest";
import { RsaService } from "./rsa.service";

describe("RsaService", () => {
  const service = new RsaService();

  it("generates a valid RSA key pair in Base64", () => {
    const pair = service.generateKeyPair();
    expect(pair.privateKey).toBeTruthy();
    expect(pair.publicKey).toBeTruthy();
  });

  it("validates a matching key pair", () => {
    const pair = service.generateKeyPair();
    expect(service.isKeyPairValid(pair.privateKey, pair.publicKey)).toBe(true);
  });

  it("rejects a mismatched key pair", () => {
    const a = service.generateKeyPair();
    const b = service.generateKeyPair();
    expect(service.isKeyPairValid(a.privateKey, b.publicKey)).toBe(false);
  });

  it("rejects invalid input", () => {
    expect(service.isKeyPairValid("not-a-key", "not-a-key")).toBe(false);
  });
});
