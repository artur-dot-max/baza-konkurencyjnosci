import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy", { locale: pl });
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy HH:mm", { locale: pl });
}

export function formatRelativeDate(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: pl });
}

export const VOIVODESHIPS = [
  "dolnośląskie",
  "kujawsko-pomorskie",
  "lubelskie",
  "lubuskie",
  "łódzkie",
  "małopolskie",
  "mazowieckie",
  "opolskie",
  "podkarpackie",
  "podlaskie",
  "pomorskie",
  "śląskie",
  "świętokrzyskie",
  "warmińsko-mazurskie",
  "wielkopolskie",
  "zachodniopomorskie",
] as const;

export type Voivodeship = (typeof VOIVODESHIPS)[number];

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Szkic",
  PUBLISHED: "Opublikowane",
  IN_PROGRESS: "W trakcie",
  RESOLVED: "Rozstrzygnięte",
  CANCELLED: "Unieważnione",
  COMPLETED: "Zakończone",
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

export const ORDER_TYPE_LABELS: Record<string, string> = {
  SUPPLIES: "Dostawy",
  SERVICES: "Usługi",
  CONSTRUCTION: "Roboty budowlane",
};

export const ORG_STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekująca",
  ACTIVE: "Aktywna",
  BLOCKED: "Zablokowana",
};

export const SUBMISSION_METHODS = ["EMAIL", "PLATFORM", "IN_PERSON", "E_DELIVERY"] as const;
export type SubmissionMethod = (typeof SUBMISSION_METHODS)[number];
export const SUBMISSION_METHOD_LABELS: Record<string, string> = {
  EMAIL: "Mailowo",
  PLATFORM: "Przez Bazę Konkurencyjności",
  IN_PERSON: "Osobiście",
  E_DELIVERY: "Przez e-Doręczenia",
};

export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktywny",
  BLOCKED: "Zablokowany",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  ORGANIZATION: "Organizacja",
  GUEST: "Gość",
};

export const HISTORY_ACTION_LABELS: Record<string, string> = {
  CREATE: "Utworzono",
  PUBLISH: "Opublikowano",
  UPDATE: "Zaktualizowano",
  DELETE: "Usunięto",
  RESOLVE: "Rozstrzygnięto",
  CANCEL: "Unieważniono",
  ANSWER_QUESTION: "Udzielono odpowiedzi na pytanie",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: "Utworzono",
  UPDATE: "Zaktualizowano",
  DELETE: "Usunięto",
  PUBLISH: "Opublikowano",
  SUBMIT: "Złożono",
  MANUAL_ENTRY: "Wprowadzono ręcznie",
  OPEN: "Odczytano",
  DOWNLOAD: "Pobrano",
  PAGE_VIEW: "Wyświetlono stronę",
  RESOLVE: "Rozstrzygnięto",
  CANCEL: "Unieważniono",
  PASSWORD_RESET: "Zmieniono hasło",
  PASSWORD_CHANGE: "Zmieniono hasło (ustawienia)",
  TOTP_ENABLE: "Włączono 2FA",
  TOTP_DISABLE: "Wyłączono 2FA",
  LOGIN: "Zalogowano",
  LOGOUT: "Wylogowano",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  ANNOUNCEMENT: "Ogłoszenie",
  ORGANIZATION: "Organizacja",
  USER: "Użytkownik",
  NEWS: "Aktualność",
  OFFER: "Oferta",
  QUESTION: "Pytanie",
  ANSWER: "Odpowiedź",
  ATTACHMENT: "Załącznik",
  MESSAGE: "Wiadomość",
  PAGE: "Strona",
};

export function auditActionLabel(action: string) {
  return AUDIT_ACTION_LABELS[action] || action;
}

export function auditEntityLabel(entity: string) {
  return AUDIT_ENTITY_LABELS[entity] || entity;
}

export function generateProcedureNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `FS/${year}/${random}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/zip": [".zip"],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
