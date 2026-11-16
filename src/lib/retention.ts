export type RetentionRule = {
  name: string;
  days: number;
};

export function validateRetentionRule(rule: RetentionRule): RetentionRule {
  if (!rule.name.trim()) throw new Error("Nazwa reguły retencji jest wymagana");
  if (!Number.isSafeInteger(rule.days) || rule.days <= 0) {
    throw new Error("Okres retencji musi być dodatnią liczbą pełnych dni");
  }
  return { name: rule.name.trim(), days: rule.days };
}

export function retentionCutoff(rule: RetentionRule, now = new Date()): Date {
  const validRule = validateRetentionRule(rule);
  if (Number.isNaN(now.getTime())) throw new Error("Nieprawidłowa data odniesienia");
  return new Date(now.getTime() - validRule.days * 86_400_000);
}

export function isPastRetention(createdAt: Date, rule: RetentionRule, now = new Date()): boolean {
  if (Number.isNaN(createdAt.getTime())) throw new Error("Nieprawidłowa data utworzenia");
  return createdAt.getTime() <= retentionCutoff(rule, now).getTime();
}
