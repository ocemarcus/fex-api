import { Injectable } from "@nestjs/common";
import { createPrivateKey, createPublicKey, generateKeyPairSync } from "node:crypto";

export interface RsaKeyPair {
  privateKey: string;
  publicKey: string;
}

@Injectable()
export class RsaService {
  generateKeyPair(): RsaKeyPair {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    return {
      privateKey: Buffer.from(privateKey, "utf8").toString("base64"),
      publicKey: Buffer.from(publicKey, "utf8").toString("base64"),
    };
  }

  isKeyPairValid(privateKeyBase64: string, publicKeyBase64: string): boolean {
    try {
      const privatePem = Buffer.from(privateKeyBase64, "base64").toString("utf8");
      const publicPem = Buffer.from(publicKeyBase64, "base64").toString("utf8");

      const privateKey = createPrivateKey(privatePem);
      const derivedPublicKey = createPublicKey(privateKey).export({
        type: "spki",
        format: "der",
      });
      const providedPublicKey = createPublicKey(publicPem).export({
        type: "spki",
        format: "der",
      });

      return derivedPublicKey.equals(providedPublicKey);
    } catch {
      return false;
    }
  }
}
