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

type DiagnosticExercise = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  level: 1 | 2 | 3;
};

function clampLevel(value: number): 1 | 2 | 3 {
  if (value <= 1) return 1;
  if (value >= 3) return 3;
  return value as 1 | 2 | 3;
}

function getTopicLevelLabel(level: 1 | 2 | 3) {
  if (level === 1) return "Grundlagen";
  if (level === 2) return "Mittel";
  return "Fortgeschritten";
}

function getQuestionSetByLevel(level: 1 | 2 | 3) {
  if (level === 1) {
    return [
      {
        questionTemplate:
          "Wie sicher fühlst du dich aktuell im Thema „{topic}“?",
        options: ["Unsicher", "Eher unsicher", "Eher sicher", "Sehr sicher"],
        correctAnswer: "Eher sicher",
        explanation:
          "Diese Frage hilft, dein aktuelles Gefühl für das Thema einzuordnen.",
      },
      {
        questionTemplate:
          "Wenn du an „{topic}“ denkst: Was trifft am ehesten auf dich zu?",
        options: [
          "Ich brauche viel Hilfe",
          "Ich verstehe manches",
          "Ich komme meistens zurecht",
          "Ich kann es gut erklären",
        ],
        correctAnswer: "Ich komme meistens zurecht",
        explanation:
          "Damit wird grob eingeschätzt, wie stabil deine Grundlagen schon sind.",
      },
      {
        questionTemplate:
          "Wie leicht fällt dir aktuell das Üben im Bereich „{topic}“?",
        options: ["Sehr schwer", "Eher schwer", "Ganz okay", "Leicht"],
        correctAnswer: "Ganz okay",
        explanation:
          "Auch diese Frage dient dazu, einen sinnvollen Startpunkt festzulegen.",
      },
    ];
  }

  if (level === 2) {
    return [
      {
        questionTemplate:
          "Wie würdest du dein aktuelles Niveau im Thema „{topic}“ einschätzen?",
        options: ["Noch schwach", "Ausbaufähig", "Schon solide", "Sehr sicher"],
        correctAnswer: "Schon solide",
        explanation:
          "Hier wird geprüft, ob du schon auf einer stabilen Basis aufbauen kannst.",
      },
      {
        questionTemplate:
          "Was passt aktuell am besten zu deinem Stand in „{topic}“?",
        options: [
          "Ich bin oft überfordert",
          "Ich brauche noch Struktur",
          "Ich kann vieles schon gut",
          "Ich beherrsche es fast komplett",
        ],
        correctAnswer: "Ich kann vieles schon gut",
        explanation:
          "Dein Lernpfad wird später an diese Einschätzung angepasst.",
      },
      {
        questionTemplate:
          "Wie selbstständig kannst du Aufgaben zu „{topic}“ lösen?",
        options: [
          "Kaum selbstständig",
          "Mit Hilfe",
          "Meistens allein",
          "Immer sicher allein",
        ],
        correctAnswer: "Meistens allein",
        explanation:
          "Diese Frage hilft bei der Einstufung zwischen Aufbau und Festigung.",
      },
    ];
  }

  return [
    {
      questionTemplate:
        "Wie sicher bist du aktuell bei anspruchsvolleren Aufgaben zu „{topic}“?",
      options: [
        "Noch nicht sicher",
        "Teilweise sicher",
        "Schon ziemlich sicher",
        "Sehr sicher",
      ],
      correctAnswer: "Schon ziemlich sicher",
      explanation:
        "Damit wird eingeschätzt, ob du schon auf fortgeschrittenem Niveau arbeitest.",
    },
    {
      questionTemplate:
        "Was beschreibt deinen Stand in „{topic}“ am besten?",
      options: [
        "Ich habe noch Lücken",
        "Ich bin okay unterwegs",
        "Ich bin schon gut",
        "Ich bin sehr stark",
      ],
      correctAnswer: "Ich bin schon gut",
      explanation:
        "Auch fortgeschrittene Themen werden über deine Antworten sinnvoll einsortiert.",
    },
    {
      questionTemplate:
        "Wie gut kannst du dein Wissen in „{topic}“ auf neue Aufgaben übertragen?",
      options: [
        "Noch kaum",
        "Manchmal",
        "Meistens gut",
        "Sehr sicher",
      ],
      correctAnswer: "Meistens gut",
      explanation:
        "Das zeigt, wie stabil dein Verständnis im Thema bereits ist.",
    },
  ];
}

function buildDiagnosticExercises(
  topics: TopicLevelRow[]
): DiagnosticExercise[] {
  return topics.flatMap((topic) => {
    const questionSet = getQuestionSetByLevel(topic.level);

    return questionSet.map((item, index) => ({
      id: `${topic.id}-${index + 1}`,
      question: item.questionTemplate.replace("{topic}", topic.category),
      options: item.options,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      topic: topic.category,
      level: topic.level,
    }));
  });
}

export default function DiagnosePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [learningProfile, setLearningProfile] =
    useState<LearningProfileRow | null>(null);
  const [topicLevels, setTopicLevels] = useState<TopicLevelRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadDiagnose() {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

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

        setUserId(user.id);

        const [profileResponse, topicResponse, diagnosticResponse] =
          await Promise.all([
            supabase
              .from("LearningProfile")
              .select(
                "id, user_id, school_class, age, training_frequency, created_at"
              )
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
              .order("level", { ascending: true }),

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
          setErrorMessage(
            "Fehler beim Laden der Themen: " + topicResponse.error.message
          );
          setLoading(false);
          return;
        }

        if (diagnosticResponse.error) {
          setErrorMessage(
            "Fehler beim Laden des Diagnose-Status: " +
              diagnosticResponse.error.message
          );
          setLoading(false);
          return;
        }

        if (diagnosticResponse.data) {
          router.replace("/dashboard");
          return;
        }

        const profile = profileResponse.data as LearningProfileRow | null;
        const topics = ((topicResponse.data ?? []) as TopicLevelRow[]).map(
          (topic) => ({
            ...topic,
            total_answered: topic.total_answered ?? 0,
            total_correct: topic.total_correct ?? 0,
            accuracy: Number(topic.accuracy ?? 0),
            last_practiced_at: topic.last_practiced_at ?? null,
          })
        );

        if (!profile) {
          router.replace("/diagnose-start");
          return;
        }

        if (topics.length === 0) {
          router.replace("/diagnose-start");
          return;
        }

        setLearningProfile(profile);
        setTopicLevels(topics);
      } catch (error) {
        console.error("Diagnose load error:", error);
        if (!cancelled) {
          setErrorMessage("Unerwarteter Fehler beim Laden der Diagnose.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDiagnose();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const diagnosticExercises = useMemo<DiagnosticExercise[]>(() => {
    return buildDiagnosticExercises(topicLevels);
  }, [topicLevels]);

  const totalQuestions = diagnosticExercises.length;

  const currentExercise = useMemo(() => {
    return diagnosticExercises[currentIndex] ?? null;
  }, [diagnosticExercises, currentIndex]);

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const progressPercent = useMemo(() => {
    if (totalQuestions === 0) return 0;
    return Math.round((answeredCount / totalQuestions) * 100);
  }, [answeredCount, totalQuestions]);

  const currentProgressPercent = useMemo(() => {
    if (totalQuestions === 0) return 0;
    return Math.round(((currentIndex + 1) / totalQuestions) * 100);
  }, [currentIndex, totalQuestions]);

  const isLastQuestion = currentIndex === totalQuestions - 1;

  const canGoNext = useMemo(() => {
    if (!currentExercise) return false;
    return Boolean(answers[currentExercise.id]);
  }, [answers, currentExercise]);

  const correctCount = useMemo(() => {
    return diagnosticExercises.filter(
      (exercise) => answers[exercise.id] === exercise.correctAnswer
    ).length;
  }, [answers, diagnosticExercises]);

  const scorePercent = useMemo(() => {
    if (totalQuestions === 0) return 0;
    return Math.round((correctCount / totalQuestions) * 100);
  }, [correctCount, totalQuestions]);

  const weakestTopic = useMemo(() => {
    const topicStats = topicLevels.map((topic) => {
      const exercisesForTopic = diagnosticExercises.filter(
        (exercise) => exercise.topic === topic.category
      );

      const answeredForTopic = exercisesForTopic.filter(
        (exercise) => answers[exercise.id]
      );

      const correctForTopic = exercisesForTopic.filter(
        (exercise) => answers[exercise.id] === exercise.correctAnswer
      );

      const accuracy =
        answeredForTopic.length > 0
          ? correctForTopic.length / answeredForTopic.length
          : 0;

      return {
        topic: topic.category,
        answered: answeredForTopic.length,
        correct: correctForTopic.length,
        accuracy,
      };
    });

    const answeredTopics = topicStats.filter((item) => item.answered > 0);
    if (answeredTopics.length === 0) return null;

    return answeredTopics.sort((a, b) => a.accuracy - b.accuracy)[0];
  }, [answers, diagnosticExercises, topicLevels]);

  function handleSelectAnswer(answer: string) {
    if (!currentExercise) return;

    setAnswers((prev) => ({
      ...prev,
      [currentExercise.id]: answer,
    }));
  }

  function handleNext() {
    if (!canGoNext) {
      setErrorMessage("Bitte wähle zuerst eine Antwort aus.");
      return;
    }

    setErrorMessage("");

    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handleBack() {
    setErrorMessage("");
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  async function handleFinishDiagnose() {
    if (!userId) return;

    if (answeredCount !== totalQuestions) {
      setErrorMessage("Bitte beantworte zuerst alle Diagnose-Aufgaben.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error: insertDiagnosticError } = await supabase
        .from("DiagnosticResult")
        .insert([
          {
            user_id: userId,
            score: scorePercent,
          },
        ]);

      if (insertDiagnosticError) {
        setErrorMessage(
          "Fehler beim Speichern der Diagnose: " +
            insertDiagnosticError.message
        );
        setSaving(false);
        return;
      }

      const topicUpdates = topicLevels.map((topic) => {
        const exercisesForTopic = diagnosticExercises.filter(
          (exercise) => exercise.topic === topic.category
        );

        const answeredForTopic = exercisesForTopic.filter(
          (exercise) => answers[exercise.id]
        );

        const correctForTopic = exercisesForTopic.filter(
          (exercise) => answers[exercise.id] === exercise.correctAnswer
        );

        const totalAnswered = answeredForTopic.length;
        const totalCorrect = correctForTopic.length;
        const accuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

        let nextLevel: 1 | 2 | 3;

        if (accuracy >= 0.8) {
          nextLevel = clampLevel(topic.level + 1);
        } else if (accuracy >= 0.5) {
          nextLevel = topic.level;
        } else {
          nextLevel = clampLevel(topic.level - 1);
        }

        return supabase
          .from("TopicLevel")
          .update({
            level: nextLevel,
            total_answered: totalAnswered,
            total_correct: totalCorrect,
            accuracy,
            last_practiced_at: new Date().toISOString(),
          })
          .eq("id", topic.id);
      });

      const topicResults = await Promise.all(topicUpdates);
      const failedTopicUpdate = topicResults.find((result) => result.error);

      if (failedTopicUpdate?.error) {
        setErrorMessage(
          "Die Diagnose wurde gespeichert, aber die Themen konnten nicht vollständig aktualisiert werden: " +
            failedTopicUpdate.error.message
        );
        setSaving(false);
        return;
      }

      setSuccessMessage("Diagnose erfolgreich abgeschlossen.");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (error) {
      console.error("Diagnose finish error:", error);
      setErrorMessage("Unerwarteter Fehler beim Abschließen der Diagnose.");
    } finally {
      setSaving(false);
    }
  }

  function getScoreHeadline(percent: number) {
    if (percent >= 85) return "Sehr starker Start.";
    if (percent >= 70) return "Guter Start.";
    if (percent >= 50) return "Solide Grundlage.";
    return "Wichtiger Ausgangspunkt.";
  }

  function getScoreText(percent: number) {
    if (percent >= 85) {
      return "Du wirkst in vielen Bereichen schon recht sicher. Dein Lernpfad kann direkt gezielt auf Feinheiten und schwierigere Themen aufbauen.";
    }

    if (percent >= 70) {
      return "Du hast bereits eine gute Basis. Jetzt geht es darum, einzelne Lücken sauber zu schließen und dein Niveau zu stabilisieren.";
    }

    if (percent >= 50) {
      return "Du hast schon einige Grundlagen, aber es gibt noch mehrere Bereiche mit Potenzial. Genau dafür ist dein persönlicher Lernpfad da.";
    }

    return "Diese Diagnose hilft dir jetzt besonders, weil sie deinen Lernpfad klarer macht. So kannst du strukturiert statt planlos aufbauen.";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-52 rounded-xl bg-gray-200" />
            <div className="h-44 rounded-[28px] bg-gray-200" />
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="h-[520px] rounded-[28px] bg-gray-200" />
              <div className="h-[520px] rounded-[28px] bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!currentExercise) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Keine Diagnose-Aufgaben gefunden
            </h1>
            <p className="mt-4 text-gray-600">
              Es konnten aktuell keine passenden Diagnose-Aufgaben geladen werden.
            </p>
            <div className="mt-6">
              <Link
                href="/diagnose-start"
                className="inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Zurück zum Start
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const selectedAnswer = answers[currentExercise.id];
  const currentQuestionNumber = currentIndex + 1;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 text-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-[32px] bg-black p-8 text-white shadow-xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-400">
                Diagnose
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Finde heraus, wo du gerade stehst
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-300">
                Diese Diagnose ist dein Ausgangspunkt. Danach bekommst du keinen
                zufälligen Übungsweg, sondern einen Lernpfad, der auf deinen
                Antworten basiert.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  {topicLevels.length} Themen
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  {totalQuestions} Aufgaben
                </span>
                {learningProfile && (
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                    Klasse {learningProfile.school_class}
                  </span>
                )}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Beantwortet
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {answeredCount} / {totalQuestions}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Aktuelle Frage
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {currentQuestionNumber} / {totalQuestions}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Fortschritt
                  </p>
                  <p className="mt-2 text-lg font-semibold">{progressPercent}%</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Aktueller Bereich</p>
                  <h2 className="mt-2 text-2xl font-bold">
                    {currentExercise.topic}
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Diagnose aktiv
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${Math.max(6, currentProgressPercent)}%` }}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Frage</p>
                  <p className="mt-1 text-xl font-bold">
                    {currentQuestionNumber}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Themenniveau</p>
                  <p className="mt-1 text-xl font-bold">
                    {getTopicLevelLabel(currentExercise.level)}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Warum diese Diagnose wichtig ist
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-300">
                  Deine Antworten bestimmen, mit welchem Niveau und mit welchen
                  Themen dein Lernpfad startet. Je ehrlicher du antwortest,
                  desto sinnvoller wird dein Training danach.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.86fr_1.14fr]">
          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-medium text-gray-500">Themenübersicht</p>
            <h2 className="mt-2 text-2xl font-bold">Was gerade geprüft wird</h2>
            <p className="mt-3 text-gray-600">
              Die Diagnose verteilt sich auf deine ausgewählten Themen. So
              entsteht später ein sinnvoller Startpunkt für dein Training.
            </p>

            <div className="mt-6 space-y-4">
              {topicLevels.map((topic) => {
                const topicExercises = diagnosticExercises.filter(
                  (exercise) => exercise.topic === topic.category
                );
                const topicAnswered = topicExercises.filter(
                  (exercise) => answers[exercise.id]
                ).length;
                const isCurrentTopic = topic.category === currentExercise.topic;
                const topicProgress =
                  topicExercises.length > 0
                    ? Math.round((topicAnswered / topicExercises.length) * 100)
                    : 0;

                return (
                  <div
                    key={topic.id}
                    className={`rounded-3xl border p-5 ${
                      isCurrentTopic
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{topic.category}</h3>
                        <p
                          className={`mt-1 text-sm ${
                            isCurrentTopic ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {topicExercises.length} Diagnose-Aufgaben
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isCurrentTopic
                            ? "bg-white/10 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {topicAnswered}/{topicExercises.length}
                      </span>
                    </div>

                    <div
                      className={`mt-4 h-2.5 overflow-hidden rounded-full ${
                        isCurrentTopic ? "bg-white/10" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          isCurrentTopic ? "bg-white" : "bg-black"
                        }`}
                        style={{ width: `${Math.max(4, topicProgress)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Aufgabe {currentQuestionNumber}
                </p>
                <h2 className="mt-2 text-2xl font-bold">{currentExercise.topic}</h2>
                <p className="mt-3 max-w-2xl text-gray-600">
                  Lies die Aufgabe in Ruhe und wähle die Antwort, die für dich
                  am besten passt.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                {currentQuestionNumber} / {totalQuestions}
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {currentExercise.question}
              </h3>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {currentExercise.options.map((option: string) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectAnswer(option)}
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
                <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-gray-600">
                  Antwort gewählt:{" "}
                  <span className="font-semibold text-gray-900">
                    {selectedAnswer}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="rounded-2xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Zurück
              </button>

              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-2xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
                >
                  Nächste Frage
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishDiagnose}
                  disabled={saving}
                  className="rounded-2xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Speichert..." : "Diagnose abschließen"}
                </button>
              )}

              <Link
                href="/diagnose-start"
                className="rounded-2xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-800 transition hover:bg-gray-50"
              >
                Zurück zum Start
              </Link>
            </div>
          </section>
        </div>

        {errorMessage && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {answeredCount === totalQuestions && totalQuestions > 0 && (
          <section className="mt-8 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Vorläufiges Ergebnis
                </p>
                <h2 className="mt-2 text-3xl font-bold">
                  {getScoreHeadline(scorePercent)}
                </h2>
                <p className="mt-4 text-gray-600">
                  Aktuell hast du {correctCount} von {totalQuestions} Aufgaben
                  richtig beantwortet. Das entspricht {scorePercent}%.
                </p>
                <p className="mt-3 max-w-2xl text-gray-600">
                  {getScoreText(scorePercent)}
                </p>

                {weakestTopic && (
                  <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Vermutlich wichtigster Fokus danach
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {weakestTopic.topic}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[24px] bg-black p-6 text-white shadow-sm">
                <p className="text-sm text-gray-400">Zwischenstand</p>
                <p className="mt-3 text-4xl font-bold">{scorePercent}%</p>
                <p className="mt-2 text-sm text-gray-300">
                  {correctCount} / {totalQuestions} richtig
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${Math.max(6, scorePercent)}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}