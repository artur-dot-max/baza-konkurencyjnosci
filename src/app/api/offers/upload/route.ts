import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { createUploadToken } from "@/lib/upload-token";
import { apiError } from "@/lib/api-error";
import { offerUploadOwner } from "@/lib/offer-security";
import { assertUploadRequestSize, UploadValidationError, validateUploadedFile } from "@/lib/file-validation";

const uploadDirectory = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    if (!(await checkRateLimit(`offer-upload:${ip}`, 20, 3600000)).success) {
      return NextResponse.json({ error: "Limit przesyłania plików" }, { status: 429 });
    }

    const session = await auth();
    assertUploadRequestSize(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Nie wybrano pliku" }, { status: 400 });
    const { buffer, extension, mimeType } = await validateUploadedFile(file);

    const fileName = `${randomUUID()}${extension}`;
    const filePath = `/api/uploads/${fileName}`;
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), buffer, { flag: "wx" });

    const uploadedFile = {
      fileName,
      originalName: path.basename(file.name),
      mimeType,
      fileSize: file.size,
      filePath,
    };

    const id = createUploadToken({
      userId: offerUploadOwner(session, request),
      ...uploadedFile,
      purpose: "offer",
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return NextResponse.json({ file: { id, ...uploadedFile } }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return apiError(error, request);
  }
}
