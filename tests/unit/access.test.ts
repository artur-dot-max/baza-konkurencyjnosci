import test from "node:test";
import assert from "node:assert/strict";
import {
  canManageOrganizationTeam,
  canWriteOrganization,
  ownsOrganization,
} from "../../src/lib/access";
import type { Session } from "next-auth";

function session(partial: Partial<Session["user"]> & { id: string; role: string }): Session {
  return {
    user: {
      name: null,
      email: null,
      image: null,
      sessionVersion: 0,
      ...partial,
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  };
}

test("ownsOrganization allows org member and admin", () => {
  const orgId = "org-1";
  assert.equal(ownsOrganization(session({ id: "a", role: "ADMIN" }), orgId), true);
  assert.equal(
    ownsOrganization(session({ id: "u", role: "ORGANIZATION", organizationId: orgId }), orgId),
    true
  );
  assert.equal(
    ownsOrganization(session({ id: "u", role: "ORGANIZATION", organizationId: "other" }), orgId),
    false
  );
  assert.equal(ownsOrganization(session({ id: "c", role: "CONTRACTOR" }), orgId), false);
});

test("canWriteOrganization blocks VIEWER", () => {
  const orgId = "org-1";
  assert.equal(
    canWriteOrganization(
      session({ id: "v", role: "ORGANIZATION", organizationId: orgId, orgRole: "VIEWER" }),
      orgId
    ),
    false
  );
  assert.equal(
    canWriteOrganization(
      session({ id: "e", role: "ORGANIZATION", organizationId: orgId, orgRole: "EDITOR" }),
      orgId
    ),
    true
  );
  assert.equal(
    canWriteOrganization(
      session({ id: "o", role: "ORGANIZATION", organizationId: orgId, orgRole: "OWNER" }),
      orgId
    ),
    true
  );
  assert.equal(canWriteOrganization(null, orgId), false);
  assert.equal(
    canWriteOrganization(session({ id: "c", role: "CONTRACTOR", organizationId: orgId }), orgId),
    false
  );
  assert.equal(
    canWriteOrganization(session({ id: "e", role: "ORGANIZATION", organizationId: "other", orgRole: "EDITOR" }), orgId),
    false
  );
  assert.equal(canWriteOrganization(session({ id: "a", role: "ADMIN" }), orgId), true);
});

test("canManageOrganizationTeam is OWNER-only for org users", () => {
  const orgId = "org-1";
  assert.equal(
    canManageOrganizationTeam(
      session({ id: "e", role: "ORGANIZATION", organizationId: orgId, orgRole: "EDITOR" }),
      orgId
    ),
    false
  );
  assert.equal(
    canManageOrganizationTeam(
      session({ id: "o", role: "ORGANIZATION", organizationId: orgId, orgRole: "OWNER" }),
      orgId
    ),
    true
  );
  assert.equal(canManageOrganizationTeam(session({ id: "a", role: "ADMIN" }), orgId), true);
  assert.equal(
    canManageOrganizationTeam(
      session({ id: "v", role: "ORGANIZATION", organizationId: orgId, orgRole: "VIEWER" }),
      orgId
    ),
    false
  );
  assert.equal(canManageOrganizationTeam(null, orgId), false);
});
