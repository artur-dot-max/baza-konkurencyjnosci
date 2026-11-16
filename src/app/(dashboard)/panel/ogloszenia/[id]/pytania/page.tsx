"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";
import { MessageSquare, Send, Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

type Answer = {
  id: string;
  content: string;
  createdAt: string;
};

type Question = {
  id: string;
  content: string;
  createdAt: string;
  authorName?: string | null;
  answers: Answer[];
};

type Feedback = {
  type: "error" | "success";
  title: string;
  message: string;
};

function isAnswered(question: Question) {
  return question.answers.length > 0;
}

export default function QuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState<{ [key: string]: string }>({});
  const [answerErrors, setAnswerErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/announcements/${id}/questions`);
        if (!res.ok) throw new Error("Nie udało się pobrać pytań");
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Nie udało się pobrać pytań");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [id]);

  const handleAnswerSubmit = async (questionId: string) => {
    const answer = answerContent[questionId]?.trim() || "";
    if (answer.length < 5) {
      const message = "Treść odpowiedzi musi mieć co najmniej 5 znaków";
      setAnswerErrors((prev) => ({ ...prev, [questionId]: message }));
      setFeedback({ type: "error", title: "Nie można opublikować odpowiedzi", message });
      return;
    }

    setAnswerErrors((prev) => ({ ...prev, [questionId]: "" }));
    setSubmitting((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await fetch(`/api/announcements/${id}/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: answer }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Nie udało się opublikować odpowiedzi");

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answers: [...q.answers, result],
              }
            : q,
        ),
      );

      setAnswerContent((prev) => ({ ...prev, [questionId]: "" }));
      setFeedback({
        type: "success",
        title: "Odpowiedź opublikowana",
        message: "Odpowiedź jest widoczna publicznie przy pytaniu do ogłoszenia.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Nie udało się opublikować odpowiedzi";
      setAnswerErrors((prev) => ({ ...prev, [questionId]: message }));
      setFeedback({ type: "error", title: "Nie można opublikować odpowiedzi", message });
    } finally {
      setSubmitting((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy-800" />
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
        {error}
      </div>
    );
  }

  const unansweredCount = questions.filter((q) => !isAnswered(q)).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Pytania i odpowiedzi</h1>
          <p className="text-gray-500 mt-1">
            Zarządzaj pytaniami zadanymi do ogłoszenia.
            {unansweredCount > 0 ? ` Oczekuje na odpowiedź: ${unansweredCount}.` : ""}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/panel/ogloszenia" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Wróć do ogłoszeń
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>Do tego ogłoszenia nie zadano jeszcze żadnych pytań.</p>
            </CardContent>
          </Card>
        ) : (
          questions.map((q) => {
            const answered = isAnswered(q);
            return (
              <Card key={q.id} className={!answered ? "border-l-4 border-l-amber-500" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Badge
                        variant={answered ? "secondary" : "default"}
                        className={
                          !answered
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            : "bg-[#B8DB8F] text-[#145447] hover:bg-[#a6cc7d]"
                        }
                      >
                        {answered ? "Odpowiedziano" : "Wymaga odpowiedzi"}
                      </Badge>
                      <div className="text-sm text-gray-500 mt-2">
                        Data zapytania: {formatDate(new Date(q.createdAt))}
                        {q.authorName ? ` · ${q.authorName}` : ""}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md text-gray-800">
                    <span className="font-semibold block mb-1">Pytanie:</span>
                    {q.content}
                  </div>

                  {answered ? (
                    <div className="space-y-3">
                      {q.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className="bg-[#F1F5F2] p-4 rounded-md text-[#145447] border border-[#B8DB8F]"
                        >
                          <span className="font-semibold block mb-1">
                            Twoja odpowiedź ({formatDate(new Date(answer.createdAt))}):
                          </span>
                          {answer.content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      <label className="text-sm font-medium text-gray-700" htmlFor={`answer-${q.id}`}>
                        Udziel odpowiedzi (będzie widoczna publicznie)
                      </label>
                      <Textarea
                        id={`answer-${q.id}`}
                        rows={3}
                        placeholder="Wpisz treść odpowiedzi..."
                        value={answerContent[q.id] || ""}
                        aria-invalid={!!answerErrors[q.id]}
                        aria-describedby={answerErrors[q.id] ? `answer-error-${q.id}` : undefined}
                        onChange={(e) => {
                          setAnswerContent((prev) => ({ ...prev, [q.id]: e.target.value }));
                          if (answerErrors[q.id]) {
                            setAnswerErrors((prev) => ({ ...prev, [q.id]: "" }));
                          }
                        }}
                      />
                      {answerErrors[q.id] && (
                        <p id={`answer-error-${q.id}`} role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                          {answerErrors[q.id]}
                        </p>
                      )}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleAnswerSubmit(q.id)}
                          disabled={!answerContent[q.id]?.trim() || submitting[q.id]}
                          className="bg-[#145447] hover:bg-[#0D4036] text-white"
                        >
                          {submitting[q.id] ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}{" "}
                          Opublikuj odpowiedź
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!feedback} onOpenChange={(open) => !open && setFeedback(null)}>
        <AlertDialogContent className="border-[#B9DBCF] sm:rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#145447]">
              {feedback?.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-[#145447]" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-700" aria-hidden="true" />
              )}
              {feedback?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              {feedback?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-[#145447] text-white hover:bg-[#0D4036]">
              Rozumiem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
