import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { MAX_FILE_SIZE } from "@/lib/utils";
import { createUploadToken } from "@/lib/upload-token";
import { apiError } from "@/lib/api-error";

const allowedFiles: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/zip": [".zip"],
};

const uploadDirectory = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    if (!(await checkRateLimit(`offer-upload:${ip}`, 20, 3600000)).success) {
      return NextResponse.json({ error: "Limit przesyłania plików" }, { status: 429 });
    }

    const session = await auth();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Nie wybrano pliku" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Plik przekracza limit 10 MB" }, { status: 400 });

    const extension = path.extname(file.name).toLowerCase();
    if (!allowedFiles[file.type]?.includes(extension)) {
      return NextResponse.json({ error: "Niedozwolony typ pliku (PDF, DOCX, XLSX, ZIP)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!(extension === ".pdf" ? buffer.subarray(0, 5).toString() === "%PDF-" : buffer[0] === 0x50 && buffer[1] === 0x4b)) {
      return NextResponse.json({ error: "Zawartość nie odpowiada typowi pliku" }, { status: 400 });
    }

    const fileName = `${randomUUID()}${extension}`;
    const filePath = `/api/uploads/${fileName}`;
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, fileName), buffer, { flag: "wx" });

    const uploadedFile = {
      fileName,
      originalName: path.basename(file.name),
      mimeType: file.type,
      fileSize: file.size,
      filePath,
    };

    const id = createUploadToken({
      userId: session?.user?.id || `guest:${ip}`,
      ...uploadedFile,
      purpose: "offer",
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return NextResponse.json({ file: { id, ...uploadedFile } }, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
