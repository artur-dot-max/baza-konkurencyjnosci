import { prisma } from "@/lib/prisma";

type ErrorLogInput = {
  message: string;
  stack?: string | null;
  path?: string | null;
  method?: string | null;
  statusCode?: number;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId?: string | null;
};

export async function createErrorLog(input: ErrorLogInput): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        message: input.message.slice(0, 4000),
        stack: input.stack?.slice(0, 8000) || null,
        path: input.path?.slice(0, 500) || null,
        method: input.method?.slice(0, 20) || null,
        statusCode: input.statusCode ?? 500,
        details: input.details?.slice(0, 4000) || null,
        ipAddress: input.ipAddress?.slice(0, 100) || null,
        userAgent: input.userAgent?.slice(0, 500) || null,
        userId: input.userId || null,
      },
    });
  } catch (error) {
    console.error("Failed to create error log:", error instanceof Error ? error.name : "unknown");
  }
}

export function errorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message || error.name || "Unknown error",
      stack: error.stack || null,
      details: error.name,
    };
  }
  return {
    message: typeof error === "string" ? error : "Unknown error",
    stack: null,
    details: null,
  };
}
