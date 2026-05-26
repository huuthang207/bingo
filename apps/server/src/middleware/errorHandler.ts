import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../services/logger.js";

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    logger.warn("validation_error", {
      method: request.method,
      path: request.path,
      issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
    response.status(400).json({ message: "Dữ liệu không hợp lệ." });
    return;
  }

  logger.error("unhandled_request_error", {
    method: request.method,
    path: request.path,
    error,
  });

  response.status(500).json({ message: "Lỗi máy chủ." });
};
