"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UploadedFile } from "@/components/ui/file-dropzone";
import type { SubmissionMethod } from "@/lib/utils";
import {
  announcementStep1Schema,
  announcementStep2Schema,
  announcementStep3Schema,
  announcementStep4Schema,
  announcementStep5Schema,
  announcementStep6Schema,
} from "@/lib/validators";

export const ANNOUNCEMENT_STEPS = [
  "Dane podstawowe",
  "Przedmiot zamówienia",
  "Warunki udziału",
  "Kryteria oceny",
  "Terminy",
  "Kontakt i załączniki",
  "Podsumowanie",
] as const;

export type AnnouncementFormData = {
  procedureNumber: string;
  title: string;
  orderType: string;
  voivodeship: string;
  location: string;
  executionTerm: string;
  description: string;
  conditions: string;
  criteria: Array<{ name: string; weight: number }>;
  publishedAt: string;
  bidsDeadline: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  submissionMethods: SubmissionMethod[];
  eDeliveryAddress: string;
  attachmentIds: string[];
};

function initialFormData(): AnnouncementFormData {
  return {
    procedureNumber: `ZAP/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`,
    title: "",
    orderType: "",
    voivodeship: "",
    location: "",
    executionTerm: "",
    description: "",
    conditions: "",
    criteria: [{ name: "Cena", weight: 100 }],
    publishedAt: "",
    bidsDeadline: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    submissionMethods: [],
    eDeliveryAddress: "",
    attachmentIds: [],
  };
}

export function useAnnouncementForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AnnouncementFormData>(initialFormData);

  const updateFormData = <Key extends keyof AnnouncementFormData>(
    field: Key,
    value: AnnouncementFormData[Key]
  ) => setFormData((previous) => ({ ...previous, [field]: value }));

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    updateFormData("attachmentIds", files.map((file) => file.id).filter(Boolean) as string[]);
  };

  const validateStep = (stepToValidate: number): string | null => {
    const inputs = [
      { schema: announcementStep1Schema, data: formData },
      { schema: announcementStep2Schema, data: formData },
      { schema: announcementStep3Schema, data: formData },
      { schema: announcementStep4Schema, data: formData },
      { schema: announcementStep5Schema, data: formData },
      { schema: announcementStep6Schema, data: formData },
    ];
    if (stepToValidate >= inputs.length) return null;
    const result = inputs[stepToValidate].schema.safeParse(inputs[stepToValidate].data);
    return result.success ? null : result.error.issues[0]?.message ?? "Uzupełnij wymagane pola.";
  };

  const goToNextStep = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((current) => Math.min(ANNOUNCEMENT_STEPS.length - 1, current + 1));
  };

  const toggleSubmissionMethod = (value: SubmissionMethod) => {
    setFormData((previous) => ({
      ...previous,
      submissionMethods: previous.submissionMethods.includes(value)
        ? previous.submissionMethods.filter((method) => method !== value)
        : [...previous.submissionMethods, value],
    }));
  };

  const addCriterion = () => {
    setFormData((previous) => ({
      ...previous,
      criteria: [...previous.criteria, { name: "", weight: 0 }],
    }));
  };

  const updateCriterion = (index: number, field: "name" | "weight", value: string | number) => {
    setFormData((previous) => ({
      ...previous,
      criteria: previous.criteria.map((criterion, criterionIndex) =>
        criterionIndex === index ? { ...criterion, [field]: value } : criterion
      ),
    }));
  };

  const removeCriterion = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      criteria: previous.criteria.filter((_, criterionIndex) => criterionIndex !== index),
    }));
  };

  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    for (let index = 0; index < ANNOUNCEMENT_STEPS.length - 1; index++) {
      const validationError = validateStep(index);
      if (validationError) {
        setStep(index);
        setError(validationError);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : "",
        bidsDeadline: formData.bidsDeadline ? new Date(formData.bidsDeadline).toISOString() : "",
        status,
      };
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push(status === "DRAFT" ? "/panel/szkice" : "/panel/ogloszenia");
        return;
      }

      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Nie udało się utworzyć ogłoszenia.");
    } catch (submissionError) {
      console.error(submissionError);
      setError("Nie udało się połączyć z serwerem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    addCriterion,
    error,
    formData,
    goToNextStep,
    handleFilesChange,
    handleSubmit,
    isSubmitting,
    removeCriterion,
    setSetupStep: setStep,
    step,
    toggleSubmissionMethod,
    updateCriterion,
    updateFormData,
    uploadedFiles,
  };
}
