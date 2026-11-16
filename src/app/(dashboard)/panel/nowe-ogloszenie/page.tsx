"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe2, Mail, Plus, Send, Trash2, UserRound } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { AnnouncementWizardProgress } from "@/components/announcements/announcement-wizard-progress";
import { cn, SUBMISSION_METHOD_LABELS, type SubmissionMethod, VOIVODESHIPS } from "@/lib/utils";
import { ANNOUNCEMENT_STEPS, useAnnouncementForm } from "@/components/announcements/use-announcement-form";

export default function NewAnnouncementPage() {
  const {
    addCriterion,
    error,
    formData,
    goToNextStep,
    handleFilesChange,
    handleSubmit,
    isSubmitting,
    removeCriterion,
    setSetupStep,
    step,
    toggleSubmissionMethod,
    updateCriterion,
    updateFormData,
    uploadedFiles,
  } = useAnnouncementForm();

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="procedureNumber">Numer postępowania</Label>
              <Input
                id="procedureNumber"
                value={formData.procedureNumber}
                onChange={(e) => updateFormData("procedureNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Tytuł zamówienia</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderType">Rodzaj zamówienia</Label>
              <Select
                value={formData.orderType}
                onValueChange={(val) => updateFormData("orderType", val)}
              >
                <SelectTrigger id="orderType">
                  <SelectValue placeholder="Wybierz rodzaj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPLIES">Dostawy</SelectItem>
                  <SelectItem value="SERVICES">Usługi</SelectItem>
                  <SelectItem value="CONSTRUCTION">Roboty budowlane</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voivodeship">Województwo</Label>
              <Select
                value={formData.voivodeship}
                onValueChange={(val) => updateFormData("voivodeship", val)}
              >
                <SelectTrigger id="voivodeship">
                  <SelectValue placeholder="Wybierz województwo" />
                </SelectTrigger>
                <SelectContent>
                  {VOIVODESHIPS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Miejscowość</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="executionTerm">Termin realizacji</Label>
              <Input
                id="executionTerm"
                value={formData.executionTerm}
                onChange={(e) => updateFormData("executionTerm", e.target.value)}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Opis przedmiotu zamówienia</Label>
              <RichTextEditor
                content={formData.description}
                onChange={(html) => updateFormData("description", html)}
                placeholder="Wprowadź szczegółowy opis..."
                ariaLabel="Opis przedmiotu zamówienia"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conditions">Warunki udziału w postępowaniu</Label>
              <RichTextEditor
                content={formData.conditions}
                onChange={(html) => updateFormData("conditions", html)}
                placeholder="Wprowadź warunki udziału (opcjonalnie)..."
                ariaLabel="Warunki udziału w postępowaniu"
              />
            </div>
          </div>
        );
      case 3:
        const totalWeight = formData.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Kryteria oceny ofert</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                <Plus className="w-4 h-4 mr-2" /> Dodaj kryterium
              </Button>
            </div>
            {formData.criteria.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Nazwa kryterium"
                  aria-label={`Nazwa kryterium ${i + 1}`}
                  value={c.name}
                  onChange={(e) => updateCriterion(i, "name", e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Waga %"
                  aria-label={`Waga kryterium ${i + 1}`}
                  value={c.weight}
                  onChange={(e) => updateCriterion(i, "weight", Number(e.target.value))}
                  className="w-24"
                />
                <Button type="button" variant="ghost" size="icon" aria-label={`Usuń kryterium ${i + 1}`} onClick={() => removeCriterion(i)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <div className={cn("text-sm font-medium", totalWeight !== 100 ? "text-red-500" : "text-green-600")}>
              Suma wag: {totalWeight}% (musi wynosić 100%)
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Data publikacji</Label>
              <Input
                id="publishedAt"
                type="date"
                value={formData.publishedAt}
                onChange={(e) => updateFormData("publishedAt", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bidsDeadline">Termin składania ofert</Label>
              <Input
                id="bidsDeadline"
                type="date"
                min={formData.publishedAt ? new Date(new Date(formData.publishedAt).getTime() + 7 * 86400000).toISOString().slice(0, 10) : undefined}
                value={formData.bidsDeadline}
                onChange={(e) => updateFormData("bidsDeadline", e.target.value)}
              />
              <p className="text-xs text-gray-600">Termin musi przypadać co najmniej 7 dni po dacie publikacji.</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Osoba kontaktowa</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => updateFormData("contactPerson", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email kontaktowy</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => updateFormData("contactEmail", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefon (opcjonalnie)</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => updateFormData("contactPhone", e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
              Dane kontaktowe będą publiczne. Użyj danych służbowych lub funkcyjnych i podaj tylko informacje niezbędne
              do obsługi postępowania.
            </p>
            <fieldset className="space-y-3 mt-4">
              <legend className="text-sm font-medium">Sposób składania ofert</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["EMAIL", Mail, "Na adres e-mail podany powyżej"],
                  ["PLATFORM", Globe2, "Formularzem na stronie ogłoszenia"],
                  ["IN_PERSON", UserRound, "W siedzibie zamawiającego"],
                  ["E_DELIVERY", Send, "Na adres do e-Doręczeń"],
                ] as const).map(([value, Icon, description]) => (
                  <button key={value} type="button" aria-pressed={formData.submissionMethods.includes(value)} onClick={() => toggleSubmissionMethod(value)} className={cn("rounded-lg border p-4 text-left transition-colors", formData.submissionMethods.includes(value) ? "border-[#145447] bg-[#F0F7F4] ring-2 ring-[#145447]" : "border-gray-300 hover:border-[#145447]")}>
                    <span className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5" aria-hidden="true" />{SUBMISSION_METHOD_LABELS[value]}</span>
                    <span className="mt-1 block text-sm text-gray-600">{description}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600">Wybierz co najmniej jedną opcję. Możesz zaznaczyć kilka sposobów.</p>
            </fieldset>
            {formData.submissionMethods.includes("E_DELIVERY") && <div className="space-y-2">
              <Label htmlFor="eDeliveryAddress">Adres do e-Doręczeń</Label>
              <Input id="eDeliveryAddress" value={formData.eDeliveryAddress} onChange={(e) => updateFormData("eDeliveryAddress", e.target.value.toUpperCase())} placeholder="AE:PL-12345-67890-ABCDE-12" required />
            </div>}
            <div className="mt-4">
              <Label className="mb-2 block">Załączniki (opcjonalnie)</Label>
              <p className="text-xs text-gray-600 mb-2">
                Przed dodaniem pliku usuń dane nadmiarowe. Nie publikuj danych szczególnych kategorii ani danych osobowych,
                których ujawnienie nie jest wymagane do przeprowadzenia postępowania.
              </p>
              <FileDropzone
                onFilesChange={handleFilesChange}
                existingFiles={uploadedFiles}
                maxFiles={10}
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">Numer:</span> {formData.procedureNumber}</div>
              <div><span className="font-semibold">Tytuł:</span> {formData.title}</div>
              <div><span className="font-semibold">Rodzaj:</span> {formData.orderType}</div>
              <div><span className="font-semibold">Data publikacji:</span> {formData.publishedAt}</div>
              <div><span className="font-semibold">Termin ofert:</span> {formData.bidsDeadline}</div>
              <div><span className="font-semibold">Osoba kontaktowa:</span> {formData.contactPerson}</div>
              <div><span className="font-semibold">Email:</span> {formData.contactEmail}</div>
              <div><span className="font-semibold">Sposoby składania:</span> {formData.submissionMethods.map((method) => SUBMISSION_METHOD_LABELS[method]).join(", ") || "—"}</div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Kryteria oceny:</h4>
              <ul className="list-disc pl-5">
                {formData.criteria.map((c, i) => (
                  <li key={i}>{c.name} - {c.weight}%</li>
                ))}
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Nowe ogłoszenie</h1>

      <AnnouncementWizardProgress steps={ANNOUNCEMENT_STEPS} currentStep={step} />

      <Card>
        <CardHeader>
          <CardTitle>{ANNOUNCEMENT_STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {renderStep()}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={() => setSetupStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || isSubmitting}
          >
            Wstecz
          </Button>

          {step < ANNOUNCEMENT_STEPS.length - 1 ? (
            <Button
              className="bg-navy-800 hover:bg-navy-900"
              onClick={goToNextStep}
              disabled={isSubmitting}
            >
              Dalej
            </Button>
          ) : (
            <div className="space-x-4">
              <Button variant="secondary" onClick={() => handleSubmit("DRAFT")} disabled={isSubmitting}>
                Zapisz jako szkic
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleSubmit("PUBLISHED")} disabled={isSubmitting}>
                Opublikuj ogłoszenie
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
