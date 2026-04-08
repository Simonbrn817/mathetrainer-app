"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LearningProfileRow = {
  id: string;
  user_id: string;
  school_class: string;
  age: number;
  training_frequency: number;
  created_at: string;
};

type TopicLevelRow = {
  id: string;
  user_id: string;
  category: string;
  level: 1 | 2 | 3;
  total_answered: number;
  total_correct: number;
  accuracy: number;
  last_practiced_at: string | null;
  created_at?: string;
  updated_at?: string | null;
};

type DiagnosticResultRow = {
  id: string;
  user_id: string;
  score: number;
  created_at: string;
};

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    question: "Was ist 7 × 8?",
    options: ["54", "56", "58", "64"],
    correctAnswer: "56",
    explanation: "7 mal 8 ergibt 56.",
  },
  {
    id: "q2",
    question: "Welcher Bruch ist gleich 1/2?",
    options: ["2/3", "3/6", "4/10", "5/12"],
    correctAnswer: "3/6",
    explanation: "3/6 kann vollständig gekürzt werden zu 1/2.",
  },
  {
    id: "q3",
    question: "Löse die Gleichung: x + 5 = 12",
    options: ["5", "6", "7", "8"],
    correctAnswer: "7",
    explanation: "12 - 5 = 7.",
  },
  {
    id: "q4",
    question: "Wie groß ist der Umfang eines Quadrats mit Seitenlänge 4 cm?",
    options: ["8 cm", "12 cm", "16 cm", "20 cm"],
    correctAnswer: "16 cm",
    explanation: "Ein Quadrat hat 4 gleich lange Seiten: 4 + 4 + 4 + 4 = 16.",
  },
  {
    id: "q5",
    question: "Was ist 0,5 als Prozentzahl?",
    options: ["5%", "10%", "50%", "500%"],
    correctAnswer: "50%",
    explanation: "0,5 entspricht 50 Prozent.",
  },
  {
    id: "q6",
    question: "Wie viel ist 3/4 von 20?",
    options: ["10", "12", "15", "16"],
    correctAnswer: "15",
    explanation: "20 geteilt durch 4 ergibt 5, mal 3 ergibt 15.",
  },
];

function scoreToLevel(score: number): 1 | 2 | 3 {
  if (score < 45) return 1;
  if (score < 75) return 2;
  return 3;
}

export default function AusgangstestPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [learningProfile, setLearningProfile] = useState<LearningProfileRow | null>(null);
  const [topicLevels, setTopicLevels] = useState<TopicLevelRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          if (!cancelled) {
            setErrorMessage("Fehler beim Laden des Nutzers: " + userError.message);
            setLoading(false);
          }
          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const [profileResponse, topicResponse, diagnosticResponse] = await Promise.all([
          supabase
            .from("LearningProfile")
            .select("id, user_id, school_class, age, training_frequency, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("TopicLevel")
            .select(
              "id, user_id, category, level, total_answered, total_correct, accuracy, last_practiced_at, created_at, updated_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: true }),

          supabase
            .from("DiagnosticResult")
            .select("id, user_id, score, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        if (profileResponse.error) {
          setErrorMessage(
            "Fehler beim Laden des Lernprofils: " + profileResponse.error.message
          );
          setLoading(false);
          return;
        }

        if (topicResponse.error) {
          setErrorMessage("Fehler beim Laden der Themen: " + topicResponse.error.message);
          setLoading(false);
          return;
        }

        if (diagnosticResponse.error) {
          setErrorMessage(
            "Fehler beim Laden des Test-Status: " + diagnosticResponse.error.message
          );
          setLoading(false);
          return;
        }

        const profile = profileResponse.data as LearningProfileRow | null;
        const topics = (topicResponse.data ?? []) as TopicLevelRow[];
        const diagnostic = diagnosticResponse.data as DiagnosticResultRow | null;

        if (!profile) {
          router.replace("/diagnose-start");
          return;
        }

        if (topics.length === 0) {
          router.replace("/diagnose-start");
          return;
        }

        if (diagnostic) {
          router.replace("/dashboard");
          return;
        }

        setLearningProfile(profile);
        setTopicLevels(topics);
      } catch (error) {
        console.error("AUSGANGSTEST PAGE ERROR:", error);
        if (!cancelled) {
          setErrorMessage("Unerwarteter Fehler auf der Ausgangstest-Seite.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function chooseAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const allAnswered = answeredCount === QUESTIONS.length;

  const scoreData = useMemo(() => {
    const correct = QUESTIONS.filter(
      (question) => answers[question.id] === question.correctAnswer
    ).length;

    const percent = Math.round((correct / QUESTIONS.length) * 100);

    return {
      correct,
      total: QUESTIONS.length,
      percent,
      level: scoreToLevel(percent),
    };
  }, [answers]);

  async function handleFinishTest() {
    setErrorMessage("");

    if (!allAnswered) {
      setErrorMessage("Bitte beantworte zuerst alle Fragen.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setErrorMessage("Fehler beim Laden des Nutzers: " + userError.message);
        setSaving(false);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: diagnosticInsertError } = await supabase
        .from("DiagnosticResult")
        .insert([
          {
            user_id: user.id,
            score: scoreData.percent,
          },
        ]);

      if (diagnosticInsertError) {
        setErrorMessage(
          "Fehler beim Speichern des Ausgangstests: " +
            diagnosticInsertError.message
        );
        setSaving(false);
        return;
      }

      const topicUpdates = topicLevels.map((topic) =>
        supabase
          .from("TopicLevel")
          .update({
            level: scoreData.level,
            total_answered: QUESTIONS.length,
            total_correct: scoreData.correct,
            accuracy: scoreData.percent / 100,
            last_practiced_at: new Date().toISOString(),
          })
          .eq("id", topic.id)
      );

      const updateResults = await Promise.all(topicUpdates);
      const failed = updateResults.find((result) => result.error);

      if (failed?.error) {
        setErrorMessage(
          "Der Test wurde gespeichert, aber die Themenstände konnten nicht vollständig aktualisiert werden: " +
            failed.error.message
        );
        setSaving(false);
        return;
      }

      setShowResults(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("AUSGANGSTEST SAVE ERROR:", error);
      setErrorMessage("Unerwarteter Fehler beim Speichern des Ausgangstests.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded-xl bg-gray-200" />
            <div className="h-40 rounded-[28px] bg-gray-200" />
            <div className="h-72 rounded-[28px] bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (showResults) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 text-gray-900">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
          <div className="w-full rounded-[32px] border border-green-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✅
            </div>
            <h1 className="mt-6 text-3xl font-bold">Ausgangstest gespeichert</h1>
            <p className="mt-4 text-lg text-gray-600">
              Dein Ergebnis liegt bei <span className="font-semibold">{scoreData.percent}%</span>.
            </p>
            <p className="mt-2 text-gray-600">
              Du wirst jetzt zu deinem Dashboard weitergeleitet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 text-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-[32px] bg-black p-8 text-white shadow-xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-400">
                Ausgangstest
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Jetzt kommt dein kurzer Mathe-Check
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-gray-300">
                Beantworte alle Fragen möglichst ruhig und ohne zu raten. So
                bekommen wir einen besseren Startwert für deinen Lernpfad.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-gray-400">Übersicht</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Klasse</p>
                  <p className="mt-1 text-xl font-bold">
                    {learningProfile?.school_class ?? "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Fragen</p>
                  <p className="mt-1 text-xl font-bold">{QUESTIONS.length}</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Themen</p>
                  <p className="mt-1 text-xl font-bold">{topicLevels.length}</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Beantwortet</p>
                  <p className="mt-1 text-xl font-bold">
                    {answeredCount} / {QUESTIONS.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500">Fragen</p>
            <h2 className="mt-2 text-2xl font-bold">Beantworte alle Aufgaben</h2>
            <p className="mt-3 text-gray-600">
              Wähle jeweils genau eine Antwort aus.
            </p>
          </div>

          <div className="space-y-6">
            {QUESTIONS.map((question, index) => {
              const selectedAnswer = answers[question.id];

              return (
                <div
                  key={question.id}
                  className="rounded-3xl border border-gray-200 bg-gray-50 p-5"
                >
                  <p className="text-sm font-medium text-gray-500">
                    Frage {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {question.question}
                  </h3>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => chooseAnswer(question.id, option)}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                          selectedAnswer === option
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-black hover:bg-gray-100"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {selectedAnswer && (
                    <p className="mt-4 text-sm text-gray-600">
                      Gewählt: <span className="font-medium">{selectedAnswer}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Fortschritt</p>
              <h2 className="mt-2 text-2xl font-bold">Bereit zum Abschließen?</h2>
              <p className="mt-3 text-gray-600">
                Du hast aktuell {answeredCount} von {QUESTIONS.length} Fragen beantwortet.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-100 px-5 py-4 text-sm font-medium text-gray-700">
              Aktueller Fortschritt:{" "}
              {Math.round((answeredCount / QUESTIONS.length) * 100)}%
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleFinishTest}
            disabled={saving}
            className="rounded-2xl bg-black px-8 py-4 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Speichert..." : "Ausgangstest abschließen"}
          </button>

          <Link
            href="/diagnose"
            className="rounded-2xl border border-gray-300 bg-white px-8 py-4 font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Zurück zur Diagnose
          </Link>
        </div>
      </div>
    </main>
  );
}