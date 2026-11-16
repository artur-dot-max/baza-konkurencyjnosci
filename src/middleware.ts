import { NextResponse, type NextRequest } from "next/server";

function contentSecurityPolicy(nonce: string) {
  const development = process.env.NODE_ENV === "development";
  // Hashes cover the deterministic style attributes emitted by next/image and Next's route announcer.
  // `unsafe-hashes` permits only these exact values; arbitrary inline styles remain blocked.
  const nextStyleAttributeHashes = [
    "'sha256-zlqnbDt84zf1iSefLU/ImC54isoprH/MRiVZGskwexk='", // color:transparent
    "'sha256-32t0bJPIyxns/QqsW8RE3JGUERKnHL5RygHBgJvEanc='", // route announcer host
    "'sha256-W5We/oMPhbbNLn0CLyW3vpupRXWyEdAeTI+cDFTkH3U='", // route announcer content
  ].join(" ");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    `style-src-attr 'unsafe-hashes' ${nextStyleAttributeHashes}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${development ? " ws: http:" : ""}`,
    "frame-src 'self' https://www.openstreetmap.org",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|uploads).*)",
  ],
};
