import { z } from "zod";

export const offerSchema = z.object({
  bidderName: z.string().trim().min(3, "Podaj nazwę wykonawcy").max(300),
  bidderEmail: z.string().trim().email("Podaj prawidłowy adres e-mail").max(254),
  bidderNip: z.union([z.string().trim().regex(/^\d{10}$/, "NIP musi składać się z 10 cyfr"), z.literal("")]).optional(),
  price: z.coerce.number().positive("Cena musi być większa od zera").max(9_999_999_999.99).multipleOf(0.01, "Cena może mieć najwyżej dwa miejsca po przecinku"),
  description: z.string().trim().max(10_000).optional(),
  confirmation: z.literal(true, { error: "Potwierdź prawdziwość danych i warunki złożenia oferty" }),
  website: z.string().max(0).optional(),
  attachmentIds: z.array(z.string().min(10)).max(5).optional(),
});

/** Build the offer API body. Confirmation must be passed explicitly — Radix Checkbox is not form-associated and never appears in FormData. */
export function buildOfferPayload(form: FormData, confirmation: boolean, attachmentIds: string[] = []) {
  return {
    bidderName: form.get("bidderName"),
    bidderEmail: form.get("bidderEmail"),
    bidderNip: form.get("bidderNip"),
    price: form.get("price"),
    description: form.get("description"),
    confirmation,
    website: form.get("website"),
    attachmentIds,
  };
}
