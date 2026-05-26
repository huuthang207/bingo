import type { RequestHandler } from "express";
import { logger } from "../services/logger.js";

export const requestLogging: RequestHandler = (request, response, next) => {
  const startedAt = performance.now();

  response.on("finish", () => {
    logger.info("http_request", {
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
      ip: request.ip || request.socket.remoteAddress || "unknown",
    });
  });

  next();
};
