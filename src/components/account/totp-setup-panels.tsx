"use client";

import Image from "next/image";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TotpSetupPanelProps = {
  setup: { secret: string; qrDataUrl: string };
  code: string;
  enabling: boolean;
  onCodeChange: (code: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onCopySecret: () => void;
};

export function TotpSetupPanel({
  setup,
  code,
  enabling,
  onCodeChange,
  onConfirm,
  onCancel,
  onCopySecret,
}: TotpSetupPanelProps) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <ol className="list-inside list-decimal space-y-2 text-sm text-gray-700">
        <li>Otwórz Google Authenticator lub Microsoft Authenticator.</li>
        <li>Zeskanuj kod QR albo wpisz klucz ręcznie.</li>
        <li>Wpisz 6-cyfrowy kod z aplikacji, aby potwierdzić.</li>
      </ol>
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <Image
          src={setup.qrDataUrl}
          alt="Kod QR do konfiguracji Authenticator"
          width={220}
          height={220}
          unoptimized
          className="rounded-md border bg-white"
        />
        <div className="w-full flex-1 space-y-3">
          <div>
            <Label>Klucz tajny (wpis ręczny)</Label>
            <div className="mt-1 flex gap-2">
              <Input readOnly value={setup.secret} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={onCopySecret} aria-label="Kopiuj klucz">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="enableCode">Kod z aplikacji</Label>
            <Input
              id="enableCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 tracking-widest"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onConfirm} disabled={enabling || code.length !== 6} className="bg-[#145447] hover:bg-[#0D4036]">
              {enabling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Potwierdź i włącz
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>Anuluj</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BackupCodesPanel({ codes, onCopy }: { codes: string[]; onCopy: () => void }) {
  return (
    <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">Zapisz kody zapasowe</p>
      <p className="text-xs text-amber-800">
        Pokażemy je tylko raz. Każdy kod działa jednorazowo, gdy nie masz dostępu do aplikacji Authenticator.
      </p>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="rounded border bg-white px-2 py-1 text-center">{code}</li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" onClick={onCopy}>
        <Copy className="mr-2 h-4 w-4" />
        Kopiuj kody
      </Button>
    </div>
  );
}
