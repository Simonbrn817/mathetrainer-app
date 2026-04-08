// lib/training-engine.ts
// Adaptive Mathe-Lernplattform – verbesserte Version

export type DifficultyLevel = 1 | 2 | 3;

export type TopicConfidence = {
  topic: string;
  confidence: number;
};

export type GeneratedTask = {
  id?: string;
  question: string;
  correctAnswer: string;
  explanation: string;
  topic: string;
  category: string;
  difficulty: DifficultyLevel;
};

export type TrainingSession = {
  id: string;
  date: string;
  weekdayLabel: string;
  completed: boolean;
  completedAt: string | null;
  scorePercent: number | null;
};

type TopicLevelInput = {
  category: string;
  level: DifficultyLevel;
};

const OLLAMA_BASE_URL =
  process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ||
  process.env.OLLAMA_BASE_URL ||
  "http://localhost:11434";

const OLLAMA_MODEL =
  process.env.NEXT_PUBLIC_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "gemma3";

const WEEKDAY_LABELS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

/* ----------------------------
   Hilfsfunktionen
----------------------------- */

function randomInt(min: number, max: number): number {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function randomChoice<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clampDifficulty(level: number): DifficultyLevel {
  if (level <= 1) return 1;
  if (level >= 3) return 3;
  return 2;
}

function normalizeTopicName(topic: string): string {
  return topic.trim().toLowerCase();
}

/** Größten gemeinsamen Teiler (für Brüche kürzen) */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** Bruch als gekürzter String */
function fractionStr(num: number, den: number): string {
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}

/** Rundet auf n Dezimalstellen */
function round(value: number, decimals = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function isTaskUsable(task: unknown): task is GeneratedTask {
  if (!task || typeof task !== "object") return false;
  const candidate = task as Record<string, unknown>;
  return (
    typeof candidate.question === "string" &&
    candidate.question.trim().length > 0 &&
    typeof candidate.correctAnswer === "string" &&
    candidate.correctAnswer.trim().length > 0 &&
    typeof candidate.explanation === "string" &&
    candidate.explanation.trim().length > 0 &&
    typeof candidate.topic === "string" &&
    candidate.topic.trim().length > 0 &&
    typeof candidate.category === "string" &&
    candidate.category.trim().length > 0 &&
    typeof candidate.difficulty === "number"
  );
}

export function deduplicateTasks(tasks: GeneratedTask[]): GeneratedTask[] {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    const key = `${normalizeTopicName(task.topic)}|${task.question
      .trim()
      .toLowerCase()}|${task.correctAnswer.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildTask(
  topic: string,
  question: string,
  correctAnswer: string | number,
  explanation: string,
  difficulty: DifficultyLevel
): GeneratedTask {
  return {
    topic,
    category: topic,
    question,
    correctAnswer: String(correctAnswer),
    explanation,
    difficulty,
  };
}

/* ======================================================
   LOKALE GENERATOREN – DIDAKTISCH VERBESSERT
   ====================================================== */

/* ---------- 1. ZAHLEN UND ZAHLENRÄUME ---------- */

function generateNumberTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const a = randomInt(1, 50);
        const b = randomInt(1, 50);
        return buildTask(topic, `Welche Zahl ist größer: ${a} oder ${b}?`,
          Math.max(a, b), `${Math.max(a, b)} ist größer als ${Math.min(a, b)}.`, difficulty);
      },
      () => {
        const a = randomInt(10, 99);
        return buildTask(topic, `Wie lautet der Vorgänger von ${a}?`,
          a - 1, `Der Vorgänger ist die Zahl direkt davor: ${a - 1}.`, difficulty);
      },
      () => {
        const a = randomInt(10, 99);
        return buildTask(topic, `Wie lautet der Nachfolger von ${a}?`,
          a + 1, `Der Nachfolger ist die Zahl direkt danach: ${a + 1}.`, difficulty);
      },
      () => {
        const nums = Array.from({ length: 5 }, () => randomInt(1, 30));
        const sorted = [...nums].sort((a, b) => a - b);
        return buildTask(topic, `Ordne von klein nach groß: ${nums.join(", ")}`,
          sorted.join(", "), `Sortiert: ${sorted.join(" < ")}`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const n = randomInt(100, 999);
        return buildTask(topic, `Runde ${n} auf die nächste Zehnerzahl.`,
          Math.round(n / 10) * 10,
          `Schau auf die Einerstelle: ${n % 10 >= 5 ? "aufrunden" : "abrunden"}. Ergebnis: ${Math.round(n / 10) * 10}`, difficulty);
      },
      () => {
        const n = randomInt(1000, 9999);
        const ones = n % 10;
        const tens = Math.floor((n % 100) / 10);
        const hundreds = Math.floor((n % 1000) / 100);
        const thousands = Math.floor(n / 1000);
        return buildTask(topic,
          `Welchen Wert hat die Hunderterstelle bei der Zahl ${n}?`,
          hundreds * 100,
          `Die Zahl ${n} hat ${thousands} Tausender, ${hundreds} Hunderter, ${tens} Zehner, ${ones} Einer. Die Hunderterstelle hat den Wert ${hundreds * 100}.`, difficulty);
      },
      () => {
        const nums = Array.from({ length: 5 }, () => randomInt(100, 999));
        const sorted = [...nums].sort((a, b) => a - b);
        return buildTask(topic, `Ordne von groß nach klein: ${nums.join(", ")}`,
          [...sorted].reverse().join(", "),
          `Sortiert absteigend: ${[...sorted].reverse().join(" > ")}`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const n = randomInt(10000, 99999);
        return buildTask(topic, `Runde ${n} auf die nächste Tausenderzahl.`,
          Math.round(n / 1000) * 1000,
          `Schau auf die Hunderterstelle: ${Math.floor((n % 1000) / 100) >= 5 ? "aufrunden" : "abrunden"}. Ergebnis: ${Math.round(n / 1000) * 1000}`, difficulty);
      },
      () => {
        const a = randomInt(-20, -1);
        const b = randomInt(-20, -1);
        return buildTask(topic, `Welche Zahl ist kleiner: ${a} oder ${b}?`,
          Math.min(a, b),
          `Bei negativen Zahlen gilt: je größer der Betrag, desto kleiner die Zahl. ${Math.min(a, b)} ist kleiner.`, difficulty);
      },
      () => {
        const a = randomInt(1, 10);
        const b = randomInt(1, 10);
        return buildTask(topic,
          `Schreibe alle ganzen Zahlen von ${-a} bis ${b} der Reihe nach auf.`,
          Array.from({ length: a + b + 1 }, (_, i) => -a + i).join(", "),
          `Von ${-a} bis ${b} zählen wir in Einerschritten: ${Array.from({ length: a + b + 1 }, (_, i) => -a + i).join(", ")}`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 2. ADDITION ---------- */

function generateAdditionTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const a = randomInt(1, 9);
        const b = randomInt(1, 9);
        return buildTask(topic, `Rechne: ${a} + ${b} = ___`,
          a + b, `${a} plus ${b} ergibt ${a + b}.`, difficulty);
      },
      () => {
        const sum = randomInt(5, 15);
        const a = randomInt(1, sum - 1);
        return buildTask(topic, `Ergänze: ${a} + ___ = ${sum}`,
          sum - a, `${sum} − ${a} = ${sum - a}. Also ist die Lücke ${sum - a}.`, difficulty);
      },
      () => {
        const a = randomInt(10, 30);
        const b = randomInt(10, 30);
        return buildTask(topic, `Rechne ohne Übergang: ${a} + ${b}`,
          a + b, `Addiere Zehner und Einer getrennt: ${a} + ${b} = ${a + b}.`, difficulty);
      },
      () => {
        const a = randomInt(2, 9);
        const b = randomInt(2, 9);
        return buildTask(topic,
          `Anna hat ${a} rote und ${b} blaue Stifte. Wie viele Stifte hat sie insgesamt?`,
          a + b, `${a} + ${b} = ${a + b} Stifte.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const a = randomInt(30, 150);
        const b = randomInt(30, 150);
        return buildTask(topic, `Rechne: ${a} + ${b}`,
          a + b, `${a} + ${b} = ${a + b}.`, difficulty);
      },
      () => {
        const sum = randomInt(100, 300);
        const a = randomInt(50, sum - 20);
        return buildTask(topic, `Welche Zahl muss man zu ${a} addieren, um ${sum} zu erhalten?`,
          sum - a, `${sum} − ${a} = ${sum - a}.`, difficulty);
      },
      () => {
        const a = randomInt(200, 600);
        const b = randomInt(200, 600);
        return buildTask(topic,
          `Schätze zuerst, dann rechne: ${a} + ${b}`,
          a + b,
          `Schätzung: ca. ${Math.round(a / 100) * 100} + ${Math.round(b / 100) * 100} = ${Math.round(a / 100) * 100 + Math.round(b / 100) * 100}. Genau: ${a + b}.`, difficulty);
      },
      () => {
        const a = randomInt(10, 60);
        const b = randomInt(10, 60);
        const c = randomInt(5, 30);
        return buildTask(topic, `Rechne: ${a} + ${b} + ${c}`,
          a + b + c, `${a} + ${b} = ${a + b}, dann + ${c} = ${a + b + c}.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const a = randomInt(300, 1200);
        const b = randomInt(300, 1200);
        return buildTask(topic, `Rechne: ${a} + ${b}`,
          a + b, `${a} + ${b} = ${a + b}.`, difficulty);
      },
      () => {
        const a = randomInt(1000, 5000);
        const b = randomInt(1000, 5000);
        const c = randomInt(500, 2000);
        return buildTask(topic, `Rechne: ${a} + ${b} + ${c}`,
          a + b + c, `${a} + ${b} = ${a + b}, dann + ${c} = ${a + b + c}.`, difficulty);
      },
      () => {
        const total = randomInt(2000, 8000);
        const a = randomInt(800, total - 500);
        const b = randomInt(200, total - a);
        const c = total - a - b;
        return buildTask(topic,
          `Drei Beträge: ${a} €, ${b} €, ${c} €. Wie viel ist das zusammen?`,
          total, `${a} + ${b} + ${c} = ${total} €.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 3. SUBTRAKTION ---------- */

function generateSubtractionTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const a = randomInt(10, 20);
        const b = randomInt(1, a - 1);
        return buildTask(topic, `Rechne: ${a} − ${b}`,
          a - b, `${a} minus ${b} ergibt ${a - b}.`, difficulty);
      },
      () => {
        const diff = randomInt(3, 10);
        const b = randomInt(1, 10);
        const a = diff + b;
        return buildTask(topic, `Ergänze: ${b} + ___ = ${a}`,
          diff, `Von ${b} bis ${a} sind es ${diff} Schritte.`, difficulty);
      },
      () => {
        const a = randomInt(10, 25);
        const b = randomInt(2, a - 1);
        return buildTask(topic,
          `Leo hat ${a} Bonbons und gibt ${b} davon weg. Wie viele hat er noch?`,
          a - b, `${a} − ${b} = ${a - b} Bonbons.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const a = randomInt(50, 200);
        const b = randomInt(10, a - 5);
        return buildTask(topic, `Rechne: ${a} − ${b}`,
          a - b, `${a} − ${b} = ${a - b}.`, difficulty);
      },
      () => {
        const result = randomInt(20, 100);
        const b = randomInt(10, 80);
        const a = result + b;
        return buildTask(topic, `Von welcher Zahl muss man ${b} abziehen, um ${result} zu erhalten?`,
          a, `Umkehraufgabe: ${result} + ${b} = ${a}.`, difficulty);
      },
      () => {
        const a = randomInt(100, 500);
        const b = randomInt(50, a - 10);
        return buildTask(topic,
          `Eine Klasse hat ${a} Bücher. ${b} werden ausgeliehen. Wie viele sind noch da?`,
          a - b, `${a} − ${b} = ${a - b} Bücher.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const a = randomInt(500, 2000);
        const b = randomInt(100, a - 1);
        return buildTask(topic, `Rechne: ${a} − ${b}`,
          a - b, `${a} − ${b} = ${a - b}.`, difficulty);
      },
      () => {
        const result = randomInt(100, 500);
        const b = randomInt(100, 800);
        const a = result + b;
        return buildTask(topic,
          `Das Ergebnis einer Subtraktion ist ${result}. Der Subtrahend ist ${b}. Wie lautet der Minuend?`,
          a, `Minuend = Ergebnis + Subtrahend: ${result} + ${b} = ${a}.`, difficulty);
      },
      () => {
        const a = randomInt(1000, 5000);
        const b = randomInt(300, a - 200);
        const c = randomInt(100, b - 100);
        return buildTask(topic,
          `Rechne: ${a} − ${b} − ${c}`,
          a - b - c,
          `${a} − ${b} = ${a - b}, dann − ${c} = ${a - b - c}.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 4. MULTIPLIKATION ---------- */

function generateMultiplicationTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const a = randomInt(1, 10);
        const b = randomInt(1, 10);
        return buildTask(topic, `Rechne: ${a} · ${b}`,
          a * b, `${a} mal ${b} ist ${a * b} (kleine Einmaleins).`, difficulty);
      },
      () => {
        const b = randomInt(2, 9);
        const result = randomInt(2, 9) * b;
        const a = result / b;
        return buildTask(topic, `Ergänze: ___ · ${b} = ${result}`,
          a, `${result} ÷ ${b} = ${a}.`, difficulty);
      },
      () => {
        const n = randomInt(2, 8);
        const k = randomInt(2, 6);
        return buildTask(topic,
          `In ${n} Schachteln liegen je ${k} Kekse. Wie viele Kekse sind es insgesamt?`,
          n * k, `${n} · ${k} = ${n * k} Kekse.`, difficulty);
      },
      () => {
        const a = randomInt(2, 9);
        return buildTask(topic,
          `Verdopple die Zahl ${a}.`,
          2 * a, `${a} · 2 = ${2 * a}.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const a = randomInt(11, 25);
        const b = randomInt(2, 12);
        return buildTask(topic, `Rechne: ${a} · ${b}`,
          a * b, `${a} · ${b} = ${a * b}.`, difficulty);
      },
      () => {
        const a = randomInt(10, 50);
        const b = randomInt(10, 50);
        return buildTask(topic,
          `Ein Rechteck hat ${a} cm Länge und ${b} cm Breite. Wie groß ist sein Flächeninhalt?`,
          a * b, `Fläche = ${a} · ${b} = ${a * b} cm².`, difficulty);
      },
      () => {
        const a = randomInt(5, 20);
        const b = randomInt(5, 20);
        const result = a * b;
        return buildTask(topic, `Welche zwei Faktoren ergeben ${result}? (Tipp: einer ist ${a})`,
          b, `${result} ÷ ${a} = ${b}.`, difficulty);
      },
      () => {
        const price = randomInt(3, 15);
        const count = randomInt(4, 12);
        return buildTask(topic,
          `Ein Ticket kostet ${price} €. Wie viel kosten ${count} Tickets?`,
          price * count, `${count} · ${price} € = ${price * count} €.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const a = randomInt(20, 80);
        const b = randomInt(12, 30);
        return buildTask(topic, `Rechne: ${a} · ${b}`,
          a * b,
          `Zerlege: ${a} · ${b} = ${a} · ${Math.floor(b / 10) * 10} + ${a} · ${b % 10} = ${a * Math.floor(b / 10) * 10} + ${a * (b % 10)} = ${a * b}.`, difficulty);
      },
      () => {
        const a = randomInt(15, 40);
        const b = randomInt(15, 40);
        const c = randomInt(2, 8);
        return buildTask(topic, `Rechne: ${a} · ${b} · ${c}`,
          a * b * c, `${a} · ${b} = ${a * b}, dann · ${c} = ${a * b * c}.`, difficulty);
      },
      () => {
        const result = randomInt(300, 1200);
        const a = randomInt(12, 30);
        if (result % a !== 0) {
          const corrected = a * randomInt(12, 30);
          return buildTask(topic,
            `Das Produkt zweier Zahlen ist ${corrected}. Ein Faktor ist ${a}. Was ist der andere?`,
            corrected / a, `${corrected} ÷ ${a} = ${corrected / a}.`, difficulty);
        }
        return buildTask(topic,
          `Das Produkt zweier Zahlen ist ${result}. Ein Faktor ist ${a}. Was ist der andere?`,
          result / a, `${result} ÷ ${a} = ${result / a}.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 5. DIVISION ---------- */

function generateDivisionTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const divisor = randomInt(2, 9);
        const quotient = randomInt(2, 9);
        const dividend = divisor * quotient;
        return buildTask(topic, `Rechne: ${dividend} ÷ ${divisor}`,
          quotient, `${dividend} geteilt durch ${divisor} ergibt ${quotient}.`, difficulty);
      },
      () => {
        const divisor = randomInt(2, 5);
        const quotient = randomInt(2, 8);
        const dividend = divisor * quotient;
        return buildTask(topic, `Halbiere: ${dividend}`,
          dividend / 2,
          `${dividend} ÷ 2 = ${dividend / 2}.`, difficulty);
      },
      () => {
        const n = randomInt(2, 8);
        const k = randomInt(2, 6);
        const total = n * k;
        return buildTask(topic,
          `${total} Kekse werden gleichmäßig auf ${n} Kinder verteilt. Wie viele bekommt jedes Kind?`,
          k, `${total} ÷ ${n} = ${k} Kekse pro Kind.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const divisor = randomInt(2, 12);
        const quotient = randomInt(5, 20);
        const dividend = divisor * quotient;
        return buildTask(topic, `Rechne: ${dividend} ÷ ${divisor}`,
          quotient, `${dividend} ÷ ${divisor} = ${quotient}.`, difficulty);
      },
      () => {
        const quotient = randomInt(5, 15);
        const divisor = randomInt(3, 11);
        const dividend = divisor * quotient;
        return buildTask(topic,
          `Durch welche Zahl muss man ${dividend} teilen, um ${quotient} zu erhalten?`,
          divisor, `${dividend} ÷ ${quotient} = ${divisor}.`, difficulty);
      },
      () => {
        const priceTotal = randomInt(5, 20) * randomInt(3, 8);
        const count = randomInt(3, 8);
        const price = priceTotal / count;
        return buildTask(topic,
          `${count} Freunde teilen sich ${priceTotal} € gleichmäßig. Wie viel zahlt jeder?`,
          price, `${priceTotal} ÷ ${count} = ${price} €.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const divisor = randomInt(4, 20);
        const quotient = randomInt(15, 50);
        const dividend = divisor * quotient;
        return buildTask(topic, `Rechne: ${dividend} ÷ ${divisor}`,
          quotient, `${dividend} ÷ ${divisor} = ${quotient}.`, difficulty);
      },
      () => {
        const divisor = randomInt(6, 25);
        const quotient = randomInt(20, 60);
        const remainder = randomInt(1, divisor - 1);
        const dividend = divisor * quotient + remainder;
        return buildTask(topic,
          `Rechne mit Rest: ${dividend} ÷ ${divisor}`,
          `${quotient} Rest ${remainder}`,
          `${divisor} · ${quotient} = ${divisor * quotient}, ${dividend} − ${divisor * quotient} = ${remainder}. Ergebnis: ${quotient} R ${remainder}.`, difficulty);
      },
      () => {
        const total = randomInt(500, 2000);
        const divisor = randomInt(4, 20);
        const q = Math.floor(total / divisor);
        const r = total % divisor;
        return buildTask(topic,
          `${total} Bücher werden auf ${divisor} Regale gleich verteilt. Wie viele passen auf jedes Regal, und wie viele bleiben übrig?`,
          r === 0 ? `${q} Bücher` : `${q} Bücher, ${r} übrig`,
          `${total} ÷ ${divisor} = ${q} Rest ${r}.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 6. BRÜCHE ---------- */

function generateFractionTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const den = randomChoice([2, 4, 5, 10]);
        const num = randomInt(1, den - 1);
        const dec = round(num / den, 2);
        return buildTask(topic,
          `Schreibe den Bruch ${num}/${den} als Dezimalzahl.`,
          String(dec), `${num} ÷ ${den} = ${dec}.`, difficulty);
      },
      () => {
        const den = randomChoice([2, 3, 4, 6, 8]);
        const num = randomInt(1, den - 1);
        return buildTask(topic,
          `Zeichne (oder beschreibe): Welcher Bruchteil ist ${num}/${den} von einem Ganzen?`,
          `${num}/${den}`,
          `Das Ganze wird in ${den} gleiche Teile geteilt, davon nimmt man ${num} Teile.`, difficulty);
      },
      () => {
        const den = randomChoice([2, 4, 8]);
        const half = den / 2;
        return buildTask(topic,
          `Ist ${half}/${den} größer, gleich oder kleiner als die Hälfte?`,
          "gleich",
          `${half}/${den} ist genau die Hälfte, weil ${half} = ${den}/2.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const den = randomChoice([4, 6, 8, 10, 12]);
        const num1 = randomInt(1, den - 1);
        const num2 = randomInt(1, den - num1 - 1 > 0 ? den - num1 - 1 : 1);
        const sumNum = num1 + num2;
        const g = gcd(sumNum, den);
        return buildTask(topic,
          `Rechne: ${num1}/${den} + ${num2}/${den}`,
          fractionStr(sumNum, den),
          `Gleicher Nenner: ${num1} + ${num2} = ${sumNum}. Ergebnis: ${sumNum}/${den}${g > 1 ? ` = ${fractionStr(sumNum, den)}` : ""}.`, difficulty);
      },
      () => {
        const den = randomChoice([4, 6, 8, 10]);
        const num = randomInt(2, den - 1);
        const g = gcd(num, den);
        return buildTask(topic,
          `Kürze den Bruch ${num}/${den} vollständig.`,
          fractionStr(num, den),
          `GGT von ${num} und ${den} ist ${g}. ${num}/${den} = ${num / g}/${den / g}.`, difficulty);
      },
      () => {
        const base = randomInt(2, 5);
        const num1 = base;
        const den1 = randomChoice([2, 4, 6]);
        const num2 = base * 2;
        const den2 = den1 * 2;
        return buildTask(topic,
          `Sind ${num1}/${den1} und ${num2}/${den2} gleichwertig?`,
          "ja",
          `${num2}/${den2} = ${num1}/${den1}, weil man Zähler und Nenner durch 2 kürzen kann.`, difficulty);
      },
      () => {
        const den = randomChoice([4, 8, 10]);
        const num1 = randomInt(2, den - 2);
        const num2 = randomInt(1, num1 - 1);
        const diffNum = num1 - num2;
        return buildTask(topic,
          `Rechne: ${num1}/${den} − ${num2}/${den}`,
          fractionStr(diffNum, den),
          `Gleicher Nenner: ${num1} − ${num2} = ${diffNum}. Ergebnis: ${fractionStr(diffNum, den)}.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const den1 = randomChoice([2, 3, 4]);
        const den2 = randomChoice([3, 4, 6]);
        const lcm = (den1 * den2) / gcd(den1, den2);
        const num1 = randomInt(1, den1 - 1);
        const num2 = randomInt(1, den2 - 1);
        const sumNum = num1 * (lcm / den1) + num2 * (lcm / den2);
        return buildTask(topic,
          `Rechne: ${num1}/${den1} + ${num2}/${den2}`,
          fractionStr(sumNum, lcm),
          `KGV(${den1}, ${den2}) = ${lcm}. Erweitern: ${num1 * (lcm / den1)}/${lcm} + ${num2 * (lcm / den2)}/${lcm} = ${sumNum}/${lcm} = ${fractionStr(sumNum, lcm)}.`, difficulty);
      },
      () => {
        const num1 = randomInt(1, 4);
        const den1 = randomChoice([2, 3, 4, 5]);
        const num2 = randomInt(1, 4);
        const den2 = randomChoice([2, 3, 4, 5]);
        const resNum = num1 * num2;
        const resDen = den1 * den2;
        return buildTask(topic,
          `Rechne: ${num1}/${den1} · ${num2}/${den2}`,
          fractionStr(resNum, resDen),
          `Zähler mal Zähler, Nenner mal Nenner: (${num1}·${num2})/(${den1}·${den2}) = ${resNum}/${resDen} = ${fractionStr(resNum, resDen)}.`, difficulty);
      },
      () => {
        const whole = randomInt(2, 5);
        const num = randomInt(1, 3);
        const den = randomChoice([4, 5, 8, 10]);
        const totalNum = whole * den + num;
        return buildTask(topic,
          `Schreibe als unechten Bruch: ${whole} ${num}/${den}`,
          `${totalNum}/${den}`,
          `${whole} · ${den} + ${num} = ${totalNum}. Als unechter Bruch: ${totalNum}/${den}.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 7. PROZENT ---------- */

function generatePercentTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const base = randomChoice([100, 200, 400, 500]);
        const pct = randomChoice([10, 20, 25, 50]);
        const result = (base * pct) / 100;
        return buildTask(topic, `Wie viel sind ${pct}% von ${base}?`,
          result, `${pct}% von ${base}: ${base} · ${pct} / 100 = ${result}.`, difficulty);
      },
      () => {
        const pct = randomChoice([10, 25, 50, 75, 100]);
        return buildTask(topic,
          `Schreibe ${pct}% als Dezimalzahl.`,
          pct / 100,
          `${pct}% = ${pct}/100 = ${pct / 100}.`, difficulty);
      },
      () => {
        return buildTask(topic,
          `Wie viel Prozent ist die Hälfte von etwas?`,
          "50",
          `Die Hälfte entspricht 50%.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const base = randomInt(60, 400);
        const pct = randomChoice([5, 10, 15, 20, 25, 30]);
        const result = round((base * pct) / 100, 2);
        return buildTask(topic, `Berechne ${pct}% von ${base} €.`,
          result, `${base} · ${pct} / 100 = ${result} €.`, difficulty);
      },
      () => {
        const base = randomInt(80, 500);
        const pct = randomChoice([10, 20, 25]);
        const result = round((base * pct) / 100, 2);
        return buildTask(topic,
          `Ein Artikel kostet ${base} €. Du bekommst ${pct}% Rabatt. Wie viel zahlst du?`,
          round(base - result, 2),
          `Rabatt: ${result} €. Preis nach Rabatt: ${base} − ${result} = ${round(base - result, 2)} €.`, difficulty);
      },
      () => {
        const result = randomInt(10, 80);
        const base = randomInt(100, 400);
        const pct = round((result / base) * 100, 1);
        return buildTask(topic,
          `Von ${base} Schüler:innen sind ${result} krank. Wie viel Prozent sind das?`,
          pct,
          `${result} / ${base} · 100 = ${pct}%.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const pct = randomChoice([12, 15, 18, 22, 35]);
        const result = randomInt(20, 120);
        const base = round((result / pct) * 100, 1);
        return buildTask(topic,
          `${pct}% von einem Betrag sind ${result} €. Wie hoch ist der Grundwert?`,
          base,
          `Grundwert = Prozentwert / Prozentsatz · 100 = ${result} / ${pct} · 100 = ${base} €.`, difficulty);
      },
      () => {
        const base = randomInt(200, 800);
        const newVal = randomInt(base + 20, base + 200);
        const increase = round(((newVal - base) / base) * 100, 1);
        return buildTask(topic,
          `Ein Preis steigt von ${base} € auf ${newVal} €. Um wie viel Prozent ist er gestiegen?`,
          increase,
          `Zunahme: ${newVal - base} €. Prozentsatz: ${newVal - base} / ${base} · 100 = ${increase}%.`, difficulty);
      },
      () => {
        const base = randomInt(300, 1000);
        const pct = randomChoice([7, 8, 15, 19]);
        const tax = round((base * pct) / 100, 2);
        return buildTask(topic,
          `Ein Produkt kostet ${base} € netto. Wie viel kostet es mit ${pct}% MwSt.?`,
          round(base + tax, 2),
          `MwSt.: ${base} · ${pct} / 100 = ${tax} €. Brutto: ${base} + ${tax} = ${round(base + tax, 2)} €.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 8. GEOMETRIE (Umfang, Fläche, Winkel, Körper) ---------- */

function generateGeometryTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const l = randomInt(3, 15);
        const w = randomInt(2, 12);
        return buildTask(topic,
          `Ein Rechteck hat die Länge ${l} cm und die Breite ${w} cm. Berechne den Umfang.`,
          2 * (l + w),
          `U = 2 · (${l} + ${w}) = 2 · ${l + w} = ${2 * (l + w)} cm.`, difficulty);
      },
      () => {
        const s = randomInt(3, 15);
        return buildTask(topic,
          `Ein Quadrat hat die Seitenlänge ${s} cm. Berechne den Umfang.`,
          4 * s,
          `U = 4 · ${s} = ${4 * s} cm.`, difficulty);
      },
      () => {
        const winkel1 = randomChoice([30, 45, 60, 90]);
        const winkel2 = randomChoice([30, 45, 60, 90]);
        const winkel3 = 180 - winkel1 - winkel2;
        if (winkel3 <= 0) {
          const w1 = 60; const w2 = 60; const w3 = 60;
          return buildTask(topic,
            `Ein Dreieck hat Winkel von ${w1}° und ${w2}°. Wie groß ist der dritte Winkel?`,
            w3, `Winkelsumme im Dreieck: 180°. ${w3} = 180 − ${w1} − ${w2}.`, difficulty);
        }
        return buildTask(topic,
          `Ein Dreieck hat Winkel von ${winkel1}° und ${winkel2}°. Wie groß ist der dritte Winkel?`,
          winkel3,
          `Winkelsumme im Dreieck: 180°. ${winkel3} = 180 − ${winkel1} − ${winkel2}.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const l = randomInt(4, 20);
        const w = randomInt(3, 15);
        return buildTask(topic,
          `Berechne den Flächeninhalt eines Rechtecks mit Länge ${l} cm und Breite ${w} cm.`,
          l * w,
          `A = Länge · Breite = ${l} · ${w} = ${l * w} cm².`, difficulty);
      },
      () => {
        const b = randomInt(4, 20);
        const h = randomInt(3, 15);
        return buildTask(topic,
          `Berechne die Fläche eines Dreiecks mit Grundseite ${b} cm und Höhe ${h} cm.`,
          round(b * h / 2, 1),
          `A = (Grundseite · Höhe) / 2 = (${b} · ${h}) / 2 = ${round(b * h / 2, 1)} cm².`, difficulty);
      },
      () => {
        const r = randomInt(2, 10);
        const u = round(2 * Math.PI * r, 2);
        return buildTask(topic,
          `Berechne den Umfang eines Kreises mit Radius r = ${r} cm. (π ≈ 3,14)`,
          round(2 * 3.14 * r, 2),
          `U = 2 · π · r = 2 · 3,14 · ${r} = ${round(2 * 3.14 * r, 2)} cm.`, difficulty);
      },
      () => {
        const s = randomInt(3, 12);
        return buildTask(topic,
          `Berechne die Fläche eines Quadrats mit Seitenlänge ${s} cm.`,
          s * s,
          `A = ${s}² = ${s * s} cm².`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const r = randomInt(3, 12);
        return buildTask(topic,
          `Berechne den Flächeninhalt eines Kreises mit Radius r = ${r} cm. (π ≈ 3,14)`,
          round(3.14 * r * r, 2),
          `A = π · r² = 3,14 · ${r}² = 3,14 · ${r * r} = ${round(3.14 * r * r, 2)} cm².`, difficulty);
      },
      () => {
        const a = randomInt(3, 12);
        const b = randomInt(3, 12);
        const c = round(Math.sqrt(a * a + b * b), 2);
        return buildTask(topic,
          `Ein rechtwinkliges Dreieck hat die Katheten ${a} cm und ${b} cm. Wie lang ist die Hypotenuse? (Pythagoras)`,
          c,
          `c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}. c = √${a * a + b * b} ≈ ${c} cm.`, difficulty);
      },
      () => {
        const l = randomInt(4, 15);
        const w = randomInt(3, 12);
        const h = randomInt(2, 10);
        return buildTask(topic,
          `Berechne das Volumen eines Quaders mit Länge ${l} cm, Breite ${w} cm, Höhe ${h} cm.`,
          l * w * h,
          `V = l · b · h = ${l} · ${w} · ${h} = ${l * w * h} cm³.`, difficulty);
      },
      () => {
        const perimeter = randomChoice([24, 36, 48, 60]);
        const w = randomInt(4, perimeter / 4 - 1);
        const l = perimeter / 2 - w;
        return buildTask(topic,
          `Ein Rechteck hat Umfang ${perimeter} cm. Die Breite ist ${w} cm. Wie lang ist die Länge?`,
          l,
          `U = 2 · (l + b). ${perimeter} = 2 · (l + ${w}). l = ${perimeter / 2} − ${w} = ${l} cm.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 9. GRÖßEN UND MAßE ---------- */

function generateMeasureTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const m = randomInt(1, 20);
        return buildTask(topic, `Wandle um: ${m} m = ___ cm`,
          m * 100, `1 m = 100 cm → ${m} m = ${m * 100} cm.`, difficulty);
      },
      () => {
        const kg = randomInt(1, 15);
        return buildTask(topic, `Wandle um: ${kg} kg = ___ g`,
          kg * 1000, `1 kg = 1000 g → ${kg} kg = ${kg * 1000} g.`, difficulty);
      },
      () => {
        const cents = randomChoice([50, 75, 25, 150]);
        return buildTask(topic, `Wandle um: ${cents} Cent = ___ €`,
          round(cents / 100, 2), `${cents} Cent = ${round(cents / 100, 2)} €.`, difficulty);
      },
      () => {
        const h = randomInt(1, 11);
        const min = randomChoice([0, 15, 30, 45]);
        const timeStr = `${h}:${min === 0 ? "00" : min} Uhr`;
        const after = 60;
        const newMin = (min + after) % 60;
        const newH = h + Math.floor((min + after) / 60);
        return buildTask(topic,
          `Es ist ${timeStr}. Wie viel Uhr ist es in 60 Minuten?`,
          `${newH}:${newMin === 0 ? "00" : newMin} Uhr`,
          `${h} Stunden + 1 Stunde = ${newH}:${newMin === 0 ? "00" : newMin} Uhr.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const cm = randomChoice([150, 230, 345, 780]);
        return buildTask(topic, `Wandle um: ${cm} cm = ___ m ___ cm`,
          `${Math.floor(cm / 100)} m ${cm % 100} cm`,
          `${cm} ÷ 100 = ${Math.floor(cm / 100)} m Rest ${cm % 100} cm.`, difficulty);
      },
      () => {
        const g = randomChoice([1500, 2750, 3200, 4050]);
        return buildTask(topic, `Wandle um: ${g} g = ___ kg ___ g`,
          `${Math.floor(g / 1000)} kg ${g % 1000} g`,
          `${g} ÷ 1000 = ${Math.floor(g / 1000)} kg Rest ${g % 1000} g.`, difficulty);
      },
      () => {
        const start = randomChoice([8, 9, 10, 11]);
        const startMin = randomChoice([0, 15, 30]);
        const dur = randomChoice([45, 90, 105, 120]);
        const totalMin = start * 60 + startMin + dur;
        const endH = Math.floor(totalMin / 60);
        const endMin = totalMin % 60;
        return buildTask(topic,
          `Ein Film beginnt um ${start}:${startMin === 0 ? "00" : startMin} Uhr und dauert ${dur} Minuten. Wann endet er?`,
          `${endH}:${endMin === 0 ? "00" : endMin} Uhr`,
          `${start * 60 + startMin} + ${dur} = ${totalMin} Minuten = ${endH} Stunden ${endMin} Minuten.`, difficulty);
      },
      () => {
        const km = randomInt(2, 15);
        return buildTask(topic, `Wandle um: ${km} km = ___ m`,
          km * 1000, `1 km = 1000 m → ${km} km = ${km * 1000} m.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const a = randomChoice([1500, 2300, 3750]);
        const b = randomChoice([800, 1250, 2100]);
        const total = a + b;
        return buildTask(topic,
          `Addiere: ${a} m + ${b} m = ___ km ___ m`,
          `${Math.floor(total / 1000)} km ${total % 1000} m`,
          `${a} + ${b} = ${total} m = ${Math.floor(total / 1000)} km ${total % 1000} m.`, difficulty);
      },
      () => {
        const pricePerKg = randomInt(3, 12);
        const grams = randomChoice([250, 500, 750]);
        const cost = round((pricePerKg * grams) / 1000, 2);
        return buildTask(topic,
          `Käse kostet ${pricePerKg} € pro kg. Wie viel kosten ${grams} g?`,
          cost,
          `${grams} g = ${grams / 1000} kg. ${pricePerKg} · ${grams / 1000} = ${cost} €.`, difficulty);
      },
      () => {
        const speedKmh = randomChoice([60, 80, 100, 120]);
        const timeH = randomChoice([1.5, 2, 2.5, 3]);
        const dist = speedKmh * timeH;
        return buildTask(topic,
          `Ein Auto fährt ${speedKmh} km/h. Wie weit kommt es in ${timeH} Stunden?`,
          dist,
          `Weg = Geschwindigkeit · Zeit = ${speedKmh} · ${timeH} = ${dist} km.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 10. GLEICHUNGEN / TERME / VARIABLEN / FORMELN ---------- */

function generateEquationTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const x = randomInt(1, 15);
        const add = randomInt(2, 20);
        return buildTask(topic, `Löse: x + ${add} = ${x + add}`,
          x, `Beide Seiten um ${add} verringern: x = ${x + add} − ${add} = ${x}.`, difficulty);
      },
      () => {
        const x = randomInt(2, 12);
        const sub = randomInt(1, x - 1);
        return buildTask(topic, `Löse: x − ${sub} = ${x - sub}`,
          x, `Addiere ${sub} auf beiden Seiten: x = ${x - sub} + ${sub} = ${x}.`, difficulty);
      },
      () => {
        const a = randomInt(2, 8);
        const b = randomInt(1, 10);
        return buildTask(topic,
          `Berechne den Term: ${a} · x für x = ${b}`,
          a * b, `Einsetzen: ${a} · ${b} = ${a * b}.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const x = randomInt(2, 15);
        const factor = randomInt(2, 8);
        return buildTask(topic, `Löse: ${factor} · x = ${factor * x}`,
          x, `Beide Seiten durch ${factor} dividieren: x = ${factor * x} ÷ ${factor} = ${x}.`, difficulty);
      },
      () => {
        const x = randomInt(1, 15);
        const factor = randomInt(2, 6);
        const add = randomInt(1, 20);
        return buildTask(topic, `Löse: ${factor}x + ${add} = ${factor * x + add}`,
          x,
          `Schritt 1: ${add} subtrahieren → ${factor}x = ${factor * x}. Schritt 2: durch ${factor} → x = ${x}.`, difficulty);
      },
      () => {
        const a = randomInt(2, 5);
        const b = randomInt(2, 5);
        const c = randomInt(1, 10);
        const val = randomInt(1, 8);
        return buildTask(topic,
          `Berechne: ${a} · x² + ${b} · x − ${c} für x = ${val}`,
          a * val * val + b * val - c,
          `Einsetzen: ${a}·${val}² + ${b}·${val} − ${c} = ${a * val * val} + ${b * val} − ${c} = ${a * val * val + b * val - c}.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const x = randomInt(1, 10);
        const factor = randomInt(2, 5);
        const sub = randomInt(1, 20);
        const rhs = factor * x - sub;
        return buildTask(topic, `Löse: ${factor}x − ${sub} = ${rhs}`,
          x,
          `${sub} addieren: ${factor}x = ${rhs + sub}. Durch ${factor}: x = ${x}.`, difficulty);
      },
      () => {
        // Gleichungssystem 2×2
        const x = randomInt(1, 8);
        const y = randomInt(1, 8);
        const a1 = randomInt(1, 4);
        const b1 = randomInt(1, 4);
        const c1 = a1 * x + b1 * y;
        return buildTask(topic,
          `Gleichungssystem: x + y = ${x + y} und ${a1}x + ${b1}y = ${c1}. Finde x und y.`,
          `x = ${x}, y = ${y}`,
          `Aus der ersten Gleichung: y = ${x + y} − x. Einsetzen in die zweite: x = ${x}, y = ${y}.`, difficulty);
      },
      () => {
        const x = randomInt(2, 10);
        return buildTask(topic,
          `Forme die Formel um: A = l · b. Stelle b frei, wenn A = ${x * (x + 2)} und l = ${x}.`,
          x + 2,
          `b = A / l = ${x * (x + 2)} / ${x} = ${x + 2}.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 11. SACHAUFGABEN / TEXTAUFGABEN ---------- */

function generateWordProblemTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const a = randomInt(4, 15);
        const b = randomInt(2, 10);
        return buildTask(topic,
          `Anna hat ${a} Äpfel. Sie bekommt ${b} dazu. Wie viele Äpfel hat sie jetzt?`,
          a + b, `${a} + ${b} = ${a + b} Äpfel.`, difficulty);
      },
      () => {
        const price = randomInt(2, 9);
        const count = randomInt(2, 6);
        const paid = randomChoice([10, 20]);
        const change = paid - price * count;
        if (change < 0) {
          return buildTask(topic,
            `Ein Heft kostet ${price} €. Leon kauft ${count} Hefte und zahlt mit ${20} €. Wie viel Wechselgeld bekommt er?`,
            20 - price * count,
            `${count} · ${price} = ${price * count} €. Wechselgeld: 20 − ${price * count} = ${20 - price * count} €.`, difficulty);
        }
        return buildTask(topic,
          `Ein Heft kostet ${price} €. Leon kauft ${count} Hefte und zahlt mit ${paid} €. Wie viel Wechselgeld bekommt er?`,
          change,
          `${count} · ${price} = ${price * count} €. Wechselgeld: ${paid} − ${price * count} = ${change} €.`, difficulty);
      },
      () => {
        const total = randomInt(10, 30);
        const given = randomInt(2, total - 2);
        return buildTask(topic,
          `In einem Korb liegen ${total} Orangen. ${given} werden herausgenommen. Wie viele bleiben?`,
          total - given, `${total} − ${given} = ${total - given}.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const pricePerL = randomInt(2, 5);
        const liters = randomInt(3, 10);
        const discount = randomChoice([0.5, 1, 1.5]);
        const total = round(pricePerL * liters - discount, 2);
        return buildTask(topic,
          `Benzin kostet ${pricePerL} € pro Liter. Lea tankt ${liters} Liter und bekommt einen Rabatt von ${discount} €. Was zahlt sie?`,
          total,
          `${liters} · ${pricePerL} = ${pricePerL * liters} €. Mit Rabatt: ${pricePerL * liters} − ${discount} = ${total} €.`, difficulty);
      },
      () => {
        const km = randomInt(40, 150);
        const speed = randomChoice([40, 50, 60]);
        const time = round(km / speed, 2);
        return buildTask(topic,
          `Mia fährt ${km} km bei gleichmäßig ${speed} km/h. Wie lange fährt sie (in Stunden)?`,
          time, `Zeit = ${km} ÷ ${speed} = ${time} h.`, difficulty);
      },
      () => {
        const students = randomInt(20, 35);
        const pct = randomChoice([20, 25, 40]);
        const n = Math.round(students * pct / 100);
        return buildTask(topic,
          `In einer Klasse mit ${students} Schüler:innen nehmen ${pct}% am Sporttag teil. Wie viele sind das?`,
          n, `${pct}% von ${students} = ${students} · ${pct} / 100 ≈ ${n}.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const rate = randomInt(10, 25);
        const days = randomInt(5, 20);
        const total = rate * days;
        const spent = randomInt(50, total - 20);
        return buildTask(topic,
          `Finn spart ${rate} € pro Tag. Nach ${days} Tagen hat er ${total} €. Er gibt ${spent} € aus. Wie viel hat er noch?`,
          total - spent,
          `${rate} · ${days} = ${total} €. ${total} − ${spent} = ${total - spent} €.`, difficulty);
      },
      () => {
        const width = randomInt(5, 15);
        const length = randomInt(8, 20);
        const pricePerSqm = randomInt(20, 60);
        const area = width * length;
        const cost = area * pricePerSqm;
        return buildTask(topic,
          `Ein Zimmer ist ${width} m breit und ${length} m lang. Fliesen kosten ${pricePerSqm} € pro m². Wie viel kosten alle Fliesen?`,
          cost,
          `Fläche: ${width} · ${length} = ${area} m². Kosten: ${area} · ${pricePerSqm} = ${cost} €.`, difficulty);
      },
      () => {
        const workers = randomInt(3, 8);
        const dayRate = randomInt(150, 400);
        const days = randomInt(4, 12);
        const total = workers * dayRate * days;
        return buildTask(topic,
          `${workers} Handwerker:innen arbeiten ${days} Tage. Jede Person kostet ${dayRate} € pro Tag. Wie hoch ist die Gesamtrechnung?`,
          total,
          `${workers} · ${dayRate} · ${days} = ${total} €.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 12. DATEN UND ZUFALL ---------- */

function generateDataTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const data = Array.from({ length: 5 }, () => randomInt(1, 10));
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = round(sum / data.length, 1);
        return buildTask(topic,
          `Berechne den Mittelwert dieser Zahlen: ${data.join(", ")}`,
          mean,
          `Summe: ${sum}. Anzahl: ${data.length}. Mittelwert: ${sum} ÷ ${data.length} = ${mean}.`, difficulty);
      },
      () => {
        const faces = randomInt(1, 6);
        return buildTask(topic,
          `Du wirfst einen Würfel (6 Seiten). Wie hoch ist die Wahrscheinlichkeit, eine ${faces} zu würfeln?`,
          `1/6`,
          `Es gibt 6 gleich wahrscheinliche Ergebnisse, davon eines günstig: 1/6.`, difficulty);
      },
      () => {
        const sorted = [randomInt(1, 5), randomInt(5, 8), randomInt(8, 15)].sort((a, b) => a - b);
        const data = [...sorted, sorted[1]];
        const shuffled = shuffleArray(data);
        return buildTask(topic,
          `Was ist der Median dieser Zahlen? ${shuffled.join(", ")}`,
          sorted[1],
          `Sortiert: ${[...data].sort((a, b) => a - b).join(", ")}. Der mittlere Wert ist ${sorted[1]}.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const data = Array.from({ length: 6 }, () => randomInt(10, 50));
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = round(sum / data.length, 1);
        return buildTask(topic,
          `Berechne den Mittelwert: ${data.join(", ")}`,
          mean,
          `Summe: ${sum}. ${sum} ÷ ${data.length} = ${mean}.`, difficulty);
      },
      () => {
        const red = randomInt(2, 6);
        const total = randomInt(red + 2, 12);
        const prob = `${red}/${total}`;
        return buildTask(topic,
          `In einem Beutel sind ${red} rote und ${total - red} blaue Kugeln. Wie groß ist die Wahrscheinlichkeit, eine rote zu ziehen?`,
          prob,
          `Günstige Ergebnisse: ${red}. Mögliche: ${total}. P = ${prob}.`, difficulty);
      },
      () => {
        const data = Array.from({ length: 7 }, () => randomInt(5, 30)).sort((a, b) => a - b);
        const median = data[3];
        return buildTask(topic,
          `Bestimme Median und Spannweite: ${data.join(", ")}`,
          `Median: ${median}, Spannweite: ${data[6] - data[0]}`,
          `Median (mittlerer Wert bei 7 Zahlen) = ${median}. Spannweite = ${data[6]} − ${data[0]} = ${data[6] - data[0]}.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const data = Array.from({ length: 8 }, () => randomInt(20, 80));
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = round(sum / data.length, 2);
        const sorted = [...data].sort((a, b) => a - b);
        const median = round((sorted[3] + sorted[4]) / 2, 1);
        return buildTask(topic,
          `Berechne Mittelwert und Median: ${data.join(", ")}`,
          `Mittelwert: ${mean}, Median: ${median}`,
          `Mittelwert: ${sum}/${data.length} = ${mean}. Sortiert: ${sorted.join(",")}. Median: (${sorted[3]}+${sorted[4]})/2 = ${median}.`, difficulty);
      },
      () => {
        const n = randomInt(3, 6);
        const prob1 = 1 / n;
        return buildTask(topic,
          `Du wählst zufällig eine von ${n} gleich wahrscheinlichen Optionen. Wie groß ist die Wahrscheinlichkeit, die richtige zu wählen? (Als Bruch und Prozent)`,
          `1/${n} ≈ ${round(100 / n, 1)}%`,
          `P = 1/${n} = ${round(100 / n, 1)}%.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 13. FUNKTIONEN / LINEARE FUNKTIONEN / GLEICHUNGSSYSTEME ---------- */

function generateFunctionTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const m = randomInt(1, 5);
        const b = randomInt(0, 8);
        const x = randomInt(1, 6);
        return buildTask(topic,
          `Berechne den y-Wert der Funktion y = ${m}x + ${b} für x = ${x}.`,
          m * x + b,
          `y = ${m} · ${x} + ${b} = ${m * x} + ${b} = ${m * x + b}.`, difficulty);
      },
      () => {
        const m = randomInt(1, 4);
        return buildTask(topic,
          `Eine Funktion hat die Gleichung y = ${m}x. Was ist die Steigung?`,
          m,
          `Bei y = ${m}x ist die Steigung m = ${m}.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const m = randomInt(-4, 4) || 1;
        const b = randomInt(-5, 5);
        const x = randomInt(-3, 5);
        return buildTask(topic,
          `Berechne y für y = ${m}x ${b >= 0 ? "+" : ""}${b} und x = ${x}.`,
          m * x + b,
          `y = ${m} · (${x}) + (${b}) = ${m * x} + ${b} = ${m * x + b}.`, difficulty);
      },
      () => {
        const m1 = randomInt(1, 3);
        const b1 = randomInt(-3, 3);
        const m2 = randomInt(-3, -1);
        const b2 = randomInt(2, 8);
        // Schnittunkt: m1*x + b1 = m2*x + b2 → x = (b2 - b1)/(m1 - m2)
        const xInt = (b2 - b1) / (m1 - m2);
        const yInt = m1 * xInt + b1;
        return buildTask(topic,
          `Wo schneiden sich y = ${m1}x + ${b1} und y = ${m2}x + ${b2}?`,
          `x = ${round(xInt, 2)}, y = ${round(yInt, 2)}`,
          `${m1}x + ${b1} = ${m2}x + ${b2} → x(${m1 - m2}) = ${b2 - b1} → x = ${round(xInt, 2)}, y = ${round(yInt, 2)}.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const m = randomInt(-5, 5) || 2;
        const b = randomInt(-8, 8);
        const x1 = randomInt(-3, 0);
        const x2 = randomInt(1, 5);
        return buildTask(topic,
          `Erstelle eine Wertetabelle für y = ${m}x ${b >= 0 ? "+" : ""}${b} mit x ∈ {${x1}, 0, ${x2}}.`,
          `x=${x1}→y=${m * x1 + b}; x=0→y=${b}; x=${x2}→y=${m * x2 + b}`,
          `Einsetzen: x=${x1}→${m * x1 + b}; x=0→${b}; x=${x2}→${m * x2 + b}.`, difficulty);
      },
      () => {
        const x = randomInt(1, 6);
        const y = randomInt(1, 6);
        const a1 = randomInt(1, 3);
        const b1 = randomInt(1, 3);
        const c1 = a1 * x + b1 * y;
        const a2 = randomInt(1, 3);
        const b2 = randomInt(1, 3);
        const c2 = a2 * x + b2 * y;
        return buildTask(topic,
          `Löse das Gleichungssystem:\n${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}`,
          `x = ${x}, y = ${y}`,
          `Durch Einsetzen oder Additionsverfahren erhält man x = ${x}, y = ${y}.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 14. POTENZEN / WURZELN / RATIONALE / REELLE ZAHLEN ---------- */

function generatePowerTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const base = randomInt(2, 6);
        const exp = randomInt(2, 4);
        const result = Math.pow(base, exp);
        return buildTask(topic, `Rechne: ${base}${exp === 2 ? "²" : exp === 3 ? "³" : `^${exp}`}`,
          result, `${base} hoch ${exp} = ${Array(exp).fill(base).join(" · ")} = ${result}.`, difficulty);
      },
      () => {
        const perfectSq = randomChoice([4, 9, 16, 25, 36, 49]);
        return buildTask(topic, `Berechne: √${perfectSq}`,
          Math.sqrt(perfectSq),
          `√${perfectSq} = ${Math.sqrt(perfectSq)}, denn ${Math.sqrt(perfectSq)}² = ${perfectSq}.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const base = randomInt(2, 10);
        const exp = randomInt(2, 5);
        return buildTask(topic, `Berechne: ${base}^${exp}`,
          Math.pow(base, exp),
          `${base}^${exp} = ${Array(exp).fill(base).join(" · ")} = ${Math.pow(base, exp)}.`, difficulty);
      },
      () => {
        const a = randomInt(2, 6);
        const b = randomInt(2, 4);
        return buildTask(topic,
          `Vereinfache: ${a}² · ${a}^${b}`,
          `${a}^${2 + b}`,
          `Gleicha Basis → Exponenten addieren: ${a}^(2+${b}) = ${a}^${2 + b} = ${Math.pow(a, 2 + b)}.`, difficulty);
      },
      () => {
        const sq = randomChoice([2, 3, 5, 7, 8, 12]);
        const result = round(Math.sqrt(sq), 3);
        return buildTask(topic,
          `Berechne √${sq} auf 2 Dezimalstellen gerundet.`,
          round(Math.sqrt(sq), 2),
          `√${sq} ≈ ${round(Math.sqrt(sq), 2)}.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const base = randomInt(2, 5);
        const exp1 = randomInt(3, 6);
        const exp2 = randomInt(1, exp1 - 1);
        return buildTask(topic,
          `Vereinfache: ${base}^${exp1} ÷ ${base}^${exp2}`,
          `${base}^${exp1 - exp2} = ${Math.pow(base, exp1 - exp2)}`,
          `Gleiche Basis → Exponenten subtrahieren: ${base}^(${exp1}−${exp2}) = ${base}^${exp1 - exp2} = ${Math.pow(base, exp1 - exp2)}.`, difficulty);
      },
      () => {
        const n = randomInt(-5, -1);
        const base = randomInt(2, 5);
        return buildTask(topic,
          `Was ist ${base}^(${n})?`,
          `1/${Math.pow(base, -n)}`,
          `Negativer Exponent: ${base}^(${n}) = 1/${base}^${-n} = 1/${Math.pow(base, -n)}.`, difficulty);
      },
      () => {
        const a = randomInt(2, 8);
        const b = randomInt(2, 8);
        return buildTask(topic,
          `Vereinfache: (${a} · ${b})²`,
          a * a * b * b,
          `(${a}·${b})² = ${a}² · ${b}² = ${a * a} · ${b * b} = ${a * a * b * b}.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ---------- 15. FLÄCHEN / VOLUMEN / KÖRPER (Spezifisch) ---------- */

function generateVolumeAreaTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const variants: Array<() => GeneratedTask> = [];

  if (difficulty === 1) {
    variants.push(
      () => {
        const l = randomInt(3, 10);
        const w = randomInt(2, 8);
        return buildTask(topic,
          `Berechne den Umfang eines Rechtecks mit l = ${l} cm, b = ${w} cm.`,
          2 * (l + w),
          `U = 2 · (l + b) = 2 · (${l} + ${w}) = ${2 * (l + w)} cm.`, difficulty);
      },
      () => {
        const s = randomInt(2, 10);
        return buildTask(topic,
          `Berechne die Fläche eines Quadrats mit Seite ${s} cm.`,
          s * s, `A = s² = ${s}² = ${s * s} cm².`, difficulty);
      },
      () => {
        const l = randomInt(2, 8);
        const w = randomInt(2, 8);
        const h = randomInt(2, 8);
        return buildTask(topic,
          `Berechne das Volumen eines Quaders: l = ${l} cm, b = ${w} cm, h = ${h} cm.`,
          l * w * h,
          `V = l · b · h = ${l} · ${w} · ${h} = ${l * w * h} cm³.`, difficulty);
      }
    );
  } else if (difficulty === 2) {
    variants.push(
      () => {
        const r = randomInt(2, 8);
        return buildTask(topic,
          `Berechne Umfang und Fläche eines Kreises mit r = ${r} cm. (π ≈ 3,14)`,
          `U ≈ ${round(2 * 3.14 * r, 2)} cm, A ≈ ${round(3.14 * r * r, 2)} cm²`,
          `U = 2πr = 2·3,14·${r} = ${round(2 * 3.14 * r, 2)} cm. A = πr² = 3,14·${r * r} = ${round(3.14 * r * r, 2)} cm².`, difficulty);
      },
      () => {
        const b = randomInt(4, 15);
        const h = randomInt(3, 12);
        const l = randomInt(4, 15);
        return buildTask(topic,
          `Berechne das Volumen eines Prismas mit dreieckiger Grundfläche (Grundseite ${b} cm, Höhe des Dreiecks ${h} cm) und Länge ${l} cm.`,
          round(b * h / 2 * l, 1),
          `V = A_Grundfläche · l = (${b}·${h}/2) · ${l} = ${b * h / 2} · ${l} = ${round(b * h / 2 * l, 1)} cm³.`, difficulty);
      },
      () => {
        const a = randomInt(3, 10);
        const b = randomInt(3, 10);
        const c = round(Math.sqrt(a * a + b * b), 2);
        return buildTask(topic,
          `Dreieck mit Katheten ${a} cm und ${b} cm. Berechne die Hypotenuse. (Satz des Pythagoras)`,
          c,
          `c² = ${a}² + ${b}² = ${a * a + b * b}. c = √${a * a + b * b} ≈ ${c} cm.`, difficulty);
      }
    );
  } else {
    variants.push(
      () => {
        const r = randomInt(2, 8);
        const h = randomInt(3, 12);
        return buildTask(topic,
          `Berechne das Volumen eines Zylinders mit r = ${r} cm und h = ${h} cm. (π ≈ 3,14)`,
          round(3.14 * r * r * h, 2),
          `V = π · r² · h = 3,14 · ${r}² · ${h} = 3,14 · ${r * r} · ${h} = ${round(3.14 * r * r * h, 2)} cm³.`, difficulty);
      },
      () => {
        const a = randomInt(4, 12);
        const h = randomInt(5, 15);
        return buildTask(topic,
          `Berechne das Volumen einer quadratischen Pyramide mit Grundseite ${a} cm und Höhe ${h} cm.`,
          round((a * a * h) / 3, 2),
          `V = (Grundfläche · h) / 3 = (${a}² · ${h}) / 3 = ${a * a * h} / 3 ≈ ${round((a * a * h) / 3, 2)} cm³.`, difficulty);
      },
      () => {
        const leg1 = randomInt(5, 15);
        const leg2 = randomInt(5, 15);
        const hyp = round(Math.sqrt(leg1 * leg1 + leg2 * leg2), 2);
        const area = round((leg1 * leg2) / 2, 2);
        const perim = round(leg1 + leg2 + hyp, 2);
        return buildTask(topic,
          `Rechtwinkliges Dreieck, Katheten: ${leg1} cm und ${leg2} cm. Berechne Hypotenuse, Fläche und Umfang.`,
          `c ≈ ${hyp} cm, A ≈ ${area} cm², U ≈ ${perim} cm`,
          `c = √(${leg1}²+${leg2}²) = ${hyp} cm. A = ${leg1}·${leg2}/2 = ${area} cm². U = ${leg1}+${leg2}+${hyp} = ${perim} cm.`, difficulty);
      }
    );
  }

  return randomChoice(variants)();
}

/* ======================================================
   ROUTER: generateSingleLocalTask
   ====================================================== */

function generateSingleLocalTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  const n = normalizeTopicName(topic);

  // Zahlen und Zahlenräume
  if (n.includes("zahl") || n.includes("zahlenraum") || n.includes("ordnen") ||
      n.includes("vergleich") || n.includes("ganze zahl") || n.includes("negative")) {
    return generateNumberTask(topic, difficulty);
  }

  // Addition
  if (n.includes("addition") || n.includes("plus") || n.includes("addier")) {
    return generateAdditionTask(topic, difficulty);
  }

  // Subtraktion
  if (n.includes("subtraktion") || n.includes("minus") || n.includes("subtrah") ||
      n.includes("ergänz")) {
    return generateSubtractionTask(topic, difficulty);
  }

  // Multiplikation
  if (n.includes("multiplikation") || n.includes("einmaleins") || n.includes("malreihen") ||
      n.includes("verdoppeln") || n.includes("produkt") || n.includes("faktor")) {
    return generateMultiplicationTask(topic, difficulty);
  }

  // Division
  if (n.includes("division") || n.includes("teilen") || n.includes("halbieren") ||
      n.includes("quotient") || n.includes("dividier")) {
    return generateDivisionTask(topic, difficulty);
  }

  // Brüche
  if (n.includes("bruch") || n.includes("brüche") || n.includes("zähler") ||
      n.includes("nenner") || n.includes("kürz") || n.includes("erweitern")) {
    return generateFractionTask(topic, difficulty);
  }

  // Prozent
  if (n.includes("prozent") || n.includes("rabatt") || n.includes("mehrwertsteuer") ||
      n.includes("prozentwert") || n.includes("grundwert")) {
    return generatePercentTask(topic, difficulty);
  }

  // Gleichungen / Terme / Variablen / Formeln / Gleichungssysteme
  if (n.includes("gleichung") || n.includes("term") || n.includes("variable") ||
      n.includes("formel") || n.includes("gleichungssystem") || n.includes("algebra")) {
    // Spezifisch: Gleichungssysteme → Funktionen-Generator
    if (n.includes("gleichungssystem") || n.includes("system")) {
      return generateFunctionTask(topic, difficulty);
    }
    return generateEquationTask(topic, difficulty);
  }

  // Funktionen / lineare Funktionen
  if (n.includes("funktion") || n.includes("steigung") || n.includes("linear") ||
      n.includes("parabel") || n.includes("achsenabschnitt")) {
    return generateFunctionTask(topic, difficulty);
  }

  // Potenzen / Wurzeln / rationale / reelle Zahlen
  if (n.includes("potenz") || n.includes("wurzel") || n.includes("exponent") ||
      n.includes("rational") || n.includes("reell") || n.includes("quadratwurzel")) {
    return generatePowerTask(topic, difficulty);
  }

  // Flächen / Volumen / Körper (spezifischer Block)
  if (n.includes("volumen") || n.includes("körper") || n.includes("zylinder") ||
      n.includes("pyramide") || n.includes("prisma") || n.includes("kegel") ||
      n.includes("kugel") || n.includes("würfel") || n.includes("quader")) {
    return generateVolumeAreaTask(topic, difficulty);
  }

  // Geometrie allgemein (Fläche, Umfang, Kreis, Dreieck, Rechteck, Winkel, Pythagoras)
  if (n.includes("geometrie") || n.includes("rechteck") || n.includes("dreieck") ||
      n.includes("fläche") || n.includes("umfang") || n.includes("winkel") ||
      n.includes("kreis") || n.includes("viereck") || n.includes("pythagoras")) {
    return generateGeometryTask(topic, difficulty);
  }

  // Größen und Maße / Maßeinheiten / Uhrzeit / Geld / Gewichte / Längen / Zeitspannen
  if (n.includes("maß") || n.includes("größen") || n.includes("länge") ||
      n.includes("gewicht") || n.includes("uhrzeit") || n.includes("geld") ||
      n.includes("zeitspann") || n.includes("maßeinheit") || n.includes("kilometer") ||
      n.includes("meter") || n.includes("kilogramm") || n.includes("cent") ||
      n.includes("euro") || n.includes("minute") || n.includes("stunde")) {
    return generateMeasureTask(topic, difficulty);
  }

  // Sachaufgaben / Textaufgaben
  if (n.includes("sachaufgabe") || n.includes("textaufgabe") || n.includes("anwendung")) {
    return generateWordProblemTask(topic, difficulty);
  }

  // Daten und Zufall
  if (n.includes("daten") || n.includes("zufall") || n.includes("wahrscheinlichkeit") ||
      n.includes("statistik") || n.includes("mittelwert") || n.includes("median") ||
      n.includes("diagramm")) {
    return generateDataTask(topic, difficulty);
  }

  // Fallback: Mischung aus den Grundrechenarten
  const fallbackGenerators = [
    () => generateAdditionTask(topic, difficulty),
    () => generateSubtractionTask(topic, difficulty),
    () => generateMultiplicationTask(topic, difficulty),
    () => generateDivisionTask(topic, difficulty),
  ];
  return randomChoice(fallbackGenerators)();
}

/* ======================================================
   ÖFFENTLICHE EXPORTFUNKTIONEN
   ====================================================== */

export function generateLocalTask(topic: string, difficulty: DifficultyLevel): GeneratedTask {
  return generateSingleLocalTask(topic, difficulty);
}


export function generateLocalTasks(
  topic: string,
  difficulty: DifficultyLevel,
  count = 5
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  let attempts = 0;
  const maxAttempts = count * 5;

  while (tasks.length < count && attempts < maxAttempts) {
    tasks.push(generateSingleLocalTask(topic, difficulty));
    const uniqueTasks = deduplicateTasks(tasks);
    tasks.length = 0;
    tasks.push(...uniqueTasks);
    attempts += 1;
  }

  return tasks.slice(0, count);
}

/* ======================================================
   OLLAMA / KI-HELFER
   ====================================================== */

/* ======================================================
   HAUPTFUNKTIONEN
   ====================================================== */

export async function buildPlacementTest(
  topicConfidence: TopicConfidence[],
  totalTasks = 8
): Promise<GeneratedTask[]> {
  const safeTopics = topicConfidence.filter(
    (item) =>
      typeof item.topic === "string" &&
      item.topic.trim().length > 0 &&
      Number.isFinite(item.confidence)
  );

  if (safeTopics.length === 0) {
    return generateLocalTasks("Addition", 1, totalTasks);
  }

  const shuffledTopics = shuffleArray(safeTopics);
  const tasks: GeneratedTask[] = [];

  for (let i = 0; i < totalTasks; i += 1) {
    const topicEntry = shuffledTopics[i % shuffledTopics.length];
    const difficulty = clampDifficulty(
      topicEntry.confidence <= 2 ? 1 : topicEntry.confidence >= 5 ? 3 : 2
    );
    tasks.push(generateSingleLocalTask(topicEntry.topic, difficulty));
  }

  return deduplicateTasks(tasks).slice(0, totalTasks);
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractJSONArray(text: string): string | null {
  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    return null;
  }
  return text.slice(firstBracket, lastBracket + 1);
}

function coerceGeneratedTaskArray(
  raw: unknown,
  fallbackTopic: string,
  fallbackDifficulty: DifficultyLevel
): GeneratedTask[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const candidate = item as Record<string, unknown>;

      const question =
        typeof candidate.question === "string" ? candidate.question.trim() : "";

      const correctAnswer =
        typeof candidate.correctAnswer === "string"
          ? candidate.correctAnswer.trim()
          : typeof candidate.answer === "string"
          ? candidate.answer.trim()
          : typeof candidate.correct_answer === "string"
          ? candidate.correct_answer.trim()
          : "";

      const explanation =
        typeof candidate.explanation === "string" && candidate.explanation.trim().length > 0
          ? candidate.explanation.trim()
          : "Löse die Aufgabe Schritt für Schritt.";

      const topic =
        typeof candidate.topic === "string" && candidate.topic.trim().length > 0
          ? candidate.topic.trim()
          : fallbackTopic;

      const category =
        typeof candidate.category === "string" && candidate.category.trim().length > 0
          ? candidate.category.trim()
          : topic;

      const difficulty =
        typeof candidate.difficulty === "number"
          ? clampDifficulty(candidate.difficulty)
          : fallbackDifficulty;

      const normalized: GeneratedTask = {
        question,
        correctAnswer,
        explanation,
        topic,
        category,
        difficulty,
      };

      return isTaskUsable(normalized) ? normalized : null;
    })
    .filter((item): item is GeneratedTask => item !== null);
}

async function generateTasksWithOllama(
  topic: string,
  difficulty: DifficultyLevel,
  count: number
): Promise<GeneratedTask[]> {
  const prompt = `
Erstelle ${count} Mathe-Aufgaben als JSON-Array.
Thema: ${topic}
Schwierigkeit: ${difficulty} (1=leicht, 2=mittel, 3=schwer)

WICHTIG:
- Nur gültiges JSON zurückgeben
- Format:
[
  {
    "question": "...",
    "correctAnswer": "...",
    "explanation": "...",
    "topic": "${topic}",
    "category": "${topic}",
    "difficulty": ${difficulty}
  }
]
- Keine Kommentare
- Keine Markdown-Codeblöcke
- Fachlich korrekt
- Schülergerecht
- Unterschiedliche Aufgaben
- Variiere den Aufgabentyp (Rechenaufgabe, Lückenaufgabe, Sachkontext, Umkehraufgabe)
`;

  try {
    const response = await fetchWithTimeout(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
        }),
      },
      8000
    );

    if (!response.ok) {
      console.warn(`Ollama request failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();

    const rawText =
      typeof data?.response === "string"
        ? data.response
        : typeof data?.message?.content === "string"
        ? data.message.content
        : "";

    if (!rawText) return [];

    const extracted = extractJSONArray(rawText);
    if (!extracted) return [];

    try {
      const parsed = JSON.parse(extracted);
      return coerceGeneratedTaskArray(parsed, topic, difficulty);
    } catch (error) {
      console.warn("Ollama JSON parse error. Falling back to local tasks.", error);
      return [];
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(
        "Ollama request timed out or was aborted. Falling back to local task generation."
      );
      return [];
    }

    console.warn("Ollama training generation failed. Falling back to local tasks.", error);
    return [];
  }
}

type TopicBucket = {
  category: string;
  level: DifficultyLevel;
  count: number;
};

function buildTopicBuckets(
  topicLevels: TopicLevelInput[],
  totalTasks: number
): TopicBucket[] {
  const safeTopics = topicLevels.filter(
    (item) =>
      typeof item.category === "string" &&
      item.category.trim().length > 0 &&
      typeof item.level === "number"
  );

  if (safeTopics.length === 0) {
    return [];
  }

  const limitedTopics = safeTopics.slice(0, totalTasks);
  const map = new Map<string, TopicBucket>();

  for (const item of limitedTopics) {
    const category = item.category.trim();
    const level = clampDifficulty(item.level);
    const key = `${category}__${level}`;

    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        category,
        level,
        count: 1,
      });
    }
  }

  return Array.from(map.values());
}

export async function buildTrainingUnit(
  topicLevels: TopicLevelInput[],
  totalTasks = 8
): Promise<GeneratedTask[]> {
  const safeTotalTasks = Math.max(1, totalTasks || 8);
  const buckets = buildTopicBuckets(topicLevels, safeTotalTasks);

  if (buckets.length === 0) {
    return generateLocalTasks("Addition", 1, safeTotalTasks);
  }

  const generatedGroups = await Promise.all(
    buckets.map(async (bucket) => {
      let generated = await generateTasksWithOllama(
        bucket.category,
        bucket.level,
        bucket.count
      );

      if (generated.length === 0) {
        generated = generateLocalTasks(bucket.category, bucket.level, bucket.count);
      }

      return generated;
    })
  );

  const allTasks = generatedGroups.flat();

  let deduplicated = deduplicateTasks(allTasks);

  if (deduplicated.length < safeTotalTasks) {
    const fallbackTopic = buckets[0];

    const missingCount = safeTotalTasks - deduplicated.length;
    const extraLocalTasks = generateLocalTasks(
      fallbackTopic.category,
      fallbackTopic.level,
      missingCount + 3
    );

    deduplicated = deduplicateTasks([...deduplicated, ...extraLocalTasks]);
  }

  return deduplicated.slice(0, safeTotalTasks);
}

export function buildAdaptiveTrainingUnit(
  topicLevels: { category: string; level: DifficultyLevel }[],
  totalTasks: number = 8
): GeneratedTask[] {
  if (topicLevels.length === 0) return [];

  // schwächste Themen zuerst
  const sorted = [...topicLevels].sort((a, b) => a.level - b.level);

  const tasks: GeneratedTask[] = [];

  // Fokus auf schwächere Themen
  for (const topic of sorted) {
    const amount = topic.level === 1 ? 4 : topic.level === 2 ? 3 : 2;

    const generated = generateLocalTasks(
      topic.category,
      topic.level as DifficultyLevel,
      amount
    );

    tasks.push(...generated);

    if (tasks.length >= totalTasks) break;
  }

  return deduplicateTasks(tasks).slice(0, totalTasks);
}

export function buildWeeklyTrainingPlan(trainingFrequency: number): TrainingSession[] {
  const safeFrequency = Math.max(1, Math.min(5, trainingFrequency || 3));
  const today = new Date();
  const sessions: TrainingSession[] = [];

  for (let i = 1; i <= safeFrequency; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i * 2);

    sessions.push({
      id: `${date.toISOString()}-${i}`,
      date: date.toISOString().slice(0, 10),
      weekdayLabel: WEEKDAY_LABELS[date.getDay()],
      completed: false,
      completedAt: null,
      scorePercent: null,
    });
  }

  return sessions;
}
export function getFeedbackForAnswer(
  userAnswer: string,
  correctAnswer: string,
  explanation: string
) {
  const normalizedUser = userAnswer.trim().replace(",", ".").toLowerCase();
  const normalizedCorrect = correctAnswer.trim().replace(",", ".").toLowerCase();

  const isCorrect = normalizedUser === normalizedCorrect;

  if (isCorrect) {
    return {
      isCorrect: true,
      shortFeedback: "Richtig beantwortet.",
      detailedFeedback: explanation,
    };
  }

  let hint = "Schau dir den Rechenweg noch einmal Schritt für Schritt an.";

  const userNumber = Number(normalizedUser);
  const correctNumber = Number(normalizedCorrect);

  if (!Number.isNaN(userNumber) && !Number.isNaN(correctNumber)) {
    const difference = Math.abs(userNumber - correctNumber);

    if (difference === 1) {
      hint = "Du warst sehr nah dran. Prüfe noch einmal ein kleines Rechendetail.";
    } else if (difference > 1) {
      hint = "Die Antwort weicht deutlicher ab. Kontrolliere den gesamten Rechenweg.";
    }
  }

  if (!normalizedUser) {
    hint = "Es wurde keine gültige Antwort erkannt.";
  }

  return {
    isCorrect: false,
    shortFeedback: `Nicht ganz. Die richtige Antwort ist: ${correctAnswer}`,
    detailedFeedback: `${hint}\n\nErklärung: ${explanation}`,
  };
}
