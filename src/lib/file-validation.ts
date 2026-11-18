import path from "path";
import { fileTypeFromBuffer } from "file-type";
import { MAX_FILE_SIZE } from "@/lib/utils";

const allowedFiles: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export class UploadValidationError extends Error {
  constructor(message: string, readonly status: 400 | 413 | 503 = 400) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export function assertUploadRequestSize(request: Request): void {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE + 1024 * 1024) {
    throw new UploadValidationError("Żądanie przekracza dopuszczalny rozmiar", 413);
  }
}

async function scanForMalware(buffer: Buffer, originalName: string): Promise<void> {
  const testDatabase = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).pathname.endsWith("_test")
    : false;
  if (process.env.E2E_TEST_MODE === "true" && testDatabase) return;

  const scannerUrl = process.env.MALWARE_SCAN_URL?.trim();
  if (!scannerUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new UploadValidationError("Skaner bezpieczeństwa plików jest niedostępny", 503);
    }
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(scannerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-File-Name": encodeURIComponent(path.basename(originalName)),
        ...(process.env.MALWARE_SCAN_TOKEN && {
          Authorization: `Bearer ${process.env.MALWARE_SCAN_TOKEN}`,
        }),
      },
      body: new Uint8Array(buffer),
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 422) {
      throw new UploadValidationError("Plik został odrzucony przez skaner bezpieczeństwa");
    }
    if (response.status !== 204) {
      throw new UploadValidationError("Skaner bezpieczeństwa plików jest niedostępny", 503);
    }
  } catch (error) {
    if (error instanceof UploadValidationError) throw error;
    throw new UploadValidationError("Skaner bezpieczeństwa plików jest niedostępny", 503);
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateUploadedFile(file: File) {
  if (file.size <= 0) throw new UploadValidationError("Plik jest pusty");
  if (file.size > MAX_FILE_SIZE) throw new UploadValidationError("Plik przekracza limit 10 MB");

  const extension = path.extname(file.name).toLowerCase();
  const expectedMime = allowedFiles[extension];
  if (!expectedMime || file.type !== expectedMime) {
    throw new UploadValidationError("Niedozwolony typ pliku (PDF, DOCX, XLSX)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || detected.ext !== extension.slice(1) || detected.mime !== expectedMime) {
    throw new UploadValidationError("Zawartość nie odpowiada deklarowanemu typowi pliku");
  }

  await scanForMalware(buffer, file.name);
  return { buffer, extension, mimeType: expectedMime };
}
