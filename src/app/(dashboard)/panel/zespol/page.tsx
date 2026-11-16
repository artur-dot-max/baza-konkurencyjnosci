"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Member = { id: string; email: string; name: string | null; orgRole: string | null; isActive: boolean };
type Invite = { id: string; email: string; role: string; expiresAt: string };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invite[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organization/invitations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nie udało się pobrać zespołu");
      setMembers(data.members || []);
      setInvitations(data.invitations || []);
      setCanManage(!!data.canManage);
      setCurrentUserId(data.currentUserId || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const invite = async () => {
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/organization/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nie udało się wysłać zaproszenia");
      setMessage(data.message);
      setEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd");
    }
  };

  const cancelInvite = async (invitationId: string) => {
    setError(null);
    const res = await fetch("/api/organization/invitations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Nie udało się anulować");
      return;
    }
    setMessage("Zaproszenie anulowane");
    await load();
  };

  const updateMember = async (userId: string, patch: { orgRole?: "EDITOR" | "VIEWER"; isActive?: boolean }) => {
    setError(null);
    const res = await fetch("/api/organization/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Nie udało się zaktualizować");
      return;
    }
    setMessage("Zaktualizowano członka zespołu");
    await load();
  };

  const roleLabel = (value: string | null) => {
    if (value === "OWNER") return "Właściciel";
    if (value === "VIEWER") return "Podgląd";
    return "Edycja";
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-navy-900">Zespół organizacji</h1>
      <p className="text-sm text-gray-600">
        Zapraszaj współpracowników do panelu. Rola „Podgląd” pozwala tylko przeglądać dane; „Edycja” — tworzyć i
        zmieniać ogłoszenia. Zarządzanie zespołem należy do właściciela.
      </p>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Wyślij zaproszenie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <div>
                <Label htmlFor="invite-email">E-mail</Label>
                <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="invite-role">Rola</Label>
                <select
                  id="invite-role"
                  className="flex h-10 w-full rounded-md border px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                >
                  <option value="EDITOR">Edycja</option>
                  <option value="VIEWER">Podgląd</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={invite} className="bg-[#145447] hover:bg-[#0D4036]" disabled={!email}>
                  Zaproś
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {message && <p className="text-sm text-green-800">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Członkowie</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Ładowanie…</p>
          ) : (
            <ul className="divide-y">
              {members.map((member) => {
                const editable = canManage && member.orgRole !== "OWNER" && member.id !== currentUserId;
                return (
                  <li key={member.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {member.name || member.email}
                        {!member.isActive && <span className="ml-2 text-xs text-red-700">(nieaktywny)</span>}
                      </p>
                      <p className="text-gray-600">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {editable ? (
                        <>
                          <select
                            className="h-9 rounded-md border px-2 text-sm"
                            value={member.orgRole === "VIEWER" ? "VIEWER" : "EDITOR"}
                            onChange={(e) => updateMember(member.id, { orgRole: e.target.value as "EDITOR" | "VIEWER" })}
                            aria-label={`Rola ${member.email}`}
                          >
                            <option value="EDITOR">Edycja</option>
                            <option value="VIEWER">Podgląd</option>
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => updateMember(member.id, { isActive: !member.isActive })}
                          >
                            {member.isActive ? "Dezaktywuj" : "Aktywuj"}
                          </Button>
                        </>
                      ) : (
                        <span className="text-gray-700">{roleLabel(member.orgRole)}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Oczekujące zaproszenia</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {invitations.map((inviteItem) => (
                <li key={inviteItem.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <span>{inviteItem.email}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">{roleLabel(inviteItem.role)}</span>
                    {canManage && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => cancelInvite(inviteItem.id)}>
                        Anuluj
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
