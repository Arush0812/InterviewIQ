import "dotenv/config";
import crypto from "crypto";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const secret = process.env.STREAM_SECRET_KEY;
const webhookUrl = process.argv[2];

if (!webhookUrl) {
  console.error("Usage: node scripts/set-stream-webhook.js <ngrok-url>");
  process.exit(1);
}

const fullUrl = `${webhookUrl}/api/webhooks/stream`;

// Generate server-side JWT
function generateServerToken() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ server: true })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

const token = generateServerToken();

// Try the chat API endpoint which uses webhook_url
const response = await fetch(`https://chat.stream-io-api.com/app?api_key=${apiKey}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "Authorization": token,
    "stream-auth-type": "jwt",
  },
  body: JSON.stringify({
    webhook_url: fullUrl,
    webhook_events: ["call.transcription_ready", "call.recording_ready"],
  }),
});

const data = await response.json();
console.log("Status:", response.status);
console.log("Response:", JSON.stringify(data, null, 2));
