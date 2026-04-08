"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DifficultyLevel } from "@/lib/training-engine";

type TopicOption = {
  label: string;
  difficulty: "leicht" | "mittel" | "schwer";
};

type TopicGroup = {
  id: string;
  label: string;
  options: TopicOption[];
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
  level: DifficultyLevel;
  created_at: string;
};

const CURRICULUM_BY_CLASS: Record<string, TopicGroup[]> = {
  "1. Klasse": [
    {
      id: "numbers",
      label: "Zahlen und Zahlenräume",
      options: [
        { label: "Zahlenraum 0-10", difficulty: "leicht" },
        { label: "Zahlenraum 0-20", difficulty: "leicht" },
        { label: "Zahlenraum 0-100", difficulty: "leicht" },
        { label: "Zahlenraum 0-1000", difficulty: "mittel" },
        { label: "Zahlen vergleichen", difficulty: "leicht" },
        { label: "Zahlen ordnen", difficulty: "leicht" },
      ],
    },
    {
      id: "addition",
      label: "Addition",
      options: [
        { label: "Einfache Addition", difficulty: "leicht" },
        { label: "Addition im Zahlenraum 0-10", difficulty: "leicht" },
        { label: "Addition im Zahlenraum 0-20", difficulty: "leicht" },
        { label: "Addition im Zahlenraum 0-100", difficulty: "mittel" },
        { label: "Addition mit Zehnerübergang", difficulty: "mittel" },
        { label: "Kopfrechnen Addition", difficulty: "mittel" },
      ],
    },
    {
      id: "subtraction",
      label: "Subtraktion",
      options: [
        { label: "Einfache Subtraktion", difficulty: "leicht" },
        { label: "Subtraktion im Zahlenraum 0-10", difficulty: "leicht" },
        { label: "Subtraktion im Zahlenraum 0-20", difficulty: "leicht" },
        { label: "Subtraktion im Zahlenraum 0-100", difficulty: "mittel" },
        { label: "Subtraktion mit Zehnerübergang", difficulty: "mittel" },
        { label: "Kopfrechnen Subtraktion", difficulty: "mittel" },
      ],
    },
    {
      id: "wordProblems",
      label: "Sachaufgaben / Textaufgaben",
      options: [
        { label: "Einfache Textaufgaben", difficulty: "leicht" },
        { label: "Sachaufgaben zur Addition", difficulty: "leicht" },
        { label: "Sachaufgaben zur Subtraktion", difficulty: "leicht" },
      ],
    },
    {
      id: "measures",
      label: "Größen und Maße",
      options: [
        { label: "Geld", difficulty: "leicht" },
        { label: "Längen", difficulty: "leicht" },
        { label: "Uhrzeit", difficulty: "mittel" },
        { label: "Maßeinheiten", difficulty: "mittel" },
      ],
    },
    {
      id: "geometry",
      label: "Geometrie",
      options: [
        { label: "Formen erkennen", difficulty: "leicht" },
        { label: "Körper erkennen", difficulty: "leicht" },
        { label: "Strecken und Längen", difficulty: "mittel" },
        { label: "Rechtecke und Quadrate", difficulty: "mittel" },
        { label: "Orientierung im Raum", difficulty: "leicht" },
      ],
    },
  ],

  "2. Klasse": [
    {
      id: "numbers",
      label: "Zahlen und Zahlenräume",
      options: [
        { label: "Zahlenraum 0-100", difficulty: "leicht" },
        { label: "Zahlenraum 0-1000", difficulty: "mittel" },
        { label: "Zahlen vergleichen", difficulty: "leicht" },
        { label: "Zahlen ordnen", difficulty: "leicht" },
      ],
    },
    {
      id: "addition",
      label: "Addition",
      options: [
        { label: "Addition im Zahlenraum 0-100", difficulty: "leicht" },
        { label: "Addition mit Zehnerübergang", difficulty: "mittel" },
        { label: "Kopfrechnen Addition", difficulty: "mittel" },
      ],
    },
    {
      id: "subtraction",
      label: "Subtraktion",
      options: [
        { label: "Subtraktion im Zahlenraum 0-100", difficulty: "leicht" },
        { label: "Subtraktion mit Zehnerübergang", difficulty: "mittel" },
        { label: "Kopfrechnen Subtraktion", difficulty: "mittel" },
      ],
    },
    {
      id: "multiplication",
      label: "Multiplikation",
      options: [
        { label: "Verdoppeln", difficulty: "leicht" },
        { label: "Einmaleins Grundlagen", difficulty: "leicht" },
        { label: "Kleine Malreihen", difficulty: "mittel" },
        { label: "Gemischtes Einmaleins", difficulty: "mittel" },
        { label: "Multiplikation im Zahlenraum 0-100", difficulty: "mittel" },
      ],
    },
    {
      id: "division",
      label: "Division",
      options: [
        { label: "Halbieren", difficulty: "leicht" },
        { label: "Teilen ohne Rest", difficulty: "mittel" },
        { label: "Division als Umkehraufgabe", difficulty: "mittel" },
        { label: "Einfache Divisionsaufgaben", difficulty: "mittel" },
      ],
    },
    {
      id: "wordProblems",
      label: "Sachaufgaben / Textaufgaben",
      options: [
        { label: "Sachaufgaben zur Addition", difficulty: "leicht" },
        { label: "Sachaufgaben zur Subtraktion", difficulty: "leicht" },
        { label: "Sachaufgaben zur Multiplikation", difficulty: "mittel" },
        { label: "Sachaufgaben zur Division", difficulty: "mittel" },
      ],
    },
    {
      id: "measures",
      label: "Größen und Maße",
      options: [
        { label: "Geld", difficulty: "leicht" },
        { label: "Längen", difficulty: "leicht" },
        { label: "Gewichte", difficulty: "mittel" },
        { label: "Uhrzeit", difficulty: "mittel" },
        { label: "Zeitspannen", difficulty: "mittel" },
        { label: "Maßeinheiten", difficulty: "mittel" },
      ],
    },
    {
      id: "geometry",
      label: "Geometrie",
      options: [
        { label: "Formen erkennen", difficulty: "leicht" },
        { label: "Körper erkennen", difficulty: "leicht" },
        { label: "Strecken und Längen", difficulty: "mittel" },
        { label: "Rechte Winkel", difficulty: "mittel" },
        { label: "Rechtecke und Quadrate", difficulty: "mittel" },
        { label: "Symmetrie", difficulty: "mittel" },
        { label: "Orientierung im Raum", difficulty: "leicht" },
      ],
    },
  ],

  "3. Klasse": [
    {
      id: "numbers",
      label: "Zahlen und Zahlenräume",
      options: [
        { label: "Zahlenraum 0-1000", difficulty: "leicht" },
        { label: "Zahlen vergleichen", difficulty: "leicht" },
        { label: "Zahlen ordnen", difficulty: "leicht" },
      ],
    },
    {
      id: "addition",
      label: "Addition",
      options: [
        { label: "Addition im Zahlenraum 0-100", difficulty: "leicht" },
        { label: "Addition mit Zehnerübergang", difficulty: "mittel" },
        { label: "Kopfrechnen Addition", difficulty: "mittel" },
      ],
    },
    {
      id: "subtraction",
      label: "Subtraktion",
      options: [
        { label: "Subtraktion im Zahlenraum 0-100", difficulty: "leicht" },
        { label: "Subtraktion mit Zehnerübergang", difficulty: "mittel" },
        { label: "Kopfrechnen Subtraktion", difficulty: "mittel" },
      ],
    },
    {
      id: "multiplication",
      label: "Multiplikation",
      options: [
        { label: "Einmaleins Grundlagen", difficulty: "leicht" },
        { label: "Kleine Malreihen", difficulty: "mittel" },
        { label: "Gemischtes Einmaleins", difficulty: "mittel" },
        { label: "Multiplikation im Zahlenraum 0-100", difficulty: "mittel" },
      ],
    },
    {
      id: "division",
      label: "Division",
      options: [
        { label: "Teilen ohne Rest", difficulty: "mittel" },
        { label: "Teilen mit Rest", difficulty: "mittel" },
        { label: "Division als Umkehraufgabe", difficulty: "mittel" },
        { label: "Einfache Divisionsaufgaben", difficulty: "mittel" },
      ],
    },
    {
      id: "wordProblems",
      label: "Sachaufgaben / Textaufgaben",
      options: [
        { label: "Sachaufgaben zur Multiplikation", difficulty: "mittel" },
        { label: "Sachaufgaben zur Division", difficulty: "mittel" },
        { label: "Mehrschrittige Textaufgaben", difficulty: "schwer" },
      ],
    },
    {
      id: "measures",
      label: "Größen und Maße",
      options: [
        { label: "Geld", difficulty: "leicht" },
        { label: "Längen", difficulty: "leicht" },
        { label: "Gewichte", difficulty: "mittel" },
        { label: "Uhrzeit", difficulty: "mittel" },
        { label: "Zeitspannen", difficulty: "mittel" },
        { label: "Maßeinheiten", difficulty: "mittel" },
      ],
    },
    {
      id: "geometry",
      label: "Geometrie",
      options: [
        { label: "Strecken und Längen", difficulty: "mittel" },
        { label: "Rechte Winkel", difficulty: "mittel" },
        { label: "Rechtecke und Quadrate", difficulty: "mittel" },
        { label: "Symmetrie", difficulty: "mittel" },
        { label: "Orientierung im Raum", difficulty: "leicht" },
      ],
    },
  ],

  "4. Klasse": [
    {
      id: "numbers",
      label: "Zahlen und Zahlenräume",
      options: [
        { label: "Zahlenraum 0-1000", difficulty: "leicht" },
        { label: "Zahlen vergleichen", difficulty: "leicht" },
        { label: "Zahlen ordnen", difficulty: "leicht" },
      ],
    },
    {
      id: "multiplication",
      label: "Multiplikation",
      options: [
        { label: "Gemischtes Einmaleins", difficulty: "mittel" },
        { label: "Multiplikation im Zahlenraum 0-100", difficulty: "mittel" },
      ],
    },
    {
      id: "division",
      label: "Division",
      options: [
        { label: "Teilen ohne Rest", difficulty: "mittel" },
        { label: "Teilen mit Rest", difficulty: "mittel" },
        { label: "Division als Umkehraufgabe", difficulty: "mittel" },
      ],
    },
    {
      id: "wordProblems",
      label: "Sachaufgaben / Textaufgaben",
      options: [
        { label: "Sachaufgaben zur Addition", difficulty: "mittel" },
        { label: "Sachaufgaben zur Subtraktion", difficulty: "mittel" },
        { label: "Sachaufgaben zur Multiplikation", difficulty: "mittel" },
        { label: "Sachaufgaben zur Division", difficulty: "mittel" },
        { label: "Mehrschrittige Textaufgaben", difficulty: "schwer" },
      ],
    },
    {
      id: "measures",
      label: "Größen und Maße",
      options: [
        { label: "Geld", difficulty: "leicht" },
        { label: "Längen", difficulty: "leicht" },
        { label: "Gewichte", difficulty: "mittel" },
        { label: "Uhrzeit", difficulty: "mittel" },
        { label: "Zeitspannen", difficulty: "mittel" },
        { label: "Maßeinheiten", difficulty: "mittel" },
      ],
    },
    {
      id: "geometry",
      label: "Geometrie",
      options: [
        { label: "Formen erkennen", difficulty: "leicht" },
        { label: "Körper erkennen", difficulty: "leicht" },
        { label: "Strecken und Längen", difficulty: "mittel" },
        { label: "Rechte Winkel", difficulty: "mittel" },
        { label: "Rechtecke und Quadrate", difficulty: "mittel" },
        { label: "Symmetrie", difficulty: "mittel" },
        { label: "Orientierung im Raum", difficulty: "leicht" },
      ],
    },
  ],

  "5. Klasse": [
    {
      id: "numbersMeasures",
      label: "Zahlen und Maße",
      options: [
        { label: "Natürliche Zahlen sicher anwenden", difficulty: "leicht" },
        { label: "Dezimalzahlen darstellen und vergleichen", difficulty: "leicht" },
        { label: "Bruchzahlen verstehen und vergleichen", difficulty: "mittel" },
        { label: "Brüche erweitern und kürzen", difficulty: "mittel" },
        { label: "Brüche und Dezimalzahlen umwandeln", difficulty: "mittel" },
        { label: "Grundrechnungsarten mit natürlichen Zahlen", difficulty: "leicht" },
        { label: "Rechnen mit Dezimalzahlen", difficulty: "mittel" },
        { label: "Überschlagsrechnungen und Runden", difficulty: "leicht" },
        { label: "Größen und Maße umrechnen", difficulty: "mittel" },
      ],
    },
    {
      id: "variablesFunctions",
      label: "Variablen und Funktionen",
      options: [
        { label: "Einfache Terme aufstellen", difficulty: "leicht" },
        { label: "Einfache Gleichungen lösen", difficulty: "mittel" },
        { label: "Formeln aus Sachsituationen lesen", difficulty: "mittel" },
      ],
    },
    {
      id: "geometry",
      label: "Figuren und Körper",
      options: [
        { label: "Punkt, Strecke, Strahl, Gerade, Winkel", difficulty: "leicht" },
        { label: "Rechtecke konstruieren", difficulty: "mittel" },
        { label: "Umfang von Rechtecken", difficulty: "leicht" },
        { label: "Flächeninhalt von Rechtecken", difficulty: "mittel" },
        { label: "Quader beschreiben", difficulty: "leicht" },
        { label: "Oberfläche und Volumen von Quadern", difficulty: "mittel" },
      ],
    },
    {
      id: "dataChance",
      label: "Daten und Zufall",
      options: [
        { label: "Daten sammeln und ordnen", difficulty: "leicht" },
        { label: "Diagramme lesen und erstellen", difficulty: "leicht" },
        { label: "Einfache statistische Kennzahlen", difficulty: "mittel" },
      ],
    },
  ],

  "6. Klasse": [
    {
      id: "numbersMeasures",
      label: "Zahlen und Maße",
      options: [
        { label: "Teiler, Vielfache und Teilbarkeit", difficulty: "leicht" },
        { label: "Ganze Zahlen auf der Zahlengeraden", difficulty: "mittel" },
        { label: "Bruchzahlen rechnen", difficulty: "mittel" },
        { label: "Dezimalzahlen und Brüche sicher anwenden", difficulty: "mittel" },
        { label: "Proportionalitäten erkennen", difficulty: "mittel" },
        { label: "Prozentrechnen Grundlagen", difficulty: "schwer" },
      ],
    },
    {
      id: "variablesFunctions",
      label: "Variablen und Funktionen",
      options: [
        { label: "Terme mit Brüchen aufstellen", difficulty: "mittel" },
        { label: "Lineare Gleichungen lösen", difficulty: "mittel" },
        { label: "Formeln umformen", difficulty: "schwer" },
      ],
    },
    {
      id: "geometry",
      label: "Figuren und Körper",
      options: [
        { label: "Koordinatensystem anwenden", difficulty: "mittel" },
        { label: "Achsensymmetrie erkennen und zeichnen", difficulty: "mittel" },
        { label: "Kongruente Figuren", difficulty: "mittel" },
        { label: "Dreiecke untersuchen", difficulty: "mittel" },
        { label: "Besondere Vierecke", difficulty: "mittel" },
        { label: "Flächeninhalt von Dreiecken und Vierecken", difficulty: "schwer" },
      ],
    },
    {
      id: "dataChance",
      label: "Daten und Zufall",
      options: [
        { label: "Relative Häufigkeit", difficulty: "mittel" },
        { label: "Grafische Darstellungen interpretieren", difficulty: "mittel" },
      ],
    },
  ],

  "7. Klasse": [
    {
      id: "numbersMeasures",
      label: "Zahlen und Maße",
      options: [
        { label: "Rationale Zahlen darstellen und ordnen", difficulty: "mittel" },
        { label: "Rechnen mit rationalen Zahlen", difficulty: "schwer" },
        { label: "Verhältnisse und Proportionen", difficulty: "mittel" },
      ],
    },
    {
      id: "variablesFunctions",
      label: "Variablen und Funktionen",
      options: [
        { label: "Terme umformen", difficulty: "mittel" },
        { label: "Potenzen mit positiven Exponenten", difficulty: "mittel" },
        { label: "Gleichungen durch Äquivalenzumformungen lösen", difficulty: "schwer" },
        { label: "Wachstumsprozesse modellieren", difficulty: "schwer" },
        { label: "Abnahmeprozesse modellieren", difficulty: "schwer" },
      ],
    },
    {
      id: "geometry",
      label: "Figuren und Körper",
      options: [
        { label: "Vielecke und Flächeninhalte", difficulty: "mittel" },
        { label: "Ähnlichkeit und Maßstab", difficulty: "schwer" },
        { label: "Zentrische Vergrößerung und Verkleinerung", difficulty: "schwer" },
        { label: "Prismen", difficulty: "mittel" },
        { label: "Pyramiden", difficulty: "schwer" },
        { label: "Oberfläche und Volumen", difficulty: "schwer" },
      ],
    },
    {
      id: "dataChance",
      label: "Daten und Zufall",
      options: [
        { label: "Statistische Darstellungen erstellen", difficulty: "mittel" },
        { label: "Manipulationen in Diagrammen erkennen", difficulty: "schwer" },
        { label: "Einfache Wahrscheinlichkeiten", difficulty: "mittel" },
      ],
    },
  ],

  "8. Klasse": [
    {
      id: "numbersMeasures",
      label: "Zahlen und Maße",
      options: [
        { label: "Reelle Zahlen", difficulty: "schwer" },
        { label: "Wurzeln anwenden", difficulty: "schwer" },
        { label: "Näherungswerte und Runden", difficulty: "mittel" },
      ],
    },
    {
      id: "variablesFunctions",
      label: "Variablen und Funktionen",
      options: [
        { label: "Terme und Formeln in komplexeren Situationen", difficulty: "schwer" },
        { label: "Gleichungen mit einer Variablen", difficulty: "schwer" },
        { label: "Darstellungsformen von Funktionen", difficulty: "schwer" },
        { label: "Lineare Funktionen", difficulty: "schwer" },
        { label: "Lineare Gleichungssysteme", difficulty: "schwer" },
      ],
    },
    {
      id: "geometry",
      label: "Figuren und Körper",
      options: [
        { label: "Satz des Pythagoras", difficulty: "schwer" },
        { label: "Kreise und Kreisteile", difficulty: "schwer" },
        { label: "Drehzylinder", difficulty: "schwer" },
        { label: "Drehkegel", difficulty: "schwer" },
        { label: "Oberfläche und Volumen zusammengesetzter Körper", difficulty: "schwer" },
      ],
    },
    {
      id: "dataChance",
      label: "Daten und Zufall",
      options: [
        { label: "Kreuztabellen", difficulty: "mittel" },
        { label: "Einstufige Zufallsexperimente", difficulty: "mittel" },
        { label: "Zweistufige Zufallsexperimente", difficulty: "schwer" },
        { label: "Wahrscheinlichkeiten interpretieren", difficulty: "schwer" },
      ],
    },
  ],
};

const CLASS_OPTIONS = [
  "1. Klasse",
  "2. Klasse",
  "3. Klasse",
  "4. Klasse",
  "5. Klasse",
  "6. Klasse",
  "7. Klasse",
  "8. Klasse",
];

function difficultyBadgeClass(difficulty: TopicOption["difficulty"]) {
  if (difficulty === "leicht") {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (difficulty === "mittel") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  return "bg-red-100 text-red-700 border-red-200";
}

function getSchoolStageLabel(schoolClass: string) {
  const lowerSchool = ["1. Klasse", "2. Klasse", "3. Klasse", "4. Klasse"];
  return lowerSchool.includes(schoolClass) ? "Volksschule" : "AHS-Unterstufe";
}

function getBaseLevelFromClass(schoolClass: string): DifficultyLevel {
  if (schoolClass === "1. Klasse" || schoolClass === "2. Klasse") return 1;
  if (schoolClass === "3. Klasse" || schoolClass === "4. Klasse") return 2;
  if (schoolClass === "5. Klasse" || schoolClass === "6. Klasse") return 2;
  return 3;
}

function clearLegacyFlowStorage() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("selectedClass");
  localStorage.removeItem("selectedAge");
  localStorage.removeItem("selectedTopics");
  localStorage.removeItem("selectedSchoolStage");
  localStorage.removeItem("diagnoseTopicConfidence");
  localStorage.removeItem("trainingFrequency");
  localStorage.removeItem("setupCompleted");
  localStorage.removeItem("placementSummary");
  localStorage.removeItem("topicLevels");
  localStorage.removeItem("currentPlacementTasks");
  localStorage.removeItem("currentTrainingTasks");
}

export default function DiagnoseStartPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schoolClass, setSchoolClass] = useState("");
  const [age, setAge] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [trainingFrequency, setTrainingFrequency] = useState(3);
  const [errorMessage, setErrorMessage] = useState("");

  const topicGroups = useMemo(() => {
    return schoolClass ? CURRICULUM_BY_CLASS[schoolClass] ?? [] : [];
  }, [schoolClass]);

  const totalAvailableTopics = useMemo(() => {
    return topicGroups.reduce((sum, group) => sum + group.options.length, 0);
  }, [topicGroups]);

  const completionCount = useMemo(() => {
    let count = 0;
    if (age) count += 1;
    if (schoolClass) count += 1;
    if (selectedTopics.length > 0) count += 1;
    if (trainingFrequency) count += 1;
    return count;
  }, [age, schoolClass, selectedTopics.length, trainingFrequency]);

  const progressPercent = useMemo(() => {
    return Math.round((completionCount / 4) * 100);
  }, [completionCount]);

  const selectedTopicPreview = useMemo(() => {
    return selectedTopics.slice(0, 4);
  }, [selectedTopics]);

  const selectedTopicOverflow = useMemo(() => {
    return Math.max(selectedTopics.length - 4, 0);
  }, [selectedTopics.length]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setLoading(true);
      setErrorMessage("");

      try {
        clearLegacyFlowStorage();

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
          if (!cancelled) {
            router.replace("/login");
          }
          return;
        }

        const [profileResponse, topicLevelsResponse, diagnosticResponse] = await Promise.all([
          supabase
            .from("LearningProfile")
            .select("id, user_id, school_class, age, training_frequency, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from("TopicLevel")
            .select("id, user_id, category, level, created_at")
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

        if (topicLevelsResponse.error) {
          setErrorMessage(
            "Fehler beim Laden der Themenauswahl: " + topicLevelsResponse.error.message
          );
          setLoading(false);
          return;
        }

        if (diagnosticResponse.error) {
          setErrorMessage(
            "Fehler beim Laden des Diagnose-Status: " + diagnosticResponse.error.message
          );
          setLoading(false);
          return;
        }

        const profile = profileResponse.data as LearningProfileRow | null;
        const topicRows = (topicLevelsResponse.data ?? []) as TopicLevelRow[];
        const diagnosticResult = diagnosticResponse.data;

        if (diagnosticResult) {
          router.replace("/dashboard");
          return;
        }

        if (profile) {
          setSchoolClass(profile.school_class ?? "");
          setAge(profile.age ? String(profile.age) : "");
          setTrainingFrequency(profile.training_frequency ?? 3);
        }

        if (topicRows.length > 0) {
          setSelectedTopics(topicRows.map((item) => item.category));
        }
      } catch (error) {
        console.error("Diagnose start load error:", error);
        if (!cancelled) {
          setErrorMessage("Unerwarteter Fehler beim Laden der Diagnose.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((item) => item !== topic)
        : [...prev, topic]
    );
  }

  function handleClassChange(value: string) {
    setSchoolClass(value);
    setSelectedTopics([]);
    setErrorMessage("");
  }

  function selectAllTopicsInGroup(group: TopicGroup) {
    const labels = group.options.map((topic) => topic.label);

    setSelectedTopics((prev) => {
      const next = new Set(prev);
      labels.forEach((label) => next.add(label));
      return Array.from(next);
    });
  }

  function clearTopicsInGroup(group: TopicGroup) {
    const labels = new Set(group.options.map((topic) => topic.label));
    setSelectedTopics((prev) => prev.filter((topic) => !labels.has(topic)));
  }

  async function handleContinue() {
    setErrorMessage("");

    if (!age) {
      setErrorMessage("Bitte gib zuerst dein Alter ein.");
      return;
    }

    if (!schoolClass) {
      setErrorMessage("Bitte wähle danach deine Klasse aus.");
      return;
    }

    if (selectedTopics.length === 0) {
      setErrorMessage("Bitte wähle mindestens ein Thema aus.");
      return;
    }

    const parsedAge = Number(age);

    if (!Number.isFinite(parsedAge) || parsedAge < 5 || parsedAge > 15) {
      setErrorMessage("Bitte gib ein gültiges Alter zwischen 5 und 15 ein.");
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

      clearLegacyFlowStorage();

      const { error: profileDeleteError } = await supabase
        .from("LearningProfile")
        .delete()
        .eq("user_id", user.id);

      if (profileDeleteError) {
        setErrorMessage(
          "Fehler beim Zurücksetzen des Lernprofils: " + profileDeleteError.message
        );
        setSaving(false);
        return;
      }

      const { error: profileInsertError } = await supabase
        .from("LearningProfile")
        .insert([
          {
            user_id: user.id,
            school_class: schoolClass,
            age: parsedAge,
            training_frequency: trainingFrequency,
          },
        ]);

      if (profileInsertError) {
        setErrorMessage(
          "Fehler beim Speichern des Lernprofils: " + profileInsertError.message
        );
        setSaving(false);
        return;
      }

      const { error: topicDeleteError } = await supabase
        .from("TopicLevel")
        .delete()
        .eq("user_id", user.id);

      if (topicDeleteError) {
        setErrorMessage(
          "Fehler beim Zurücksetzen der Themenauswahl: " + topicDeleteError.message
        );
        setSaving(false);
        return;
      }

      const baseLevel = getBaseLevelFromClass(schoolClass);

      const { error: topicInsertError } = await supabase.from("TopicLevel").insert(
        selectedTopics.map((topic) => ({
          user_id: user.id,
          category: topic,
          level: baseLevel,
        }))
      );

      if (topicInsertError) {
        setErrorMessage(
          "Fehler beim Speichern der Themenauswahl: " + topicInsertError.message
        );
        setSaving(false);
        return;
      }

      router.push("/diagnose");
    } catch (error) {
      console.error("Diagnose start save error:", error);
      setErrorMessage("Unerwarteter Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-52 rounded-xl bg-gray-200" />
            <div className="h-48 rounded-[28px] bg-gray-200" />
            <div className="h-64 rounded-[28px] bg-gray-200" />
            <div className="h-64 rounded-[28px] bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 text-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-[32px] bg-black p-8 text-white shadow-xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-400">
                Diagnose-Start
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Richte deinen Mathe-Start sinnvoll ein
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-300">
                Wähle Alter, Klasse und passende Themen. Danach startet deine
                Diagnose mit einem Profil, das wirklich zu deinem aktuellen
                Lernstand passt.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  1. Profil festlegen
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  2. Themen auswählen
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  3. Diagnose starten
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Passend
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    Themen nach Schulstufe
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Gezielt
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    Keine zufällige Diagnose
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Klar
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    Sauberer Lernstart
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Dein Fortschritt</p>
                  <h2 className="mt-2 text-2xl font-bold">
                    {completionCount} von 4 Schritten fertig
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Startklar
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${Math.max(8, progressPercent)}%` }}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Alter</p>
                  <p className="mt-1 text-xl font-bold">{age || "—"}</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Klasse</p>
                  <p className="mt-1 text-xl font-bold">{schoolClass || "—"}</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Themen gewählt</p>
                  <p className="mt-1 text-xl font-bold">{selectedTopics.length}</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-gray-400">Trainings pro Woche</p>
                  <p className="mt-1 text-xl font-bold">{trainingFrequency}x</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Gewählte Themen
                </p>

                {selectedTopics.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-300">
                    Noch keine Themen ausgewählt.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTopicPreview.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                      >
                        {topic}
                      </span>
                    ))}
                    {selectedTopicOverflow > 0 && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                        +{selectedTopicOverflow} weitere
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Schritt 1</p>
                  <h2 className="mt-2 text-2xl font-bold">Alter</h2>
                  <p className="mt-3 text-gray-600">
                    Gib dein Alter ein, damit dein Profil besser eingeordnet
                    werden kann.
                  </p>
                </div>

                <div className="lg:col-span-2">
                  <div className="max-w-xs">
                    <input
                      type="number"
                      min="5"
                      max="15"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="z. B. 11"
                      className="w-full rounded-2xl border border-gray-300 px-4 py-4 text-lg outline-none transition focus:border-black"
                    />
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    Empfohlen: Alter zwischen 5 und 15 Jahren
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Schritt 2</p>
                  <h2 className="mt-2 text-2xl font-bold">Klasse auswählen</h2>
                  <p className="mt-3 text-gray-600">
                    Danach zeigen wir dir nur Themen, die zu deiner Schulstufe
                    passen.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {CLASS_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleClassChange(value)}
                      className={`rounded-2xl border px-5 py-3 transition ${
                        schoolClass === value
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-black hover:bg-gray-50"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                {schoolClass && (
                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                    Gewählte Schulstufe:{" "}
                    <span className="font-semibold">
                      {getSchoolStageLabel(schoolClass)}
                    </span>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Schritt 4</p>
                  <h2 className="mt-2 text-2xl font-bold">Trainingsfrequenz</h2>
                  <p className="mt-3 text-gray-600">
                    Wie oft möchtest du pro Woche trainieren?
                  </p>
                </div>

                <div className="lg:col-span-2">
                  <div className="flex flex-wrap gap-3">
                    {[2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTrainingFrequency(value)}
                        className={`rounded-2xl border px-5 py-3 transition ${
                          trainingFrequency === value
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-black hover:bg-gray-50"
                        }`}
                      >
                        {value}x pro Woche
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                    {trainingFrequency <= 2 &&
                      "Gut für einen entspannten Einstieg."}
                    {trainingFrequency === 3 &&
                      "Sehr guter Standard für regelmäßigen Fortschritt."}
                    {trainingFrequency === 4 &&
                      "Starkes Tempo mit viel Wiederholung."}
                    {trainingFrequency >= 5 &&
                      "Sehr ambitioniert – gut, wenn du konsequent dranbleibst."}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {schoolClass ? (
              <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Schritt 3</p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Themenbereiche auswählen
                    </h2>
                    <p className="mt-3 text-gray-600">
                      Wähle die Themen aus, die in deiner Diagnose vorkommen
                      sollen.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                    {selectedTopics.length} von {totalAvailableTopics} Themen gewählt
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                  Tipp: Wähle lieber die Themen, bei denen du wirklich üben
                  möchtest, statt einfach alles anzuklicken.
                </div>

                <div className="mt-8 space-y-8">
                  {topicGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-3xl border border-gray-200 bg-gray-50 p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {group.label}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            Wähle einzelne Themen oder markiere direkt den ganzen
                            Bereich.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => selectAllTopicsInGroup(group)}
                            className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
                          >
                            Alle wählen
                          </button>

                          <button
                            type="button"
                            onClick={() => clearTopicsInGroup(group)}
                            className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
                          >
                            Bereich leeren
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {group.options.map((topic) => {
                          const isSelected = selectedTopics.includes(topic.label);

                          return (
                            <button
                              key={topic.label}
                              type="button"
                              onClick={() => toggleTopic(topic.label)}
                              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                isSelected
                                  ? "border-black bg-black text-white"
                                  : "border-gray-300 bg-white text-black hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{topic.label}</span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-xs ${
                                    isSelected
                                      ? "border-white/30 bg-white/10 text-white"
                                      : difficultyBadgeClass(topic.difficulty)
                                  }`}
                                >
                                  {topic.difficulty}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="rounded-[28px] border border-dashed border-gray-300 bg-white p-8 shadow-sm">
                <p className="text-sm font-medium text-gray-500">Schritt 3</p>
                <h2 className="mt-2 text-2xl font-bold">
                  Themen erscheinen nach der Klassenauswahl
                </h2>
                <p className="mt-4 max-w-2xl text-gray-600">
                  Wähle zuerst deine Klasse. Danach zeigen wir dir passende
                  Themenbereiche für deine Schulstufe.
                </p>
              </section>
            )}

            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <p className="text-sm font-medium text-gray-500">Warum dieser Schritt wichtig ist</p>
              <h2 className="mt-2 text-2xl font-bold">
                Die Diagnose wird dadurch deutlich sinnvoller
              </h2>
              <p className="mt-4 text-gray-600">
                Wenn Alter, Klasse und Themen sauber gewählt sind, bekommst du
                später keine beliebigen Aufgaben, sondern einen Lernpfad, der
                wirklich zu deinem Stand passt.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Passender Einstieg</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Keine Aufgaben, die zu leicht oder zu schwer sind.
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Mehr Fokus</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Du übst genau die Bereiche, die für dich relevant sind.
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Besserer Lernpfad</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Die nächsten Schritte werden klarer und hilfreicher.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className="rounded-2xl bg-black px-8 py-4 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Speichert..." : "Weiter zur Diagnose"}
          </button>

          <Link
            href="/"
            className="rounded-2xl border border-gray-300 bg-white px-8 py-4 font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}