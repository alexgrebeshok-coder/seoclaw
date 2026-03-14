import { NextRequest } from "next/server";

import { badRequest } from "@/lib/server/api-utils";
import type { ImportInputFile } from "@/lib/import/types";

// P2-2: Import size caps to prevent DoS
const MAX_FILE_COUNT = 10; // Max 10 files per request
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB total payload

interface JsonImportFile {
  name?: unknown;
  mimeType?: unknown;
  contentBase64?: unknown;
  text?: unknown;
}

export async function extractImportFiles(request: NextRequest): Promise<ImportInputFile[]> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return extractFilesFromFormData(request);
  }

  return extractFilesFromJson(request);
}

async function extractFilesFromFormData(request: NextRequest): Promise<ImportInputFile[]> {
  const formData = await request.formData();
  const formFiles = formData.getAll("files");

  // P2-2: Enforce file count limit
  if (formFiles.length > MAX_FILE_COUNT) {
    throw badRequest(
      `Too many files. Maximum ${MAX_FILE_COUNT} files allowed per request.`
    );
  }

  const files = await Promise.all(
    formFiles
      .filter((entry): entry is File => entry instanceof File)
      .map(async (file) => {
        // P2-2: Enforce file size limit
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw badRequest(
            `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`
          );
        }

        return {
          name: file.name,
          mimeType: file.type,
          bytes: new Uint8Array(await file.arrayBuffer()),
        };
      })
  );

  if (!files.length) {
    throw badRequest("Request must include one or more files.");
  }

  return files;
}

async function extractFilesFromJson(request: NextRequest): Promise<ImportInputFile[]> {
  const body = await request.json();
  const files = Array.isArray(body?.files) ? (body.files as JsonImportFile[]) : [];

  if (!files.length) {
    throw badRequest("Request body must include a non-empty files array.");
  }

  // P2-2: Enforce file count limit
  if (files.length > MAX_FILE_COUNT) {
    throw badRequest(
      `Too many files. Maximum ${MAX_FILE_COUNT} files allowed per request.`
    );
  }

  const normalizedFiles: ImportInputFile[] = [];
  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = normalizeJsonFile(files[i], i);

    // P2-2: Enforce file size limit
    if (file.bytes.length > MAX_FILE_SIZE_BYTES) {
      throw badRequest(
        `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`
      );
    }

    totalSize += file.bytes.length;
    normalizedFiles.push(file);
  }

  // P2-2: Enforce total size limit
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    throw badRequest(
      `Total payload size exceeds maximum of ${MAX_TOTAL_SIZE_BYTES / 1024 / 1024} MB.`
    );
  }

  return normalizedFiles;
}

function normalizeJsonFile(file: JsonImportFile, index: number): ImportInputFile {
  if (typeof file.name !== "string" || !file.name.trim()) {
    throw badRequest(`files[${index}].name is required.`);
  }

  if (typeof file.contentBase64 === "string" && file.contentBase64.length > 0) {
    // P2-2: Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(file.contentBase64)) {
      throw badRequest(`files[${index}].contentBase64 is not valid base64.`);
    }

    return {
      name: file.name,
      mimeType: typeof file.mimeType === "string" ? file.mimeType : undefined,
      bytes: new Uint8Array(Buffer.from(file.contentBase64, "base64")),
    };
  }

  if (typeof file.text === "string") {
    return {
      name: file.name,
      mimeType: typeof file.mimeType === "string" ? file.mimeType : "text/plain",
      bytes: new TextEncoder().encode(file.text),
    };
  }

  throw badRequest(
    `files[${index}] must include either contentBase64 or text content.`
  );
}
