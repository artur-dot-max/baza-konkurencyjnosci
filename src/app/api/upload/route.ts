import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { createUploadToken, verifyUploadToken } from "@/lib/upload-token";
import { canWriteOrganization } from "@/lib/access";
import { assertUploadRequestSize, UploadValidationError, validateUploadedFile } from "@/lib/file-validation";

const uploadDirectory = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (
      session.user.role === "ORGANIZATION" &&
      session.user.organizationId &&
      !canWriteOrganization(session, session.user.organizationId)
    ) {
      return NextResponse.json({ error: "Brak uprawnień do przesyłania plików (rola: tylko podgląd)" }, { status: 403 });
    }

    if (!(await checkRateLimit(`upload:${session.user.id}`, 30, 3600000)).success) return NextResponse.json({ error: "Limit przesyłania plików" }, { status: 429 });
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
      userId: session.user.id,
      ...uploadedFile,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return NextResponse.json({ file: { id, ...uploadedFile } }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Nie udało się zapisać pliku" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    const upload = typeof id === "string" ? verifyUploadToken(id, session.user.id) : null;
    if (!upload) return NextResponse.json({ error: "Nieprawidłowy identyfikator pliku" }, { status: 400 });

    if (await prisma.attachment.count({ where: { fileName: upload.fileName } })) return NextResponse.json({ error: "Plik jest przypisany do ogłoszenia" }, { status: 409 });
    const absolutePath = path.resolve(uploadDirectory, upload.fileName);
    if (!absolutePath.startsWith(`${uploadDirectory}${path.sep}`)) {
      return NextResponse.json({ error: "Nieprawidłowa ścieżka pliku" }, { status: 400 });
    }
    await unlink(absolutePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Removing upload failed:", error);
    return NextResponse.json({ error: "Nie udało się usunąć pliku" }, { status: 500 });
  }
}
