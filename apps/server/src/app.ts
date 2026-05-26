import cors from "cors";
import express from "express";
import { prisma } from "./db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogging } from "./middleware/requestLogging.js";
import { roomsRouter } from "./routes/rooms.js";
import { uploadsDirectory, uploadsRouter } from "./routes/uploads.js";
import { isOriginAllowed } from "./services/cors.js";
import { logger } from "./services/logger.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: (origin, callback) => callback(null, isOriginAllowed(origin)) }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static(uploadsDirectory));
  app.use(requestLogging);

  app.get("/health", async (_request, response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.json({ ok: true });
    } catch (error) {
      logger.error("health_check_failed", { error });
      response.status(503).json({ ok: false });
    }
  });

  app.use("/rooms", roomsRouter);
  app.use("/uploads", uploadsRouter);
  app.use(errorHandler);

  return app;
}
