import { createHash } from "node:crypto";

function canonicalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return Object.keys(object).sort().reduce<Record<string, unknown>>((result, key) => {
      result[key] = canonicalize(object[key]);
      return result;
    }, {});
  }
  return value;
}

export function sha256Checksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");
}
