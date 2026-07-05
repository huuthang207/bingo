import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { Router, type Request } from "express";
import { rateLimit } from "../middleware/rateLimit.js";

const maxFileSizeBytes = 10 * 1024 * 1024;
const maxFilesPerUpload = 10;
const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

type UploadRequest = Request & {
  trackedUploadPaths?: string[];
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDirectory = path.resolve(currentDir, "../../uploads");

mkdirSync(uploadsDirectory, { recursive: true });

function trackUploadedFile(request: Request, filename: string) {
  const uploadRequest = request as UploadRequest;
  uploadRequest.trackedUploadPaths ??= [];
  uploadRequest.trackedUploadPaths.push(path.join(uploadsDirectory, filename));
}

async function cleanupTrackedUploads(request: Request) {
  const uploadRequest = request as UploadRequest;

  if (!uploadRequest.trackedUploadPaths?.length) {
    return;
  }

  await Promise.allSettled(uploadRequest.trackedUploadPaths.map((filePath) => rm(filePath, { force: true })));
  uploadRequest.trackedUploadPaths = [];
}

function imageLabelFromFileName(fileName: string) {
  const baseName = path.basename(fileName, path.extname(fileName)).trim();
  return baseName || "Ảnh";
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename: (request, file, callback) => {
      const extension = allowedMimeTypes.get(file.mimetype);

      if (!extension) {
        callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "files"), "");
        return;
      }

      const filename = `${randomUUID()}${extension}`;
      trackUploadedFile(request, filename);
      callback(null, filename);
    },
  }),
  limits: { fileSize: maxFileSizeBytes, files: maxFilesPerUpload },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "files"));
      return;
    }

    callback(null, true);
  },
});

export const uploadsRouter = Router();

const uploadRateLimit = rateLimit({ keyPrefix: "upload", windowMs: 60_000, maxRequests: 10 });

uploadsRouter.post("/", uploadRateLimit, (request, response) => {
  upload.array("files", maxFilesPerUpload)(request, response, (error) => {
    void (async () => {
      if (error instanceof multer.MulterError) {
        await cleanupTrackedUploads(request);

        if (error.code === "LIMIT_FILE_SIZE") {
          response.status(400).json({ message: "Mỗi ảnh không được vượt quá 10MB." });
          return;
        }

        if (error.code === "LIMIT_FILE_COUNT") {
          response.status(400).json({ message: "Chỉ được tải tối đa 10 ảnh mỗi lần." });
          return;
        }

        response.status(400).json({ message: "Chỉ hỗ trợ file ảnh jpg, png hoặc webp." });
        return;
      }

      if (error) {
        await cleanupTrackedUploads(request);
        response.status(400).json({ message: "Không thể upload ảnh." });
        return;
      }

      const files = Array.isArray(request.files) ? request.files : [];

      if (!files.length) {
        await cleanupTrackedUploads(request);
        response.status(400).json({ message: "Thiếu file ảnh." });
        return;
      }

      response.status(201).json({
        items: files.map((file) => ({
          url: `/uploads/${file.filename}`,
          label: imageLabelFromFileName(file.originalname),
        })),
      });
    })().catch(async () => {
      await cleanupTrackedUploads(request);

      if (!response.headersSent) {
        response.status(400).json({ message: "Không thể upload ảnh." });
      }
    });
  });
});
