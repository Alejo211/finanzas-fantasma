import axios from "axios";

export async function sendDiscordAlert(message: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    await axios.post(url, { username: "Finanzas Fantasma 🤖", content: message });
  } catch {}
}
