const clientId = "d226bcd1-194c-429c-865c-33c366e86719";
const clientSecret = "45603e33249549999d1e42853b707320";
const baseUrl = "https://pluraluat.v2.pinepg.in";
const timestamp = new Date().toISOString();
const requestId = crypto.randomUUID();

console.log("Sending request to:", `${baseUrl}/api/auth/v1/token`);
console.log("Timestamp:", timestamp);
console.log("Request-ID:", requestId);

fetch(`${baseUrl}/api/auth/v1/token`, {
  method: "POST",
  headers: {
    "accept": "application/json",
    "content-type": "application/json",
    "Request-Timestamp": timestamp,
    "Request-ID": requestId,
  },
  body: JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  }),
})
.then(async res => {
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log("Body:", text);
})
.catch(err => {
  console.error("Error:", err);
});
