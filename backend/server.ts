import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initWebSocketServer } from "./lib/ws-server";
import { startPriceStreamer } from "./lib/services/prices";
import { startSentimentJob } from "./lib/services/sentiment";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = initWebSocketServer(server);

  startPriceStreamer(wss);
  startSentimentJob(wss);

  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔌 WebSocket listo`);
  });
});
