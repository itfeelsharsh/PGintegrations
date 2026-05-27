import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const baseConfig = defineCloudflareConfig({
  // You can configure Kv incremental cache or other Cloudflare features here if needed in the future
});

export default {
  ...baseConfig,
  buildCommand: "npm run build:next",
};
