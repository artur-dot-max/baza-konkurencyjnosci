import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createErrorLog, errorDetails } from "@/lib/error-log";

export function apiError(error: unknown, request?: Request) {
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Nieprawidłowy format danych" }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return NextResponse.json({ error: "Rekord o tych danych już istnieje" }, { status: 409 });
    if (error.code === "P2025") return NextResponse.json({ error: "Rekord został zmieniony lub nie istnieje. Odśwież stronę." }, { status: 409 });
  }

  const details = errorDetails(error);
  console.error("API operation failed", details.message);
  void createErrorLog({
    message: details.message,
    stack: details.stack,
    details: details.details,
    path: request ? new URL(request.url).pathname : null,
    method: request?.method || null,
    statusCode: 500,
    ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request?.headers.get("x-real-ip"),
    userAgent: request?.headers.get("user-agent"),
  });

  return NextResponse.json({ error: "Nie udało się wykonać operacji" }, { status: 500 });
}
