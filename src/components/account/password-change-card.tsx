"use client";

import type { FormEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { changePasswordSchema } from "@/lib/password";

type PasswordForm = z.infer<typeof changePasswordSchema>;
type FormMessage = { type: "ok" | "error"; text: string } | null;

export function PasswordChangeCard({
  form,
  message,
  onSubmit,
}: {
  form: UseFormReturn<PasswordForm>;
  message: FormMessage;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-[#145447]" />
          Zmiana hasła
        </CardTitle>
        <CardDescription>
          Hasło musi mieć 8–72 znaki, co najmniej jedną wielką literę i cyfrę. Po zmianie wylogujemy Cię ze wszystkich sesji.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Aktualne hasło</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={form.formState.errors.currentPassword ? true : undefined}
              aria-describedby={form.formState.errors.currentPassword ? "currentPassword-error" : undefined}
              {...form.register("currentPassword")}
            />
            {form.formState.errors.currentPassword ? (
              <p id="currentPassword-error" className="text-xs text-red-600">{form.formState.errors.currentPassword.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={form.formState.errors.newPassword ? true : undefined}
              aria-describedby={form.formState.errors.newPassword ? "newPassword-error" : undefined}
              {...form.register("newPassword")}
            />
            {form.formState.errors.newPassword ? (
              <p id="newPassword-error" className="text-xs text-red-600">{form.formState.errors.newPassword.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={form.formState.errors.confirmPassword ? true : undefined}
              aria-describedby={form.formState.errors.confirmPassword ? "confirmPassword-error" : undefined}
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword ? (
              <p id="confirmPassword-error" className="text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>
            ) : null}
          </div>
          {message ? (
            <div className={`flex items-start gap-2 rounded-md p-3 text-sm ${message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
              {message.type === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
              <span>{message.text}</span>
            </div>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting} className="bg-[#145447] hover:bg-[#0D4036]">
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Zmień hasło
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
