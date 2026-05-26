import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { logger } from "./services/logger.js";
import { registerSocketHandlers } from "./socket.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  },
});

registerSocketHandlers(io);

httpServer.on("error", (error) => {
  logger.error("server_error", { error });
});

httpServer.listen(port, () => {
  logger.info("server_started", { port });
});
