"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { changePasswordSchema } from "@/lib/password";
import { BackupCodesPanel, TotpSetupPanel } from "@/components/account/totp-setup-panels";
import { PasswordChangeCard } from "@/components/account/password-change-card";

type SecurityStatus = {
  email: string;
  name: string | null;
  totpEnabled: boolean;
  backupCodesRemaining: number;
};

type PasswordForm = z.infer<typeof changePasswordSchema>;

type DisableForm = {
  password: string;
  code: string;
};

export function AccountSecuritySettings() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [totpMessage, setTotpMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [enableCode, setEnableCode] = useState("");
  const [enablePassword, setEnablePassword] = useState("");
  const [enabling, setEnabling] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableLoading, setDisableLoading] = useState(false);

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const disableForm = useForm<DisableForm>({
    defaultValues: { password: "", code: "" },
  });

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/account/security");
      if (!res.ok) throw new Error("Nie udało się pobrać ustawień konta");
      setStatus(await res.json());
    } catch (error) {
      setTotpMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Nie udało się pobrać ustawień",
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const onChangePassword = passwordForm.handleSubmit(async (data) => {
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Nie udało się zmienić hasła");
      passwordForm.reset();
      setPasswordMessage({ type: "ok", text: body.message });
      await signOut({ callbackUrl: "/logowanie" });
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Nie udało się zmienić hasła",
      });
    }
  });

  const startTotpSetup = async () => {
    setTotpMessage(null);
    setBackupCodes(null);
    setSetupLoading(true);
    try {
      const res = await fetch("/api/account/totp/setup", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Nie udało się rozpocząć konfiguracji");
      setSetup({ secret: body.secret, qrDataUrl: body.qrDataUrl });
      setEnableCode("");
      setEnablePassword("");
    } catch (error) {
      setTotpMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Nie udało się rozpocząć konfiguracji",
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const confirmTotp = async () => {
    setTotpMessage(null);
    setEnabling(true);
    try {
      const res = await fetch("/api/account/totp/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: enableCode, password: enablePassword }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Nie udało się włączyć 2FA");
      setSetup(null);
      setEnablePassword("");
      setBackupCodes(body.backupCodes);
      setTotpMessage({ type: "ok", text: body.message });
      await loadStatus();
    } catch (error) {
      setTotpMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Nie udało się włączyć 2FA",
      });
    } finally {
      setEnabling(false);
    }
  };

  const onDisableTotp = disableForm.handleSubmit(async (data) => {
    setTotpMessage(null);
    setDisableLoading(true);
    try {
      const res = await fetch("/api/account/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Nie udało się wyłączyć 2FA");
      disableForm.reset();
      setBackupCodes(null);
      setTotpMessage({ type: "ok", text: body.message });
      await signOut({ callbackUrl: "/logowanie" });
    } catch (error) {
      setTotpMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Nie udało się wyłączyć 2FA",
      });
    } finally {
      setDisableLoading(false);
    }
  });

  const copySecret = async () => {
    if (!setup?.secret) return;
    await navigator.clipboard.writeText(setup.secret);
    setTotpMessage({ type: "ok", text: "Skopiowano klucz tajny do schowka" });
  };

  const copyBackupCodes = async () => {
    if (!backupCodes?.length) return;
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setTotpMessage({ type: "ok", text: "Skopiowano kody zapasowe" });
  };

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Ładowanie ustawień konta…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Ustawienia konta</h1>
        <p className="text-sm text-gray-600 mt-1">
          {status?.email}
          {status?.name ? ` · ${status.name}` : ""}
        </p>
      </div>

      <PasswordChangeCard form={passwordForm} message={passwordMessage} onSubmit={onChangePassword} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#145447]" />
            Logowanie dwuetapowe (2FA)
          </CardTitle>
          <CardDescription>
            Użyj Google Authenticator, Microsoft Authenticator lub innej aplikacji TOTP. Po włączeniu przy każdym logowaniu wymagany będzie 6-cyfrowy kod.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-md border bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Status: {status?.totpEnabled ? "Włączone" : "Wyłączone"}
              </p>
              {status?.totpEnabled ? (
                <p className="text-xs text-gray-600 mt-1">
                  Pozostałe kody zapasowe: {status.backupCodesRemaining}
                </p>
              ) : null}
            </div>
            {!status?.totpEnabled && !setup ? (
              <Button onClick={startTotpSetup} disabled={setupLoading} className="bg-[#145447] hover:bg-[#0D4036]">
                {setupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Włącz 2FA
              </Button>
            ) : null}
          </div>

          {setup && (
            <TotpSetupPanel
              setup={setup}
              code={enableCode}
              password={enablePassword}
              enabling={enabling}
              onCodeChange={setEnableCode}
              onPasswordChange={setEnablePassword}
              onConfirm={confirmTotp}
              onCancel={() => setSetup(null)}
              onCopySecret={copySecret}
            />
          )}

          {backupCodes && (
            <BackupCodesPanel codes={backupCodes} onCopy={copyBackupCodes} />
          )}

          {status?.totpEnabled && (
            <form className="space-y-4 rounded-md border border-red-100 p-4" onSubmit={onDisableTotp}>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <ShieldOff className="h-4 w-4 text-red-700" />
                Wyłącz uwierzytelnianie dwuetapowe
              </p>
              <div className="space-y-2">
                <Label htmlFor="disablePassword">Hasło</Label>
                <Input id="disablePassword" type="password" autoComplete="current-password" {...disableForm.register("password", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disableCode">Kod Authenticator lub kod zapasowy</Label>
                <Input id="disableCode" autoComplete="one-time-code" {...disableForm.register("code", { required: true })} />
              </div>
              <Button type="submit" variant="destructive" disabled={disableLoading}>
                {disableLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Wyłącz 2FA
              </Button>
            </form>
          )}

          {totpMessage && (
            <div className={`flex items-start gap-2 text-sm p-3 rounded-md ${totpMessage.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
              {totpMessage.type === "ok" ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
              <span>{totpMessage.text}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
