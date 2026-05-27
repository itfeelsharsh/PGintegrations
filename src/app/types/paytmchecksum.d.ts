declare module "paytmchecksum" {
  export default class PaytmChecksum {
    static generateSignature(params: string | object, key: string): Promise<string>;
    static verifySignature(params: string | object, key: string, checksum: string): boolean;
    static encrypt(input: string, key: string): string;
    static decrypt(encrypted: string, key: string): string;
  }
}
