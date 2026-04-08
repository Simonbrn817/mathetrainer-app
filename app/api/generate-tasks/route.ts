import { NextResponse } from "next/server";
import { DifficultyLevel, GeneratedTask, generateLocalTasks } from "@/lib/training-engine";

type GenerateTasksRequest = {
  topic?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  count?: number;
  prompt?: string;
};

type OllamaResponse = {
  response?: string;
};

function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return value === 1 || value === 2 || value === 3;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getSafeTopic(input: GenerateTasksRequest) {
  const rawTopic =
    typeof input.topic === "string" && input.topic.trim()
      ? input.topic.trim()
      : typeof input.category === "string" && input.category.trim()
      ? input.category.trim()
      : "Einfache Addition";

  return rawTopic;
}

function getSafeDifficulty(value: unknown): DifficultyLevel {
  return isDifficultyLevel(value) ? value : 2;
}

function getSafeCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 5;
  return Math.max(1, Math.min(12, Math.floor(value)));
}

function buildSystemPrompt() {
  return `
Du bist ein Generator für Mathematikaufgaben für Volksschule und AHS-Unterstufe.

Antworte ausschließlich als JSON.
Kein Markdown.
Kein Fließtext.
Keine Erklärungen außerhalb des JSON.

Erwarte ein JSON-Array mit Objekten in genau diesem Format:
[
  {
    "question": "Frage",
    "correctAnswer": "Antwort",
    "explanation": "Kurze Erklärung",
    "topic": "Thema",
    "category": "Kategorie",
    "difficulty": 1
  }
]

Pflichtregeln:
- Erstelle fachlich korrekte Mathematikaufgaben.
- Bleibe exakt beim gewünschten Thema.
- Keine generischen Additionsaufgaben, wenn das Thema spezieller ist.
- Kurze, klare, verständliche Formulierungen.
- Jede Aufgabe braucht eine eindeutige Lösung.
- Keine doppelten Aufgaben.
- "difficulty" muss 1, 2 oder 3 sein.
- "correctAnswer" muss kurz und direkt sein.
- "explanation" muss kurz, korrekt und schülergerecht sein.
`.trim();
}
function getTopicPromptRules(topic: string): string {
  const normalizedTopic = topic.trim().toLowerCase();

  if (
    normalizedTopic.includes("bruch") ||
    normalizedTopic.includes("dezimal")
  ) {
    return `
Zusatzregeln für Brüche und Dezimalzahlen:
- Verwende echte Bruch- und Dezimalaufgaben, keine allgemeinen Plusaufgaben.
- Typische Aufgaben: vergleichen, erweitern, kürzen, umwandeln, gleichnamig rechnen, Dezimalzahlen berechnen.
- Achte auf fachlich korrekte Schreibweisen wie 3/4 oder 0,75.
- Die Lösungen müssen eindeutig und mathematisch korrekt sein.
`.trim();
  }

  if (
    normalizedTopic.includes("prozent") ||
    normalizedTopic.includes("proportion") ||
    normalizedTopic.includes("verhältnis")
  ) {
    return `
Zusatzregeln für Prozent und Proportionen:
- Erstelle echte Prozent- oder Verhältnisaufgaben.
- Typische Aufgaben: Prozentsatz berechnen, Grundwert-Aufgaben, proportionale Zuordnungen, Preis- und Mengenbeispiele.
- Keine allgemeinen Rechenaufgaben ohne Prozent- oder Verhältnisbezug.
- Verwende lebensnahe Kontexte wie Preise, Mengen, Hefte, Strecken oder Lebensmittel.
`.trim();
  }

  if (
    normalizedTopic.includes("gleichung") ||
    normalizedTopic.includes("term") ||
    normalizedTopic.includes("funktion") ||
    normalizedTopic.includes("formel")
  ) {
    return `
Zusatzregeln für Terme, Gleichungen und Funktionen:
- Erstelle echte Algebra-Aufgaben.
- Typische Aufgaben: Terme auswerten, lineare Gleichungen lösen, Formeln lesen, Funktionswerte berechnen.
- Keine einfachen Grundrechnungen ohne Variablenbezug.
- Lösungen sollen kurz und eindeutig sein, zum Beispiel x = 4 oder y = 11.
`.trim();
  }

  if (
    normalizedTopic.includes("geometr") ||
    normalizedTopic.includes("fläche") ||
    normalizedTopic.includes("umfang") ||
    normalizedTopic.includes("pythagoras") ||
    normalizedTopic.includes("quader") ||
    normalizedTopic.includes("rechteck") ||
    normalizedTopic.includes("dreieck") ||
    normalizedTopic.includes("kreis")
  ) {
    return `
Zusatzregeln für Geometrie:
- Erstelle echte Geometrie-Aufgaben.
- Typische Aufgaben: Umfang, Flächeninhalt, Winkel, Formen, Körper, Pythagoras, Koordinaten.
- Achte darauf, dass Einheiten sinnvoll vorkommen, zum Beispiel cm, cm² oder m.
- Keine allgemeinen Additionsaufgaben ohne geometrischen Bezug.
`.trim();
  }

  if (
    normalizedTopic.includes("sachaufgabe") ||
    normalizedTopic.includes("textaufgabe")
  ) {
    return `
Zusatzregeln für Sachaufgaben:
- Formuliere die Aufgaben als echte kurze Alltagssituationen.
- Die Rechenart soll klar aus dem Kontext hervorgehen.
- Keine unnötig langen Texte.
- Die Situation soll kindgerecht, realistisch und leicht verständlich sein.
`.trim();
  }

  if (
    normalizedTopic.includes("uhrzeit") ||
    normalizedTopic.includes("zeit") ||
    normalizedTopic.includes("geld") ||
    normalizedTopic.includes("maße") ||
    normalizedTopic.includes("längen") ||
    normalizedTopic.includes("gewichte")
  ) {
    return `
Zusatzregeln für Größen und Maße:
- Erstelle echte Aufgaben zu Geld, Zeit, Längen, Gewichten oder Maßeinheiten.
- Nutze passende Einheiten und realistische Werte.
- Bei Geld bitte Euro-Formate sinnvoll verwenden.
- Bei Uhrzeit bitte klare Zeitformate verwenden, zum Beispiel HH:MM.
`.trim();
  }

  return `
Zusatzregeln:
- Bleibe fachlich sauber beim Thema.
- Vermeide generische Aufgaben, wenn das Thema spezieller ist.
- Erzeuge abwechslungsreiche, konkrete und schülergerechte Aufgaben.
`.trim();
}

function buildUserPrompt(
  topic: string,
  difficulty: DifficultyLevel,
  count: number,
  prompt?: string
): string {
  if (prompt && prompt.trim()) {
    return prompt.trim();
  }

  const topicSpecificRules = getTopicPromptRules(topic);

  return `
Erstelle ${count} unterschiedliche Mathematikaufgaben zum Thema "${topic}" auf Schwierigkeitsstufe ${difficulty}.

Allgemeine Pflichtregeln:
- Die Aufgaben müssen fachlich wirklich zum Thema passen.
- Keine generischen Standard-Additionen, wenn das Thema spezieller ist.
- Verwende kindgerechtes Deutsch.
- Volksschule: kurz, konkret, direkt.
- AHS-Unterstufe: sauber, etwas anspruchsvoller, aber nicht unnötig abstrakt.
- Die Antwort muss kurz und eindeutig sein.
- Die Erklärung muss kurz, korrekt und verständlich sein.
- Erzeuge abwechslungsreiche Aufgaben mit unterschiedlichen Zahlen und Formulierungen.
- Keine Dubletten.

${topicSpecificRules}

Gib nur ein JSON-Array zurück.
`.trim();
}

function parseJsonArrayFromText(rawText: string): unknown[] | null {
  const trimmed = rawText.trim();

  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { tasks?: unknown[] }).tasks)) {
      return (parsed as { tasks: unknown[] }).tasks;
    }
  } catch {
    // weiter unten mit Ausschnitt-Suche probieren
  }

  const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignorieren
    }
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]) as { tasks?: unknown[] };
      if (Array.isArray(parsed.tasks)) return parsed.tasks;
    } catch {
      // ignorieren
    }
  }

  return null;
}

function toGeneratedTask(
  candidate: unknown,
  fallbackTopic: string,
  fallbackDifficulty: DifficultyLevel
): GeneratedTask | null {
  if (!candidate || typeof candidate !== "object") return null;

  const item = candidate as Record<string, unknown>;

  const question =
    typeof item.question === "string" && item.question.trim()
      ? item.question.trim()
      : null;

  const correctAnswer =
    typeof item.correctAnswer === "string" && item.correctAnswer.trim()
      ? item.correctAnswer.trim()
      : null;

  const explanation =
    typeof item.explanation === "string" && item.explanation.trim()
      ? item.explanation.trim()
      : null;

  const topic =
    typeof item.topic === "string" && item.topic.trim()
      ? item.topic.trim()
      : fallbackTopic;

  const category =
    typeof item.category === "string" && item.category.trim()
      ? item.category.trim()
      : fallbackTopic;

  const difficulty = isDifficultyLevel(item.difficulty)
    ? item.difficulty
    : fallbackDifficulty;

  if (!question || !correctAnswer || !explanation) {
    return null;
  }

  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question,
    correctAnswer,
    explanation,
    topic,
    category,
    difficulty,
  };
}

function deduplicateTasks(tasks: GeneratedTask[]) {
  const seen = new Set<string>();
  const result: GeneratedTask[] = [];

  for (const task of tasks) {
    const key = normalizeText(task.question);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(task);
    }
  }

  return result;
}

function isTaskRelevant(task: GeneratedTask, requestedTopic: string) {
  const taskTopic = normalizeText(task.topic);
  const taskCategory = normalizeText(task.category);
  const expected = normalizeText(requestedTopic);

  return taskTopic === expected || taskCategory === expected;
}

async function tryOllamaGeneration(
  topic: string,
  difficulty: DifficultyLevel,
  count: number,
  prompt?: string
) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma3";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        system: buildSystemPrompt(),
        prompt: buildUserPrompt(topic, difficulty, count, prompt),
        options: {
          temperature: 0.4,
        },
      }),
    });

    if (!response.ok) {
      return {
        ok: false as const,
        reason: `Ollama HTTP ${response.status} ${response.statusText}`,
        raw: "",
        tasks: [] as GeneratedTask[],
      };
    }

    const data = (await response.json()) as OllamaResponse;
    const raw = typeof data.response === "string" ? data.response : "";

    if (!raw.trim()) {
      return {
        ok: false as const,
        reason: "Ollama hat eine leere Antwort geliefert.",
        raw,
        tasks: [] as GeneratedTask[],
      };
    }

    const parsedArray = parseJsonArrayFromText(raw);

    if (!parsedArray) {
      return {
        ok: false as const,
        reason: "Ollama-Antwort konnte nicht als JSON-Array gelesen werden.",
        raw,
        tasks: [] as GeneratedTask[],
      };
    }

    const normalized = parsedArray
      .map((item) => toGeneratedTask(item, topic, difficulty))
      .filter((item): item is GeneratedTask => item !== null);

    const relevant = normalized.filter((task) => isTaskRelevant(task, topic));
    const unique = deduplicateTasks(relevant);

    if (unique.length === 0) {
      return {
        ok: false as const,
        reason: "Ollama hat keine brauchbaren thematisch passenden Aufgaben geliefert.",
        raw,
        tasks: [] as GeneratedTask[],
      };
    }

    return {
      ok: true as const,
      reason: "",
      raw,
      tasks: unique,
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unbekannter Ollama-Fehler";

    return {
      ok: false as const,
      reason,
      raw: "",
      tasks: [] as GeneratedTask[],
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateTasksRequest;

    const topic = getSafeTopic(body);
    const difficulty = getSafeDifficulty(body.difficulty);
    const count = getSafeCount(body.count);
    const prompt = typeof body.prompt === "string" ? body.prompt : undefined;

    console.log("[generate-tasks] request", {
      topic,
      difficulty,
      count,
      hasPrompt: Boolean(prompt),
    });

    const ollamaResult = await tryOllamaGeneration(topic, difficulty, count, prompt);

    if (!ollamaResult.ok) {
      console.warn("[generate-tasks] ollama failed", {
        topic,
        difficulty,
        count,
        reason: ollamaResult.reason,
      });

      const fallbackTasks = generateLocalTasks(topic, difficulty, count);

      return NextResponse.json({
        tasks: fallbackTasks,
        fallback: true,
        source: "local-generator",
        reason: ollamaResult.reason,
      });
    }

    const ollamaTasks = ollamaResult.tasks.slice(0, count);

    if (ollamaTasks.length >= count) {
      console.log("[generate-tasks] success via ollama", {
        topic,
        difficulty,
        count,
        returned: ollamaTasks.length,
      });

      return NextResponse.json({
        tasks: ollamaTasks,
        fallback: false,
        source: "ollama",
      });
    }

    const missingCount = count - ollamaTasks.length;
    const localTasks = generateLocalTasks(topic, difficulty, missingCount);
    const combined = deduplicateTasks([...ollamaTasks, ...localTasks]).slice(0, count);

    console.warn("[generate-tasks] ollama partial, topped up locally", {
      topic,
      difficulty,
      requested: count,
      ollamaReturned: ollamaTasks.length,
      localAdded: combined.length - ollamaTasks.length,
    });

    return NextResponse.json({
      tasks: combined,
      fallback: true,
      source: "ollama+local-generator",
      reason: "Ollama hat zu wenige vollständige Aufgaben geliefert.",
    });
  } catch (error) {
    console.error("[generate-tasks] route error", error);

    let topic = "Einfache Addition";
    let difficulty: DifficultyLevel = 2;
    let count = 5;

    try {
      const clonedRequest = request.clone();
      const body = (await clonedRequest.json()) as Partial<GenerateTasksRequest>;

      if (typeof body.topic === "string" && body.topic.trim()) {
        topic = body.topic.trim();
      } else if (typeof body.category === "string" && body.category.trim()) {
        topic = body.category.trim();
      }

      if (isDifficultyLevel(body.difficulty)) {
        difficulty = body.difficulty;
      }

      if (typeof body.count === "number" && Number.isFinite(body.count)) {
        count = Math.max(1, Math.min(12, Math.floor(body.count)));
      }
    } catch {
      // wenn auch das fehlschlägt, bleiben die Fallback-Defaults
    }

    const fallbackTasks = generateLocalTasks(topic, difficulty, count);

    return NextResponse.json({
      tasks: fallbackTasks,
      fallback: true,
      source: "local-generator",
      reason:
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler in /api/generate-tasks",
    });
  }
}