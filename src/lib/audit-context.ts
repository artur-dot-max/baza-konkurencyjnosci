import { requestIp } from "./rate-limit";

export type AuditRequestContext = {
  ipAddress: string;
  userAgent: string | null;
  path: string;
};

export function auditRequestContext(request: Request, path = new URL(request.url).pathname): AuditRequestContext {
  return {
    ipAddress: requestIp(request),
    userAgent: request.headers.get("user-agent"),
    path,
  };
}

export function auditRequestFields(request: Request) {
  const context = auditRequestContext(request);
  return { ipAddress: context.ipAddress, userAgent: context.userAgent };
}

export function auditHeadersContext(headers: Headers, path: string): AuditRequestContext {
  return auditRequestContext(new Request("http://internal.local", { headers }), path);
}
