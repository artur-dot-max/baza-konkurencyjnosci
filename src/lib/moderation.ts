import { z } from "zod";

const FORBIDDEN_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export const publicQuestionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, "Treść pytania musi mieć co najmniej 10 znaków")
    .max(10000, "Treść pytania może mieć maksymalnie 10 000 znaków")
    .refine((value) => !FORBIDDEN_CONTROL_CHARACTERS.test(value), "Treść zawiera niedozwolone znaki sterujące"),
  authorEmail: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  authorName: z.string().trim().max(200).optional(),
});

export function redactQuestionAuthor<
  Question extends { authorEmail?: string | null; authorName?: string | null }
>(question: Question): Omit<Question, "authorEmail" | "authorName"> {
  const { authorEmail: _authorEmail, authorName: _authorName, ...publicQuestion } = question;
  return publicQuestion;
}
