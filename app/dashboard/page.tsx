"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TrainingSession, formatDateShort } from "@/lib/training-engine";

type DashboardUser = {
  id: string;
  email: string | null;
};

type TrainingResultRow = {
  id: string;
  userId: string;
  focus: string;
  title: string;
  correctAnswers: number;
  totalQuestions: number;
  createdAt: string;
};

type DiagnosticResultRow = {
  id: string;
  user_id: string;
  score: number;
  created_at: string;
};

type TrainingScheduleRow = {
  id: string;
  user_id: string;
  date: string;
  weekday_label: string;
  completed: boolean;
  completed_at: string | null;
  score_percent: number | null;
};

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

function clearSetupStorage() {
  if (typeof window === "undefined") return;

  [
    "selectedClass",
    "selectedAge",
    "selectedTopics",
    "selectedSchoolStage",
    "diagnoseTopicConfidence",
    "trainingFrequency",
    "setupCompleted",
    "placementSummary",
    "topicLevels",
    "currentPlacementTasks",
    "currentTrainingTasks",
    "user",
    "diagnoseCompleted",
  ].forEach((key) => localStorage.removeItem(key));
}

function mapScheduleRowsToTrainingSessions(
  rows: TrainingScheduleRow[]
): TrainingSession[] {
  return rows.map((item) => ({
    id: item.id,
    date: item.date,
    weekdayLabel: item.weekday_label,
    completed: item.completed,
    completedAt: item.completed_at,
    scorePercent: item.score_percent,
  }));
}

function calculatePercent(correctAnswers: number, totalQuestions: number) {
  if (!totalQuestions || totalQuestions <= 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}

function formatAccuracy(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getLevelLabel(level: 1 | 2 | 3) {
  if (level === 1) return "Level 1";
  if (level === 2) return "Level 2";
  return "Level 3";
}

function getLevelDescription(level: 1 | 2 | 3) {
  if (level === 1) return "Aufbau nötig";
  if (level === 2) return "Solide Basis";
  return "Stark";
}

function getLevelBadgeClasses(level: 1 | 2 | 3) {
  if (level === 1) return "bg-red-100 text-red-700";
  if (level === 2) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-700";
}

function formatLastPracticed(value: string | null) {
  if (!value) return "Noch kein Training";
  return new Date(value).toLocaleString("de-AT");
}

function getGreeting(email: string | null) {
  if (!email) return "Willkommen zurück";
  return `Hallo, ${email}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const isMountedRef = useRef(true);

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [learningProfile, setLearningProfile] =
    useState<LearningProfileRow | null>(null);
  const [diagnosticResult, setDiagnosticResult] =
    useState<DiagnosticResultRow | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<TrainingSession[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingResultRow[]>(
    []
  );
  const [topicLevels, setTopicLevels] = useState<TopicLevelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const resetDashboardState = useCallback(() => {
    if (!isMountedRef.current) return;

    setLearningProfile(null);
    setDiagnosticResult(null);
    setTrainingPlan([]);
    setTrainingHistory([]);
    setTopicLevels([]);
    setErrorMessage("");
  }, []);

  const loadDashboardData = useCallback(
    async (userIdFromEvent?: string, emailFromEvent?: string | null) => {
      if (!isMountedRef.current) return;

      setLoading(true);
      resetDashboardState();

      try {
        let authUserId = userIdFromEvent;
        let authUserEmail = emailFromEvent ?? null;

        if (!authUserId) {
          const {
            data: { user: authUser },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            if (!isMountedRef.current) return;
            setErrorMessage(
              "Fehler beim Laden des Nutzers: " + userError.message
            );
            setLoading(false);
            return;
          }

          if (!authUser) {
            if (!isMountedRef.current) return;
            setUser(null);
            router.replace("/login");
            return;
          }

          authUserId = authUser.id;
          authUserEmail = authUser.email ?? null;
        }

        if (!authUserId) {
          if (!isMountedRef.current) return;
          setUser(null);
          router.replace("/login");
          return;
        }

        if (!isMountedRef.current) return;

        setUser({
          id: authUserId,
          email: authUserEmail,
        });

        const [
          learningProfileResponse,
          diagnosticResponse,
          scheduleResponse,
          trainingResponse,
          topicLevelResponse,
        ] = await Promise.all([
          supabase
            .from("LearningProfile")
            .select(
              "id, user_id, school_class, age, training_frequency, created_at"
            )
            .eq("user_id", authUserId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("DiagnosticResult")
            .select("id, user_id, score, created_at")
            .eq("user_id", authUserId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("TrainingSchedule")
            .select(
              "id, user_id, date, weekday_label, completed, completed_at, score_percent"
            )
            .eq("user_id", authUserId)
            .order("date", { ascending: true }),

          supabase
            .from("TrainingResult")
            .select(
              "id, userId, focus, title, correctAnswers, totalQuestions, createdAt"
            )
            .eq("userId", authUserId)
            .order("createdAt", { ascending: false })
            .limit(8),

          supabase
            .from("TopicLevel")
            .select(
              "id, user_id, category, level, total_answered, total_correct, accuracy, last_practiced_at, created_at, updated_at"
            )
            .eq("user_id", authUserId)
            .order("level", { ascending: true }),
        ]);

        if (!isMountedRef.current) return;

        const firstError =
          learningProfileResponse.error ??
          diagnosticResponse.error ??
          scheduleResponse.error ??
          trainingResponse.error ??
          topicLevelResponse.error;

        if (firstError) {
          setErrorMessage(
            "Fehler beim Laden des Dashboards: " + firstError.message
          );
          setLoading(false);
          return;
        }

        const profile =
          (learningProfileResponse.data as LearningProfileRow | null) ?? null;
        const diagnostic =
          (diagnosticResponse.data as DiagnosticResultRow | null) ?? null;

        if (!profile) {
          router.replace("/diagnose-start");
          return;
        }

        if (!diagnostic) {
          router.replace("/diagnose");
          return;
        }

        setLearningProfile(profile);
        setDiagnosticResult(diagnostic);

        setTrainingPlan(
          mapScheduleRowsToTrainingSessions(
            ((scheduleResponse.data ?? []) as TrainingScheduleRow[])
          )
        );

        setTrainingHistory((trainingResponse.data ?? []) as TrainingResultRow[]);

        const mappedTopicLevels: TopicLevelRow[] = (
          (topicLevelResponse.data ?? []) as any[]
        ).map((row) => ({
          id: row.id,
          user_id: row.user_id,
          category: row.category,
          level: row.level,
          total_answered: row.total_answered ?? 0,
          total_correct: row.total_correct ?? 0,
          accuracy: Number(row.accuracy ?? 0),
          last_practiced_at: row.last_practiced_at ?? null,
          created_at: row.created_at,
          updated_at: row.updated_at ?? null,
        }));

        setTopicLevels(mappedTopicLevels);
      } catch (error) {
        console.error("DASHBOARD ERROR:", error);

        if (!isMountedRef.current) return;
        setErrorMessage("Unerwarteter Fehler im Dashboard.");
      } finally {
        if (!isMountedRef.current) return;
        setLoading(false);
      }
    },
    [resetDashboardState, router]
  );

  useEffect(() => {
    isMountedRef.current = true;

    void loadDashboardData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMountedRef.current) return;

      if (!session?.user) {
        setUser(null);
        resetDashboardState();
        router.replace("/login");
        return;
      }

      void loadDashboardData(session.user.id, session.user.email ?? null);
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [loadDashboardData, resetDashboardState, router]);

  async function handleLogout() {
    setErrorMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage("Fehler beim Logout: " + error.message);
      return;
    }

    clearSetupStorage();
    resetDashboardState();
    setUser(null);
    router.replace("/login");
  }

  const nextOpenSession = useMemo(
    () => trainingPlan.find((item) => !item.completed) ?? null,
    [trainingPlan]
  );

  const completedTrainings = useMemo(
    () => trainingPlan.filter((item) => item.completed).length,
    [trainingPlan]
  );

  const openTrainings = useMemo(
    () => trainingPlan.filter((item) => !item.completed).length,
    [trainingPlan]
  );

  const weakestTopic = useMemo(() => {
    const trainedTopics = topicLevels.filter((topic) => topic.total_answered > 0);
    if (trainedTopics.length === 0) return null;

    return [...trainedTopics].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.accuracy - b.accuracy;
    })[0];
  }, [topicLevels]);

  const strongestTopic = useMemo(() => {
    const trainedTopics = topicLevels.filter((topic) => topic.total_answered > 0);
    if (trainedTopics.length === 0) return null;

    return [...trainedTopics].sort((a, b) => {
      if (a.level !== b.level) return b.level - a.level;
      return b.accuracy - a.accuracy;
    })[0];
  }, [topicLevels]);

  const averageAccuracy = useMemo(() => {
    if (topicLevels.length === 0) return 0;
    const sum = topicLevels.reduce((acc, item) => acc + item.accuracy, 0);
    return sum / topicLevels.length;
  }, [topicLevels]);

  const sortedTopicLevels = useMemo(() => {
    return [...topicLevels].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return a.category.localeCompare(b.category);
    });
  }, [topicLevels]);

  const recommendedTopic = useMemo(() => {
    if (weakestTopic) return weakestTopic;

    if (topicLevels.length > 0) {
      return [...topicLevels].sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.accuracy - b.accuracy;
      })[0];
    }

    return null;
  }, [weakestTopic, topicLevels]);

  const weeklyGoal = useMemo(() => {
    if (!learningProfile?.training_frequency) return 3;
    return learningProfile.training_frequency;
  }, [learningProfile]);

  const trainingsLeftForGoal = useMemo(() => {
    return Math.max(weeklyGoal - completedTrainings, 0);
  }, [weeklyGoal, completedTrainings]);

  const weeklyGoalProgress = useMemo(() => {
    if (weeklyGoal <= 0) return 0;
    return Math.min(100, Math.round((completedTrainings / weeklyGoal) * 100));
  }, [completedTrainings, weeklyGoal]);

  const weeklyGoalText = useMemo(() => {
    if (completedTrainings >= weeklyGoal) {
      return "Wochenziel erreicht. Sehr stark.";
    }

    if (trainingsLeftForGoal === 1) {
      return "Noch 1 Training bis zu deinem Wochenziel.";
    }

    return `Noch ${trainingsLeftForGoal} Trainings bis zu deinem Wochenziel.`;
  }, [completedTrainings, weeklyGoal, trainingsLeftForGoal]);

  const weeklySummary = useMemo(() => {
    if (completedTrainings === 0) {
      return "Du hast diese Woche noch kein Training abgeschlossen. Starte jetzt deine nächste Einheit.";
    }

    if (completedTrainings === 1) {
      return "Guter Start. Du hast bereits 1 Training abgeschlossen.";
    }

    if (completedTrainings < 4) {
      return `Stark. Du hast schon ${completedTrainings} Trainings abgeschlossen.`;
    }

    return `Sehr stark. Du hast bereits ${completedTrainings} Trainings abgeschlossen.`;
  }, [completedTrainings]);

  const motivationHeadline = useMemo(() => {
    if (completedTrainings === 0) return "Starte heute mit deinem ersten Schritt.";
    if (completedTrainings === 1) return "Du bist schon drin. Bleib dran.";
    if (completedTrainings < weeklyGoal) return "Starker Fortschritt. Mach weiter so.";
    return "Richtig stark. Du ziehst dein Training durch.";
  }, [completedTrainings, weeklyGoal]);

  const motivationText = useMemo(() => {
    if (recommendedTopic) {
      return `Wenn du heute ${recommendedTopic.category} trainierst, arbeitest du genau an dem Thema, das dir aktuell am meisten bringt.`;
    }

    return "Mit jeder Einheit wird dein Lernstand klarer und dein Lernpfad genauer.";
  }, [recommendedTopic]);

  const recommendationText = useMemo(() => {
    if (!recommendedTopic) {
      return "Starte mit deinem nächsten Training, um erste Themenstände aufzubauen.";
    }

    if (recommendedTopic.level === 1) {
      return `Dein sinnvollster nächster Schritt ist aktuell ${recommendedTopic.category}. Hier solltest du zuerst ansetzen.`;
    }

    if (recommendedTopic.level === 2) {
      return `Bei ${recommendedTopic.category} hast du schon eine Basis. Mit etwas Training kannst du hier schnell sicherer werden.`;
    }

    return `Du bist bei ${recommendedTopic.category} bereits gut unterwegs. Nutze das Thema, um dein Niveau weiter zu festigen.`;
  }, [recommendedTopic]);

  const dashboardStatusText = useMemo(() => {
    if (!recommendedTopic && completedTrainings === 0) {
      return "Du stehst noch ganz am Anfang. Richte deinen Fokus auf dein erstes Training.";
    }

    if (recommendedTopic && recommendedTopic.level === 1) {
      return `Aktuell liegt dein Fokus auf ${recommendedTopic.category}.`;
    }

    if (strongestTopic) {
      return `Dein stärkstes Thema ist aktuell ${strongestTopic.category}.`;
    }

    return "Du bist auf einem guten Weg. Mach mit deinem Lernpfad weiter.";
  }, [recommendedTopic, strongestTopic, completedTrainings]);

  const nextStep = useMemo(() => {
    if (nextOpenSession) {
      return {
        href: `/lernpfad?sessionId=${nextOpenSession.id}`,
        label: "Nächstes Training starten",
        status: "Lernpfad aktiv",
        description:
          "Dein nächstes offenes Training ist bereit. Starte direkt oder wähle weiter unten eine bestimmte Einheit.",
      };
    }

    return {
      href: "/lernpfad",
      label: "Lernpfad öffnen",
      status: "Alle geplanten Trainings erledigt",
      description:
        "Du hast aktuell alle geplanten Einheiten abgeschlossen. Öffne deinen Lernpfad für neue Aufgaben.",
    };
  }, [nextOpenSession]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-56 rounded-2xl bg-gray-200" />
            <div className="h-56 rounded-[32px] bg-gray-200" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-32 rounded-3xl bg-gray-200" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-72 rounded-[32px] bg-gray-200" />
              <div className="h-72 rounded-[32px] bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-700 sm:p-8">
            <p className="text-lg font-semibold">Es ist ein Fehler aufgetreten.</p>
            <p className="mt-2">{errorMessage}</p>

            <button
              onClick={() => void loadDashboardData()}
              className="mt-5 rounded-2xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700"
            >
              Erneut laden
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-6">
          <section className="overflow-hidden rounded-[36px] bg-black text-white shadow-2xl">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-400">
                  Dashboard
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  {getGreeting(user?.email ?? null)}
                </h1>

                <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-300">
                  {dashboardStatusText} Hier siehst du deinen Lernstand, deinen
                  nächsten sinnvollen Schritt und die Themen, auf die du dich
                  jetzt konzentrieren solltest.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={nextStep.href}
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-gray-100"
                  >
                    {nextStep.label}
                  </Link>

                  <Link
                    href="/diagnose-start"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Profil anpassen
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-transparent px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Fokus
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {recommendedTopic?.category ?? "Noch offen"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Wochenziel
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {weeklyGoal}x Training
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Fortschritt
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {completedTrainings} erledigt
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Nächster Schritt</p>
                    <h2 className="mt-2 text-2xl font-bold">{nextStep.status}</h2>
                  </div>

                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Aktiv
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-300">
                  {nextStep.description}
                </p>

                <div className="mt-5 rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Empfehlung
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    {recommendationText}
                  </p>
                </div>

                <div className="mt-6 rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Wochenziel</span>
                    <span className="font-semibold text-white">
                      {completedTrainings} / {weeklyGoal}
                    </span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${Math.max(6, weeklyGoalProgress)}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-gray-300">{weeklyGoalText}</p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Offen
                    </p>
                    <p className="mt-2 text-2xl font-bold">{openTrainings}</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Erledigt
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {completedTrainings}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Ausgangstest</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                {diagnosticResult ? `${diagnosticResult.score}%` : "—"}
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Dein zuletzt gespeichertes Ergebnis aus dem Ausgangstest.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Erledigte Trainings</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                {completedTrainings}
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Bereits abgeschlossene Trainingseinheiten.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Offene Trainings</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                {openTrainings}
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Einheiten, die du als Nächstes absolvieren kannst.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Ø Themen-Accuracy</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                {topicLevels.length > 0 ? formatAccuracy(averageAccuracy) : "—"}
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Durchschnittliche Trefferquote über alle Themen.
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm text-gray-500">Dein aktueller Fokus</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {recommendedTopic?.category ?? "Noch kein Fokus gesetzt"}
              </h2>

              <p className="mt-4 text-gray-600">{recommendationText}</p>

              {recommendedTopic && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getLevelBadgeClasses(
                      recommendedTopic.level
                    )}`}
                  >
                    {getLevelLabel(recommendedTopic.level)}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    Accuracy {formatAccuracy(recommendedTopic.accuracy)}
                  </span>
                </div>
              )}

              <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Nächster sinnvoller Schritt
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  Arbeite jetzt gezielt an diesem Thema, bevor du zu den
                  schwierigeren Bereichen wechselst.
                </p>
              </div>

              <div className="mt-6">
                <Link
                  href={
                    recommendedTopic
                      ? `/lernpfad?focusTopic=${encodeURIComponent(
                          recommendedTopic.category
                        )}`
                      : "/lernpfad"
                  }
                  className="inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Jetzt gezielt trainieren
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm text-gray-500">Wo du gerade stehst</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Deine Wochenübersicht
              </h2>

              <p className="mt-4 text-gray-600">{weeklySummary}</p>

              <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Fortschritt zum Wochenziel</span>
                  <span className="font-semibold text-gray-900">
                    {completedTrainings} / {weeklyGoal}
                  </span>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{ width: `${Math.max(6, weeklyGoalProgress)}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-gray-600">{weeklyGoalText}</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Stärkstes Thema</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {strongestTopic?.category ?? "Noch nicht vorhanden"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Größter Hebel</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {recommendedTopic?.category ?? "Noch offen"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-gray-500">Motivation</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {motivationHeadline}
                </h2>
                <p className="mt-4 max-w-3xl text-gray-600">
                  {motivationText}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                  Erledigt: {completedTrainings}
                </div>
                <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                  Wochenziel: {weeklyGoal}
                </div>
                <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                  Offen: {trainingsLeftForGoal}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm text-gray-500">Stärkstes Thema</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {strongestTopic?.category ?? "Noch keine Themen vorhanden"}
              </h2>

              {strongestTopic ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getLevelBadgeClasses(
                        strongestTopic.level
                      )}`}
                    >
                      {getLevelLabel(strongestTopic.level)}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      Accuracy {formatAccuracy(strongestTopic.accuracy)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-gray-600">
                    Status: {getLevelDescription(strongestTopic.level)}
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Zuletzt trainiert:{" "}
                    {formatLastPracticed(strongestTopic.last_practiced_at)}
                  </p>
                </>
              ) : (
                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    Sobald du erste Themen bearbeitest, erscheint hier
                    automatisch dein aktuell stärkstes Thema.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm text-gray-500">Schwächstes Thema</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {weakestTopic?.category ?? "Noch keine Themen vorhanden"}
              </h2>

              {weakestTopic ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getLevelBadgeClasses(
                        weakestTopic.level
                      )}`}
                    >
                      {getLevelLabel(weakestTopic.level)}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      Accuracy {formatAccuracy(weakestTopic.accuracy)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-gray-600">
                    Status: {getLevelDescription(weakestTopic.level)}
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Zuletzt trainiert:{" "}
                    {formatLastPracticed(weakestTopic.last_practiced_at)}
                  </p>

                  <div className="mt-6">
                    <Link
                      href={`/lernpfad?focusTopic=${encodeURIComponent(
                        weakestTopic.category
                      )}`}
                      className="inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                      Direkt weitertrainieren
                    </Link>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    Sobald du erste Themen bearbeitest, zeigen wir dir hier
                    automatisch, wo du den größten Hebel für deinen Fortschritt
                    hast.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-500">Themenfortschritt</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  Level, Accuracy und Aktivität
                </h2>
              </div>

              <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                {topicLevels.length} Themen
              </div>
            </div>

            {topicLevels.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  Noch keine Themenfortschritte vorhanden
                </h3>
                <p className="mt-3 max-w-2xl text-gray-600">
                  Sobald du Themen trainierst, siehst du hier dein Niveau, deine
                  Accuracy und deine Entwicklung über die Zeit.
                </p>

                <div className="mt-5">
                  <Link
                    href="/lernpfad"
                    className="inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Erstes Training starten
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedTopicLevels.map((topic) => (
                  <div
                    key={topic.id}
                    className="rounded-3xl border border-gray-200 bg-gray-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Thema</p>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">
                          {topic.category}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getLevelBadgeClasses(
                          topic.level
                        )}`}
                      >
                        {getLevelLabel(topic.level)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-gray-500">Accuracy</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatAccuracy(topic.accuracy)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-gray-500">
                          Richtig beantwortet
                        </p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {topic.total_correct} / {topic.total_answered}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                        <span>Fortschritt</span>
                        <span>{formatAccuracy(topic.accuracy)}</span>
                      </div>

                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-black transition-all"
                          style={{
                            width: `${Math.max(
                              4,
                              Math.round(topic.accuracy * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-gray-600">
                      Einschätzung: {getLevelDescription(topic.level)}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      Zuletzt trainiert:{" "}
                      {formatLastPracticed(topic.last_practiced_at)}
                    </p>

                    <div className="mt-5">
                      <Link
                        href={`/lernpfad?focusTopic=${encodeURIComponent(
                          topic.category
                        )}`}
                        className="inline-flex rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                      >
                        Dieses Thema trainieren
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Trainingsplan</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    Einzelne Einheiten auswählen
                  </h2>
                </div>

                <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                  {completedTrainings} / {trainingPlan.length} erledigt
                </div>
              </div>

              {trainingPlan.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Noch kein Trainingsplan vorhanden
                  </h3>
                  <p className="mt-3 max-w-2xl text-gray-600">
                    Sobald dein Trainingsplan erstellt oder geladen wurde,
                    kannst du hier deine nächsten Einheiten direkt auswählen.
                  </p>

                  <div className="mt-5">
                    <Link
                      href="/lernpfad"
                      className="inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                      Lernpfad öffnen
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {trainingPlan.map((session) => (
                    <div
                      key={session.id}
                      className={`rounded-3xl border p-5 ${
                        session.completed
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {session.weekdayLabel}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-gray-900">
                            {formatDateShort(session.date)}
                          </h3>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            session.completed
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {session.completed ? "Erledigt" : "Offen"}
                        </span>
                      </div>

                      {session.scorePercent !== null && (
                        <p className="mt-4 text-sm text-gray-600">
                          Ergebnis: {session.scorePercent}%
                        </p>
                      )}

                      <div className="mt-5">
                        {session.completed ? (
                          <button
                            disabled
                            className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-700"
                          >
                            Bereits abgeschlossen
                          </button>
                        ) : (
                          <Link
                            href={`/lernpfad?sessionId=${session.id}`}
                            className="block w-full rounded-2xl bg-black px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
                          >
                            Dieses Training starten
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm text-gray-500">Letzte Trainings</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Verlauf</h2>

              {trainingHistory.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Noch keine Trainings-Ergebnisse
                  </h3>
                  <p className="mt-3 text-gray-600">
                    Du hast noch kein Training abgeschlossen. Sobald du deine
                    erste Einheit speicherst, erscheint hier dein Verlauf mit
                    Ergebnissen.
                  </p>

                  <div className="mt-5">
                    <Link
                      href="/lernpfad"
                      className="inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                      Jetzt trainieren
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {trainingHistory.map((training) => (
                    <div
                      key={training.id}
                      className="rounded-3xl border border-gray-200 bg-gray-50 p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {training.title || training.focus || "Training"}
                          </h3>
                          <p className="mt-2 text-sm text-gray-600">
                            Ergebnis: {training.correctAnswers} /{" "}
                            {training.totalQuestions}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm">
                          {calculatePercent(
                            training.correctAnswers,
                            training.totalQuestions
                          )}
                          %
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-gray-500">
                        Gespeichert am:{" "}
                        {new Date(training.createdAt).toLocaleString("de-AT")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Klasse</p>
              <h3 className="mt-2 text-xl font-bold text-gray-900">
                {learningProfile?.school_class ?? "Noch nicht gesetzt"}
              </h3>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Alter</p>
              <h3 className="mt-2 text-xl font-bold text-gray-900">
                {learningProfile?.age ?? "Noch nicht gesetzt"}
              </h3>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Trainingsfrequenz</p>
              <h3 className="mt-2 text-xl font-bold text-gray-900">
                {learningProfile
                  ? `${learningProfile.training_frequency}x pro Woche`
                  : "Noch nicht gesetzt"}
              </h3>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}