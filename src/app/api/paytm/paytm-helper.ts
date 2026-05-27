import crypto from "node:crypto";

const IV = "@@@@&&&&####$$$$";

export class PaytmChecksum {
  static encrypt(input: string, key: string): string {
    const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(key, "utf8"), Buffer.from(IV, "utf8"));
    let encrypted = cipher.update(input, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  }

  static decrypt(encrypted: string, key: string): string {
    const decipher = crypto.createDecipheriv("aes-128-cbc", Buffer.from(key, "utf8"), Buffer.from(IV, "utf8"));
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    try {
      decrypted += decipher.final("utf8");
    } catch (e) {
      console.error("Paytm Decrypt Error:", e);
    }
    return decrypted;
  }

  static generateRandomString(length: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const byteLength = Math.ceil((length * 3) / 4);
      crypto.randomBytes(byteLength, (err, buf) => {
        if (err) {
          reject(err);
        } else {
          const salt = buf.toString("base64").substring(0, length);
          resolve(salt);
        }
      });
    });
  }

  static calculateHash(params: string, salt: string): string {
    const finalString = params + "|" + salt;
    return crypto.createHash("sha256").update(finalString).digest("hex") + salt;
  }

  static calculateChecksum(params: string, key: string, salt: string): string {
    const hashString = this.calculateHash(params, salt);
    return this.encrypt(hashString, key);
  }

  static async generateSignature(params: any, key: string): Promise<string> {
    let paramsString = typeof params === "string" ? params : this.getStringByParams(params);
    const salt = await this.generateRandomString(4);
    return this.calculateChecksum(paramsString, key, salt);
  }

  static verifySignature(params: any, key: string, checksum: string): boolean {
    if (typeof params === "object" && params !== null) {
      if ("CHECKSUMHASH" in params) {
        delete (params as any).CHECKSUMHASH;
      }
    }
    let paramsString = typeof params === "string" ? params : this.getStringByParams(params);
    const decryptedHash = this.decrypt(checksum, key);
    if (!decryptedHash || decryptedHash.length < 4) {
      return false;
    }
    const salt = decryptedHash.substring(decryptedHash.length - 4);
    const expectedHash = this.calculateHash(paramsString, salt);
    return decryptedHash === expectedHash;
  }

  static getStringByParams(params: any): string {
    const data: Record<string, string> = {};
    Object.keys(params).sort().forEach((key) => {
      const val = params[key];
      data[key] = (val !== null && val !== undefined && String(val).toLowerCase() !== "null") ? String(val) : "";
    });
    return Object.values(data).join("|");
  }
}
