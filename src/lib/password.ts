import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .max(72, "Hasło może mieć maksymalnie 72 znaki")
  .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
  .regex(/[0-9]/, "Hasło musi zawierać cyfrę");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Podaj aktualne hasło"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Potwierdź nowe hasło"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła muszą być takie same",
    path: ["confirmPassword"],
  });
