import { z } from "zod";
import { SUBMISSION_METHODS } from "@/lib/utils";
export const MIN_BID_DAYS = 7;
const eDeliveryPattern = /^AE:PL-\d{5}-\d{5}-[A-Z]{5}-\d{2}$/i;
export const criterionSchema = z.object({ name: z.string().trim().min(1).max(200), weight: z.coerce.number().positive().max(100) });
export const criteriaSchema = z.array(criterionSchema).min(1).max(30).refine(items => Math.abs(items.reduce((n, c) => n + c.weight, 0) - 100) < 0.01, "Suma wag musi wynosić 100%");
export const announcementSchema = z.object({
  procedureNumber: z.string().trim().min(1).max(100), title: z.string().trim().min(1).max(500),
  orderType: z.enum(["SUPPLIES", "SERVICES", "CONSTRUCTION"]),
  voivodeship: z.string().trim().min(1).max(100), location: z.string().trim().min(1).max(200),
  executionTerm: z.string().trim().min(1).max(300), description: z.string().min(1).max(100000),
  conditions: z.string().max(100000).default(""), criteria: criteriaSchema,
  publishedAt: z.string().default(""), bidsDeadline: z.string().default(""),
  contactPerson: z.string().trim().max(200).default(""), contactEmail: z.union([z.string().email(), z.literal("")]).default(""),
  contactPhone: z.string().trim().max(30).default(""), submissionMethods: z.array(z.enum(SUBMISSION_METHODS)).max(SUBMISSION_METHODS.length).refine((methods) => new Set(methods).size === methods.length, "Każdy sposób składania ofert można wybrać tylko raz").default([]),
  eDeliveryAddress: z.string().trim().max(26).default(""),
  attachmentIds: z.array(z.string()).max(10).default([]), status: z.enum(["DRAFT", "PUBLISHED"]),
}).superRefine((data, ctx) => {
  const fail = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  for (const field of ["publishedAt", "bidsDeadline"] as const) if (data[field] && !Number.isFinite(Date.parse(data[field]))) fail(field, "Nieprawidłowa data");
  if (data.status === "PUBLISHED") {
    if (data.title.length < 10) fail("title", "Tytuł musi mieć co najmniej 10 znaków");
    if (data.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length < 50) fail("description", "Opis musi mieć co najmniej 50 znaków");
    if (!data.publishedAt || !data.bidsDeadline) fail("bidsDeadline", "Daty są wymagane");
    if (Date.parse(data.bidsDeadline) < Date.parse(data.publishedAt) + MIN_BID_DAYS * 86400000) fail("bidsDeadline", "Termin składania ofert musi przypadać co najmniej 7 pełnych dni po otwarciu ogłoszenia");
    if (Date.parse(data.bidsDeadline) <= Date.now()) fail("bidsDeadline", "Termin składania ofert musi przypadać w przyszłości");
    if (!data.submissionMethods.length) fail("submissionMethods", "Wybierz co najmniej jeden sposób składania ofert");
    if (data.submissionMethods.includes("E_DELIVERY") && !eDeliveryPattern.test(data.eDeliveryAddress)) fail("eDeliveryAddress", "Podaj adres e-Doręczeń w formacie AE:PL-12345-67890-ABCDE-12");
  }
});

/**
 * After publish, deadline may only be extended (new >= old) while still open.
 * Shortening or re-opening after expiry is rejected.
 * @returns Polish error message, or null when the change is allowed / not requested.
 */
export function publishedBidsDeadlineChangeError(
  oldDeadline: Date | null | undefined,
  newDeadline: string | null | undefined,
  now = new Date()
): string | null {
  if (newDeadline === undefined) return null;
  if (newDeadline === null || newDeadline === "") {
    return "Nie można usunąć terminu składania ofert po publikacji";
  }
  const next = new Date(newDeadline);
  if (!Number.isFinite(next.getTime())) {
    return "Nieprawidłowa data terminu składania ofert";
  }
  if (!oldDeadline) {
    return null;
  }
  if (oldDeadline.getTime() <= now.getTime()) {
    return "Nie można zmienić terminu składania ofert po jego upływie";
  }
  if (next.getTime() < oldDeadline.getTime()) {
    return "Nie można skrócić terminu składania ofert po publikacji";
  }
  return null;
}
