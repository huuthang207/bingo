import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { Router } from "express";
import { rateLimit } from "../middleware/rateLimit.js";

const maxFileSizeBytes = 2 * 1024 * 1024;
const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDirectory = path.resolve(currentDir, "../../uploads");

mkdirSync(uploadsDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename: (_request, file, callback) => {
      const extension = allowedMimeTypes.get(file.mimetype);
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: maxFileSizeBytes },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
      return;
    }

    callback(null, true);
  },
});

export const uploadsRouter = Router();

const uploadRateLimit = rateLimit({ keyPrefix: "upload", windowMs: 60_000, maxRequests: 20 });

uploadsRouter.post("/", uploadRateLimit, (request, response) => {
  upload.single("file")(request, response, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        response.status(400).json({ message: "Ảnh không được vượt quá 2MB." });
        return;
      }

      response.status(400).json({ message: "Chỉ hỗ trợ file ảnh jpg, png hoặc webp." });
      return;
    }

    if (error) {
      response.status(400).json({ message: "Không thể upload ảnh." });
      return;
    }

    if (!request.file) {
      response.status(400).json({ message: "Thiếu file ảnh." });
      return;
    }

    const label = typeof request.body.label === "string" && request.body.label.trim() ? request.body.label.trim() : null;

    response.status(201).json({
      url: `/uploads/${request.file.filename}`,
      label,
    });
  });
});
