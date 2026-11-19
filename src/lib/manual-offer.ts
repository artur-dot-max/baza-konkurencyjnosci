import { z } from "zod";

export const EXTERNAL_OFFER_METHODS = ["EMAIL", "IN_PERSON", "E_DELIVERY"] as const;

export const manualOfferSchema = z.object({
  bidderName: z.string().trim().min(2, "Podaj nazwę wykonawcy").max(300),
  bidderEmail: z.union([z.string().trim().email("Podaj prawidłowy adres e-mail").max(254), z.literal("")]).default(""),
  bidderNip: z.union([z.string().trim().regex(/^\d{10}$/, "NIP powinien zawierać 10 cyfr"), z.literal("")]).default(""),
  price: z.coerce.number().positive("Cena musi być większa od zera").max(9_999_999_999.99),
  description: z.string().trim().max(10_000).default(""),
  submissionMethod: z.enum(EXTERNAL_OFFER_METHODS),
  submittedAt: z.coerce.date().refine((date) => date <= new Date(), "Data złożenia nie może być przyszła"),
  entryNote: z.string().trim().max(2_000).default(""),
  attachmentIds: z.array(z.string().min(1)).max(5).default([]),
});
