import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getPhonePeConfig() {
  let clientId = process.env.PHONEPE_CLIENT_ID;
  let clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  let clientVersion = process.env.NEXT_PUBLIC_PHONEPE_CLIENT_VERSION || "1";
  let peEnv = process.env.NEXT_PUBLIC_PHONEPE_ENV || "sandbox";

  try {
    const ctx = getCloudflareContext();
    if (ctx && ctx.env) {
      clientId = clientId || (ctx.env as any).PHONEPE_CLIENT_ID;
      clientSecret = clientSecret || (ctx.env as any).PHONEPE_CLIENT_SECRET;
      clientVersion = clientVersion || (ctx.env as any).NEXT_PUBLIC_PHONEPE_CLIENT_VERSION || "1";
      peEnv = peEnv || (ctx.env as any).NEXT_PUBLIC_PHONEPE_ENV || "sandbox";
    }
  } catch (e) {
    // Ignore if not running in Cloudflare context
  }

  // Handle bundler replacement quirks
  if (clientId === "undefined" || clientId === "null") clientId = undefined;
  if (clientSecret === "undefined" || clientSecret === "null") clientSecret = undefined;

  const isProduction = peEnv === "production" || peEnv === "live";

  const tokenUrl = isProduction
    ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

  const payUrl = isProduction
    ? "https://api.phonepe.com/apis/pg/checkout/v2/pay"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

  const statusUrl = (orderId: string) => isProduction
    ? `https://api.phonepe.com/apis/pg/checkout/v2/order/${orderId}/status`
    : `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${orderId}/status`;

  return {
    clientId,
    clientSecret,
    clientVersion,
    peEnv,
    tokenUrl,
    payUrl,
    statusUrl,
    isValid: !!(clientId && clientSecret),
  };
}

export async function getPhonePeToken(config: ReturnType<typeof getPhonePeConfig>) {
  if (!config.clientId || !config.clientSecret) {
    throw new Error("PhonePe credentials are not configured.");
  }

  const formData = new URLSearchParams();
  formData.append("client_id", config.clientId);
  formData.append("client_version", config.clientVersion);
  formData.append("client_secret", config.clientSecret);
  formData.append("grant_type", "client_credentials");

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate PhonePe token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token as string;
}
