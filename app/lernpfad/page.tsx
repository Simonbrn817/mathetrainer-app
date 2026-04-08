"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LearningProfileRow = {
  id: string;
  user_id: string;
  school_class: string;
  age: number;
  training_frequency: number;
  created_at: string;
};

type DiagnosticResultRow = {
  id: string;
  user_id: string;
  score: number;
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

type TrainingScheduleRow = {
  id: string;
  user_id: string;
  date: string;
  weekday_label: string;
  completed: boolean;
  completed_at: string | null;
  score_percent: number | null;
};

type Exercise = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  mistakeTip?: string;
  rememberTip?: string;
};

function getDefaultExercises(topic: string, level: 1 | 2 | 3): Exercise[] {
  const easy: Exercise[] = [
    {
      id: `${topic}-1`,
      question: `${topic}: Was ist 6 + 7?`,
      options: ["11", "12", "13", "14"],
      correctAnswer: "13",
      explanation: "6 + 7 = 13.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
    {
      id: `${topic}-2`,
      question: `${topic}: Was ist 15 - 8?`,
      options: ["5", "6", "7", "8"],
      correctAnswer: "7",
      explanation: "15 - 8 = 7.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
    {
      id: `${topic}-3`,
      question: `${topic}: Was ist 4 × 5?`,
      options: ["18", "20", "22", "24"],
      correctAnswer: "20",
      explanation: "4 mal 5 ergibt 20.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
    {
      id: `${topic}-4`,
      question: `${topic}: Was ist 18 : 3?`,
      options: ["5", "6", "7", "8"],
      correctAnswer: "6",
      explanation: "18 geteilt durch 3 ergibt 6.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
  ];

  const medium: Exercise[] = [
    {
      id: `${topic}-1`,
      question: `${topic}: Löse x + 9 = 17`,
      options: ["6", "7", "8", "9"],
      correctAnswer: "8",
      explanation: "17 - 9 = 8.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
    {
      id: `${topic}-2`,
      question: `${topic}: Was ist 3/4 von 16?`,
      options: ["10", "11", "12", "13"],
      correctAnswer: "12",
      explanation: "16 / 4 = 4, dann 4 × 3 = 12.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
    {
      id: `${topic}-3`,
      question: `${topic}: 0,25 entspricht ...`,
      options: ["2,5%", "25%", "250%", "0,25%"],
      correctAnswer: "25%",
      explanation: "0,25 = 25%.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
    {
      id: `${topic}-4`,
      question: `${topic}: Umfang eines Rechtecks mit 5 cm und 3 cm?`,
      options: ["8 cm", "15 cm", "16 cm", "20 cm"],
      correctAnswer: "16 cm",
      explanation: "2 × (5 + 3) = 16.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
  ];

  const hard: Exercise[] = [
    {
      id: `${topic}-1`,
      question: `${topic}: Löse 2x + 6 = 18`,
      options: ["5", "6", "7", "8"],
      correctAnswer: "6",
      explanation: "2x = 12, also x = 6.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
    {
      id: `${topic}-2`,
      question: `${topic}: Wie viel Prozent sind 18 von 24?`,
      options: ["65%", "70%", "75%", "80%"],
      correctAnswer: "75%",
      explanation: "18 / 24 = 0,75 = 75%.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
    {
      id: `${topic}-3`,
      question: `${topic}: Was ist 1,5 × 8?`,
      options: ["10", "11", "12", "13"],
      correctAnswer: "12",
      explanation: "1,5 mal 8 ergibt 12.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
    {
      id: `${topic}-4`,
      question: `${topic}: Ein Quadrat hat Fläche 49 cm². Wie lang ist eine Seite?`,
      options: ["6 cm", "7 cm", "8 cm", "9 cm"],
      correctAnswer: "7 cm",
      explanation: "√49 = 7.",
      mistakeTip: "Achte darauf, Rechenzeichen und Reihenfolge nicht zu verwechseln.",
rememberTip: "Rechne Schritt für Schritt und prüfe dein Ergebnis am Ende kurz nach.",
    },
  ];

  if (level === 1) return easy;
  if (level === 2) return medium;
  return hard;
}

function getExercisesForTopic(topic: string, level: 1 | 2 | 3): Exercise[] {
  const normalized = topic.toLowerCase();

  if (normalized.includes("addition") || normalized.includes("subtraktion")) {
    if (level === 1) {
      return [
        {
          id: `${topic}-1`,
          question: "Was ist 27 + 15?",
          options: ["40", "41", "42", "43"],
          correctAnswer: "42",
          explanation:
            "27 + 15 = 42. Rechne erst 27 + 10 = 37 und dann + 5 = 42.",
        },
        {
          id: `${topic}-2`,
          question: "Was ist 63 - 28?",
          options: ["33", "34", "35", "36"],
          correctAnswer: "35",
          explanation:
            "63 - 28 = 35. Du kannst zuerst 63 - 20 und dann - 8 rechnen.",
        },
        {
          id: `${topic}-3`,
          question: "Was ist 105 + 9?",
          options: ["112", "113", "114", "115"],
          correctAnswer: "114",
          explanation: "105 + 9 = 114.",
        },
        {
          id: `${topic}-4`,
          question: "Was ist 90 - 47?",
          options: ["41", "42", "43", "44"],
          correctAnswer: "43",
          explanation: "90 - 47 = 43.",
        },
      ];
    }

    if (level === 2) {
      return [
        {
          id: `${topic}-1`,
          question: "Löse: x + 18 = 46",
          options: ["26", "27", "28", "29"],
          correctAnswer: "28",
          explanation:
            "Du rechnest 46 - 18. So erhältst du x = 28.",
        },
        {
          id: `${topic}-2`,
          question: "Löse: 72 - x = 19",
          options: ["51", "52", "53", "54"],
          correctAnswer: "53",
          explanation:
            "72 - 53 = 19. Also ist x = 53.",
        },
        {
          id: `${topic}-3`,
          question: "Was ist 238 + 167?",
          options: ["395", "405", "415", "425"],
          correctAnswer: "405",
          explanation:
            "238 + 167 = 405.",
        },
        {
          id: `${topic}-4`,
          question: "Was ist 500 - 286?",
          options: ["204", "214", "224", "234"],
          correctAnswer: "214",
          explanation:
            "500 - 286 = 214.",
        },
      ];
    }

    return [
      {
        id: `${topic}-1`,
        question: "Ein Konto hat 240 €. Es werden 85 € eingezahlt und dann 49 € abgehoben. Wie viel bleibt?",
        options: ["266 €", "276 €", "286 €", "296 €"],
        correctAnswer: "276 €",
        explanation:
          "240 + 85 = 325, danach 325 - 49 = 276.",
      },
      {
        id: `${topic}-2`,
        question: "Löse: 3x + 14 = 50",
        options: ["10", "11", "12", "13"],
        correctAnswer: "12",
        explanation:
          "Erst 14 abziehen: 36. Dann durch 3 teilen: x = 12.",
      },
      {
        id: `${topic}-3`,
        question: "Was ist 1.200 - 478?",
        options: ["712", "722", "732", "742"],
        correctAnswer: "722",
        explanation:
          "1.200 - 478 = 722.",
      },
      {
        id: `${topic}-4`,
        question: "Löse: 2x - 9 = 35",
        options: ["20", "21", "22", "23"],
        correctAnswer: "22",
        explanation:
          "9 addieren ergibt 44, dann durch 2 teilen: x = 22.",
      },
    ];
  }

  if (normalized.includes("multiplikation") || normalized.includes("division")) {
    if (level === 1) {
      return [
        {
          id: `${topic}-1`,
          question: "Was ist 6 × 7?",
          options: ["36", "42", "48", "56"],
          correctAnswer: "42",
          explanation: "6 mal 7 ergibt 42.",
        },
        {
          id: `${topic}-2`,
          question: "Was ist 36 : 6?",
          options: ["5", "6", "7", "8"],
          correctAnswer: "6",
          explanation: "36 geteilt durch 6 ergibt 6.",
        },
        {
          id: `${topic}-3`,
          question: "Was ist 9 × 4?",
          options: ["32", "34", "36", "38"],
          correctAnswer: "36",
          explanation: "9 mal 4 = 36.",
        },
        {
          id: `${topic}-4`,
          question: "Was ist 45 : 5?",
          options: ["7", "8", "9", "10"],
          correctAnswer: "9",
          explanation: "45 geteilt durch 5 = 9.",
        },
      ];
    }

    if (level === 2) {
      return [
        {
          id: `${topic}-1`,
          question: "Was ist 14 × 6?",
          options: ["72", "84", "96", "106"],
          correctAnswer: "84",
          explanation:
            "14 mal 6 = 84.",
        },
        {
          id: `${topic}-2`,
          question: "Was ist 96 : 8?",
          options: ["11", "12", "13", "14"],
          correctAnswer: "12",
          explanation:
            "96 geteilt durch 8 ergibt 12.",
        },
        {
          id: `${topic}-3`,
          question: "Löse: 7x = 56",
          options: ["6", "7", "8", "9"],
          correctAnswer: "8",
          explanation:
            "Beide Seiten durch 7 teilen: x = 8.",
        },
        {
          id: `${topic}-4`,
          question: "Was ist 125 : 5?",
          options: ["15", "20", "25", "30"],
          correctAnswer: "25",
          explanation:
            "125 geteilt durch 5 = 25.",
        },
      ];
    }

    return [
      {
        id: `${topic}-1`,
        question: "Was ist 18 × 12?",
        options: ["196", "206", "216", "226"],
        correctAnswer: "216",
        explanation:
          "18 × 12 = 216.",
      },
      {
        id: `${topic}-2`,
        question: "Was ist 144 : 12?",
        options: ["11", "12", "13", "14"],
        correctAnswer: "12",
        explanation:
          "144 geteilt durch 12 = 12.",
      },
      {
        id: `${topic}-3`,
        question: "Ein Ticket kostet 7 €. Wie viel kosten 18 Tickets?",
        options: ["116 €", "126 €", "136 €", "146 €"],
        correctAnswer: "126 €",
        explanation:
          "18 × 7 = 126.",
      },
      {
        id: `${topic}-4`,
        question: "Löse: 84 = 12x",
        options: ["5", "6", "7", "8"],
        correctAnswer: "7",
        explanation:
          "84 durch 12 ergibt 7.",
      },
    ];
  }

  if (normalized.includes("bruch")) {
    if (level === 1) {
      return [
        {
          id: `${topic}-1`,
          question: "Welcher Bruch ist gleich 1/2?",
          options: ["2/3", "2/4", "3/5", "4/10"],
          correctAnswer: "2/4",
          explanation:
            "2/4 lässt sich zu 1/2 kürzen.",
        },
        {
          id: `${topic}-2`,
          question: "Was ist größer?",
          options: ["1/4", "1/2", "gleich groß", "nicht bestimmbar"],
          correctAnswer: "1/2",
          explanation:
            "Ein Halb ist größer als ein Viertel.",
        },
        {
          id: `${topic}-3`,
          question: "Wie viel ist 1/4 von 20?",
          options: ["4", "5", "6", "7"],
          correctAnswer: "5",
          explanation:
            "20 durch 4 = 5.",
        },
        {
          id: `${topic}-4`,
          question: "Welcher Bruch ist am größten?",
          options: ["1/3", "1/2", "1/4", "1/5"],
          correctAnswer: "1/2",
          explanation:
            "Von diesen Stammbrüchen ist 1/2 am größten.",
        },
      ];
    }

    if (level === 2) {
      return [
        {
          id: `${topic}-1`,
          question: "Was ist 2/3 von 12?",
          options: ["6", "8", "9", "10"],
          correctAnswer: "8",
          explanation:
            "12 durch 3 = 4, dann 4 × 2 = 8.",
        },
        {
          id: `${topic}-2`,
          question: "Welcher Bruch ist gleich 3/6?",
          options: ["1/2", "1/3", "2/3", "3/4"],
          correctAnswer: "1/2",
          explanation:
            "3/6 gekürzt ergibt 1/2.",
        },
        {
          id: `${topic}-3`,
          question: "Was ist 1/2 + 1/4?",
          options: ["2/4", "3/4", "4/6", "1"],
          correctAnswer: "3/4",
          explanation:
            "1/2 = 2/4, also 2/4 + 1/4 = 3/4.",
        },
        {
          id: `${topic}-4`,
          question: "Was ist 3/4 von 20?",
          options: ["12", "14", "15", "16"],
          correctAnswer: "15",
          explanation:
            "20 durch 4 = 5, dann 5 × 3 = 15.",
        },
      ];
    }

    return [
      {
        id: `${topic}-1`,
        question: "Was ist 2/5 + 1/5?",
        options: ["2/10", "3/5", "3/10", "1/5"],
        correctAnswer: "3/5",
        explanation:
          "Gleicher Nenner: Zähler addieren. 2/5 + 1/5 = 3/5.",
      },
      {
        id: `${topic}-2`,
        question: "Was ist 3/4 - 1/8?",
        options: ["1/2", "5/8", "6/8", "7/8"],
        correctAnswer: "5/8",
        explanation:
          "3/4 = 6/8, dann 6/8 - 1/8 = 5/8.",
      },
      {
        id: `${topic}-3`,
        question: "Welcher Bruch ist größer?",
        options: ["5/8", "3/4", "gleich groß", "nicht bestimmbar"],
        correctAnswer: "3/4",
        explanation:
          "3/4 = 6/8, also größer als 5/8.",
      },
      {
        id: `${topic}-4`,
        question: "Wie viel ist 4/5 von 25?",
        options: ["15", "18", "20", "22"],
        correctAnswer: "20",
        explanation:
          "25 durch 5 = 5, dann 5 × 4 = 20.",
      },
    ];
  }

  if (normalized.includes("gleichung")) {
    if (level === 1) {
      return [
        {
          id: `${topic}-1`,
          question: "Löse: x + 4 = 9",
          options: ["4", "5", "6", "7"],
          correctAnswer: "5",
          explanation:
            "9 - 4 = 5.",
        },
        {
          id: `${topic}-2`,
          question: "Löse: x - 3 = 8",
          options: ["9", "10", "11", "12"],
          correctAnswer: "11",
          explanation:
            "8 + 3 = 11.",
        },
        {
          id: `${topic}-3`,
          question: "Löse: 2x = 14",
          options: ["6", "7", "8", "9"],
          correctAnswer: "7",
          explanation:
            "Beide Seiten durch 2 teilen.",
        },
        {
          id: `${topic}-4`,
          question: "Löse: x + 10 = 18",
          options: ["6", "7", "8", "9"],
          correctAnswer: "8",
          explanation:
            "18 - 10 = 8.",
        },
      ];
    }

    if (level === 2) {
      return [
        {
          id: `${topic}-1`,
          question: "Löse: 3x = 27",
          options: ["7", "8", "9", "10"],
          correctAnswer: "9",
          explanation:
            "27 durch 3 = 9.",
        },
        {
          id: `${topic}-2`,
          question: "Löse: x + 12 = 31",
          options: ["17", "18", "19", "20"],
          correctAnswer: "19",
          explanation:
            "31 - 12 = 19.",
        },
        {
          id: `${topic}-3`,
          question: "Löse: 2x + 5 = 15",
          options: ["4", "5", "6", "7"],
          correctAnswer: "5",
          explanation:
            "Erst 5 abziehen: 10. Dann durch 2 teilen: x = 5.",
        },
        {
          id: `${topic}-4`,
          question: "Löse: 4x = 36",
          options: ["7", "8", "9", "10"],
          correctAnswer: "9",
          explanation:
            "36 durch 4 = 9.",
        },
      ];
    }

    return [
      {
        id: `${topic}-1`,
        question: "Löse: 3x + 6 = 24",
        options: ["4", "5", "6", "7"],
        correctAnswer: "6",
        explanation:
          "6 abziehen ergibt 18, dann durch 3 teilen: x = 6.",
      },
      {
        id: `${topic}-2`,
        question: "Löse: 5x - 10 = 20",
        options: ["4", "5", "6", "7"],
        correctAnswer: "6",
        explanation:
          "10 addieren ergibt 30, dann durch 5 teilen: x = 6.",
      },
      {
        id: `${topic}-3`,
        question: "Löse: 2(x + 3) = 18",
        options: ["5", "6", "7", "8"],
        correctAnswer: "6",
        explanation:
          "Beide Seiten durch 2: x + 3 = 9, dann x = 6.",
      },
      {
        id: `${topic}-4`,
        question: "Löse: 7x = 63",
        options: ["7", "8", "9", "10"],
        correctAnswer: "9",
        explanation:
          "63 durch 7 = 9.",
      },
    ];
  }

  return getDefaultExercises(topic, level);
}

function getLevelText(level: 1 | 2 | 3) {
  if (level === 1) return "Level 1";
  if (level === 2) return "Level 2";
  return "Level 3";
}

function getLevelDescription(level: 1 | 2 | 3) {
  if (level === 1) return "Grundlagen festigen";
  if (level === 2) return "Solide weiter trainieren";
  return "Anspruchsvoll üben";
}

function getLevelBadgeClasses(level: 1 | 2 | 3) {
  if (level === 1) return "bg-red-100 text-red-700";
  if (level === 2) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-700";
}

function clampLevel(value: number): 1 | 2 | 3 {
  if (value <= 1) return 1;
  if (value >= 3) return 3;
  return value as 1 | 2 | 3;
}

function getRecommendationText(topic: TopicLevelRow | null) {
  if (!topic) {
    return "Wähle ein Thema aus und beginne mit deinem nächsten sinnvollen Schritt.";
  }

  if (topic.level === 1) {
    return `Bei ${topic.category} solltest du aktuell zuerst ansetzen. Hier liegt dein wichtigster Hebel.`;
  }

  if (topic.level === 2) {
    return `${topic.category} hat schon eine Basis. Mit gezieltem Training kannst du hier schnell sicherer werden.`;
  }

  return `${topic.category} läuft bereits gut. Nutze das Training, um dein Niveau weiter zu festigen.`;
}

function getResultHeadline(percent: number) {
  if (percent >= 90) return "Sehr stark.";
  if (percent >= 75) return "Stark gemacht.";
  if (percent >= 50) return "Gute Basis.";
  return "Guter Anfang.";
}

function getResultText(percent: number) {
  if (percent >= 90) {
    return "Du hast das Thema aktuell sehr sicher bearbeitet. Das spricht für einen guten Lernstand.";
  }

  if (percent >= 75) {
    return "Das war ein starkes Ergebnis. Mit weiterem Training kannst du das Thema noch stabiler festigen.";
  }

  if (percent >= 50) {
    return "Du hast schon einiges verstanden, aber es gibt noch Potenzial. Genau dafür ist der Lernpfad da.";
  }

  return "Hier lohnt sich weiteres, gezieltes Training besonders. Mit mehreren passenden Aufgaben kannst du das Thema sauber aufbauen.";
}

function formatPercentFromAccuracy(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getAccuracyWidth(value: number) {
  return `${Math.max(4, Math.round(value * 100))}%`;
}

export default function LernpfadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("sessionId");
  const focusTopic = searchParams.get("focusTopic");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [learningProfile, setLearningProfile] =
    useState<LearningProfileRow | null>(null);
  const [diagnosticResult, setDiagnosticResult] =
    useState<DiagnosticResultRow | null>(null);
  const [topicLevels, setTopicLevels] = useState<TopicLevelRow[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedSession, setSelectedSession] =
    useState<TrainingScheduleRow | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
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
            setErrorMessage(
              "Fehler beim Laden des Nutzers: " + userError.message
            );
            setLoading(false);
          }
          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        setUserId(user.id);

        const [
          profileResponse,
          diagnosticResponse,
          topicResponse,
          sessionResponse,
        ] = await Promise.all([
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
            .from("DiagnosticResult")
            .select("id, user_id, score, created_at")
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

          sessionId
            ? supabase
                .from("TrainingSchedule")
                .select(
                  "id, user_id, date, weekday_label, completed, completed_at, score_percent"
                )
                .eq("id", sessionId)
                .eq("user_id", user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (cancelled) return;

        if (profileResponse.error) {
          setErrorMessage(
            "Fehler beim Laden des Lernprofils: " +
              profileResponse.error.message
          );
          setLoading(false);
          return;
        }

        if (diagnosticResponse.error) {
          setErrorMessage(
            "Fehler beim Laden des Ausgangstests: " +
              diagnosticResponse.error.message
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

        if (sessionResponse?.error) {
          setErrorMessage(
            "Fehler beim Laden der Trainingseinheit: " +
              sessionResponse.error.message
          );
          setLoading(false);
          return;
        }

        const profile = profileResponse.data as LearningProfileRow | null;
        const diagnostic = diagnosticResponse.data as DiagnosticResultRow | null;
        const topics = (topicResponse.data ?? []) as TopicLevelRow[];
        const session = (sessionResponse?.data ?? null) as TrainingScheduleRow | null;

        if (!profile) {
          router.replace("/diagnose-start");
          return;
        }

        if (!diagnostic) {
          router.replace("/diagnose");
          return;
        }

        if (topics.length === 0) {
          router.replace("/dashboard");
          return;
        }

        setLearningProfile(profile);
        setDiagnosticResult(diagnostic);
        setTopicLevels(topics);
        setSelectedSession(session);

        let initialTopic: TopicLevelRow | null = null;

        if (focusTopic) {
          initialTopic =
            topics.find((topic) => topic.category === focusTopic) ?? null;
        }

        if (!initialTopic && session && !session.completed) {
          initialTopic =
            [...topics].sort((a, b) => {
              if (a.level !== b.level) return a.level - b.level;
              return a.accuracy - b.accuracy;
            })[0] ?? null;
        }

        if (!initialTopic) {
          initialTopic =
            [...topics].sort((a, b) => {
              if (a.level !== b.level) return a.level - b.level;
              return a.accuracy - b.accuracy;
            })[0] ?? null;
        }

        if (initialTopic) {
          setSelectedTopicId(initialTopic.id);
        }
      } catch (error) {
        console.error("LERNPFAD PAGE ERROR:", error);
        if (!cancelled) {
          setErrorMessage("Unerwarteter Fehler im Lernpfad.");
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
  }, [router, sessionId, focusTopic]);

  const selectedTopic = useMemo(() => {
    return topicLevels.find((topic) => topic.id === selectedTopicId) ?? null;
  }, [topicLevels, selectedTopicId]);

  const exercises = useMemo(() => {
    if (!selectedTopic) return [];
    return getExercisesForTopic(selectedTopic.category, selectedTopic.level);
  }, [selectedTopic]);

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const allAnswered = exercises.length > 0 && answeredCount === exercises.length;

  const resultData = useMemo(() => {
    const correct = exercises.filter(
      (exercise) => answers[exercise.id] === exercise.correctAnswer
    ).length;

    const total = exercises.length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { correct, total, percent };
  }, [answers, exercises]);

  const sortedTopics = useMemo(() => {
    return [...topicLevels].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return a.category.localeCompare(b.category);
    });
  }, [topicLevels]);

  const weakestTopic = useMemo(() => {
    if (topicLevels.length === 0) return null;

    return [...topicLevels].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.accuracy - b.accuracy;
    })[0] ?? null;
  }, [topicLevels]);

  const averageAccuracy = useMemo(() => {
    if (topicLevels.length === 0) return 0;
    const sum = topicLevels.reduce((acc, item) => acc + item.accuracy, 0);
    return sum / topicLevels.length;
  }, [topicLevels]);

  function selectAnswer(questionId: string, answer: string) {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }

  function handleTopicChange(topicId: string) {
    setSelectedTopicId(topicId);
    setAnswers({});
    setSubmitted(false);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleCheckAnswers() {
    setErrorMessage("");

    if (!selectedTopic) {
      setErrorMessage("Bitte wähle zuerst ein Thema aus.");
      return;
    }

    if (!allAnswered) {
      setErrorMessage("Bitte beantworte zuerst alle Aufgaben.");
      return;
    }

    setSubmitted(true);
  }

  async function handleSaveTraining() {
    if (!selectedTopic || !userId) return;

    setErrorMessage("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const newTotalAnswered =
        (selectedTopic.total_answered ?? 0) + resultData.total;
      const newTotalCorrect =
        (selectedTopic.total_correct ?? 0) + resultData.correct;
      const newAccuracy =
        newTotalAnswered > 0 ? newTotalCorrect / newTotalAnswered : 0;

      let nextLevel: 1 | 2 | 3 = selectedTopic.level;

      if (resultData.percent >= 80) {
        nextLevel = clampLevel(selectedTopic.level + 1);
      } else if (resultData.percent < 50) {
        nextLevel = clampLevel(selectedTopic.level - 1);
      }

      const [trainingInsertResponse, topicUpdateResponse, sessionUpdateResponse] =
        await Promise.all([
          supabase.from("TrainingResult").insert([
            {
              userId,
              focus: selectedTopic.category,
              title: `Training: ${selectedTopic.category}`,
              correctAnswers: resultData.correct,
              totalQuestions: resultData.total,
              createdAt: new Date().toISOString(),
            },
          ]),
          supabase
            .from("TopicLevel")
            .update({
              level: nextLevel,
              total_answered: newTotalAnswered,
              total_correct: newTotalCorrect,
              accuracy: newAccuracy,
              last_practiced_at: new Date().toISOString(),
            })
            .eq("id", selectedTopic.id),
          selectedSession && !selectedSession.completed
            ? supabase
                .from("TrainingSchedule")
                .update({
                  completed: true,
                  completed_at: new Date().toISOString(),
                  score_percent: resultData.percent,
                })
                .eq("id", selectedSession.id)
            : Promise.resolve({ error: null }),
        ]);

      if (trainingInsertResponse.error) {
        setErrorMessage(
          "Fehler beim Speichern des Trainings: " +
            trainingInsertResponse.error.message
        );
        setSaving(false);
        return;
      }

      if (topicUpdateResponse.error) {
        setErrorMessage(
          "Das Training wurde gespeichert, aber das Thema konnte nicht aktualisiert werden: " +
            topicUpdateResponse.error.message
        );
        setSaving(false);
        return;
      }

      if (sessionUpdateResponse?.error) {
        setErrorMessage(
          "Das Training wurde gespeichert, aber die Trainingseinheit konnte nicht abgeschlossen werden: " +
            sessionUpdateResponse.error.message
        );
        setSaving(false);
        return;
      }

      setSuccessMessage("Training erfolgreich gespeichert.");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (error) {
      console.error("SAVE TRAINING ERROR:", error);
      setErrorMessage("Unerwarteter Fehler beim Speichern des Trainings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-56 rounded-xl bg-gray-200" />
            <div className="h-44 rounded-[28px] bg-gray-200" />
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="h-[560px] rounded-[28px] bg-gray-200" />
              <div className="h-[560px] rounded-[28px] bg-gray-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 text-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-[32px] bg-black p-8 text-white shadow-xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-400">
                Lernpfad
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Jetzt trainierst du gezielt weiter
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-300">
                Statt planlos zu üben, arbeitest du hier an genau dem Thema,
                das dir aktuell am meisten bringt.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  Klasse {learningProfile?.school_class ?? "—"}
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  Ausgangstest {diagnosticResult?.score ?? "—"}%
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  {topicLevels.length} Themen
                </span>
                {selectedSession && (
                  <span className="rounded-full bg-emerald-400/15 px-4 py-2 text-sm text-emerald-300">
                    Trainingseinheit aktiv
                  </span>
                )}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Fokus
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {selectedTopic?.category ?? "Noch offen"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Aufgaben
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {exercises.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Fortschritt
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {answeredCount} / {exercises.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm text-gray-400">Dein nächster sinnvoller Schritt</p>

              <h2 className="mt-3 text-2xl font-bold">
                {selectedTopic?.category ?? "Thema wählen"}
              </h2>

              {selectedTopic ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getLevelBadgeClasses(
                        selectedTopic.level
                      )}`}
                    >
                      {getLevelText(selectedTopic.level)}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      {getLevelDescription(selectedTopic.level)}
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-gray-300">
                    {getRecommendationText(selectedTopic)}
                  </p>

                  <div className="mt-6 rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Bisherige Accuracy</span>
                      <span className="font-semibold text-white">
                        {formatPercentFromAccuracy(selectedTopic.accuracy)}
                      </span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: getAccuracyWidth(selectedTopic.accuracy) }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Richtig beantwortet
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {selectedTopic.total_correct} / {selectedTopic.total_answered}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Schwerpunkt
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {weakestTopic?.category === selectedTopic.category
                          ? "Aktuell wichtig"
                          : "Weiter festigen"}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-gray-300">
                  Wähle links ein Thema aus, damit du direkt passende Aufgaben
                  auf deinem aktuellen Niveau bekommst.
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Themen</p>
                <h2 className="mt-2 text-2xl font-bold">Wähle deinen Fokus</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Starte am besten mit dem Thema, das den größten Einfluss auf
                  deinen Fortschritt hat.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                Ø Accuracy {formatPercentFromAccuracy(averageAccuracy)}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {sortedTopics.map((topic) => {
                const isActive = topic.id === selectedTopicId;
                const isPriority = weakestTopic?.id === topic.id;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicChange(topic.id)}
                    className={`w-full rounded-3xl border p-5 text-left transition ${
                      isActive
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {topic.category}
                          </h3>

                          {isPriority && (
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                isActive
                                  ? "bg-white/10 text-white"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              Fokus
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-2 text-sm ${
                            isActive ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {getLevelDescription(topic.level)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-white/10 text-white"
                            : getLevelBadgeClasses(topic.level)
                        }`}
                      >
                        {getLevelText(topic.level)}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div
                        className={`mb-2 flex items-center justify-between text-xs ${
                          isActive ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        <span>Accuracy</span>
                        <span>{formatPercentFromAccuracy(topic.accuracy)}</span>
                      </div>

                      <div
                        className={`h-2.5 overflow-hidden rounded-full ${
                          isActive ? "bg-white/10" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full ${
                            isActive ? "bg-white" : "bg-black"
                          }`}
                          style={{ width: getAccuracyWidth(topic.accuracy) }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Aufgaben</p>
                <h2 className="mt-2 text-2xl font-bold">
                  {selectedTopic ? selectedTopic.category : "Bitte Thema wählen"}
                </h2>
                <p className="mt-3 max-w-2xl text-gray-600">
                  Bearbeite alle Aufgaben in Ruhe. Danach kannst du dein Ergebnis
                  prüfen und direkt speichern.
                </p>
              </div>

              {selectedTopic && (
                <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                  {answeredCount} von {exercises.length} beantwortet
                </div>
              )}
            </div>

            {!selectedTopic ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  Noch kein Thema ausgewählt
                </h3>
                <p className="mt-3 text-gray-600">
                  Wähle links ein Thema aus, damit dir passende Aufgaben auf
                  deinem aktuellen Niveau angezeigt werden.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {exercises.map((exercise, index) => {
                  const selectedAnswer = answers[exercise.id];
                  const isCorrect = selectedAnswer === exercise.correctAnswer;

                  return (
                    <div
                      key={exercise.id}
                      className="rounded-3xl border border-gray-200 bg-gray-50 p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-gray-500">
                          Aufgabe {index + 1}
                        </p>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                          {selectedAnswer ? "Beantwortet" : "Offen"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-gray-900">
                        {exercise.question}
                      </h3>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {exercise.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => selectAnswer(exercise.id, option)}
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

                      {submitted && selectedAnswer && (
                        <div
                          className={`mt-4 rounded-2xl p-4 text-sm ${
                            isCorrect
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <p className="font-medium">
                            {isCorrect ? "Richtig." : "Nicht ganz richtig."}
                          </p>

                          <p className="mt-2">
                            <span className="font-semibold">Erklärung:</span>{" "}
                            {exercise.explanation}
                          </p>

                          {!isCorrect && exercise.mistakeTip && (
                            <p className="mt-2">
                              <span className="font-semibold">
                                Typischer Fehler:
                              </span>{" "}
                              {exercise.mistakeTip}
                            </p>
                          )}

                          {exercise.rememberTip && (
                            <p className="mt-2">
                              <span className="font-semibold">Merke dir:</span>{" "}
                              {exercise.rememberTip}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {selectedTopic && (
          <section className="mt-8 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Training abschließen
                </p>
                <h2 className="mt-2 text-2xl font-bold">Wie lief dein Training?</h2>
                <p className="mt-3 text-gray-600">
                  Beantworte zuerst alle Aufgaben, prüfe dein Ergebnis und
                  speichere es danach direkt im Dashboard.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-gray-100 px-5 py-4 text-sm font-medium text-gray-700">
                  Thema: {selectedTopic.category}
                </div>
                <div className="rounded-2xl bg-gray-100 px-5 py-4 text-sm font-medium text-gray-700">
                  Level: {getLevelText(selectedTopic.level)}
                </div>
                <div className="rounded-2xl bg-gray-100 px-5 py-4 text-sm font-medium text-gray-700">
                  Fortschritt: {answeredCount} / {exercises.length}
                </div>
              </div>
            </div>
          </section>
        )}

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

        {submitted && selectedTopic && (
          <section className="mt-8 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Ergebnis</p>
                <h2 className="mt-2 text-3xl font-bold">
                  {getResultHeadline(resultData.percent)}
                </h2>
                <p className="mt-4 text-gray-600">
                  {resultData.correct} von {resultData.total} Aufgaben richtig.
                  Das entspricht {resultData.percent}%.
                </p>
                <p className="mt-3 max-w-2xl text-gray-600">
                  {getResultText(resultData.percent)}
                </p>
              </div>

              <div className="rounded-[24px] bg-black p-6 text-white shadow-sm">
                <p className="text-sm text-gray-400">Zusammenfassung</p>
                <p className="mt-3 text-4xl font-bold">{resultData.percent}%</p>
                <p className="mt-2 text-sm text-gray-300">
                  {resultData.correct} / {resultData.total} richtig
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${Math.max(6, resultData.percent)}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          {!submitted ? (
            <button
              type="button"
              onClick={handleCheckAnswers}
              className="rounded-2xl bg-black px-8 py-4 font-medium text-white transition hover:bg-gray-800"
            >
              Antworten prüfen
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveTraining}
              disabled={saving}
              className="rounded-2xl bg-black px-8 py-4 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Speichert..." : "Training speichern"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className="rounded-2xl border border-gray-300 bg-white px-8 py-4 font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Neu beginnen
          </button>

          <Link
            href="/dashboard"
            className="rounded-2xl border border-gray-300 bg-white px-8 py-4 font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}