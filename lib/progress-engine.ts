import { supabase } from "@/lib/supabase";

export type TopicProgressRow = {
  id?: string;
  user_id: string;
  category: string;
  level: 1 | 2 | 3;
  total_answered: number;
  total_correct: number;
  accuracy: number;
  last_practiced_at: string | null;
  updated_at?: string | null;
};

export type TopicAnswerResult = {
  category: string;
  isCorrect: boolean;
};

function clampLevel(level: number): 1 | 2 | 3 {
  if (level <= 1) return 1;
  if (level >= 3) return 3;
  return level as 1 | 2 | 3;
}

function roundAccuracy(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function calculateUpdatedTopicProgress(
  current: TopicProgressRow,
  results: TopicAnswerResult[]
): TopicProgressRow {
  const relevantResults = results.filter(
    (result) => result.category === current.category
  );

  if (relevantResults.length === 0) {
    return {
      ...current,
      updated_at: new Date().toISOString(),
    };
  }

  const answeredNow = relevantResults.length;
  const correctNow = relevantResults.filter((item) => item.isCorrect).length;

  const totalAnswered = current.total_answered + answeredNow;
  const totalCorrect = current.total_correct + correctNow;
  const accuracy =
    totalAnswered > 0 ? roundAccuracy(totalCorrect / totalAnswered) : 0;

  let nextLevel = current.level;

  if (totalAnswered >= 10) {
    if (accuracy >= 0.85) {
      nextLevel = clampLevel(current.level + 1);
    } else if (accuracy <= 0.5) {
      nextLevel = clampLevel(current.level - 1);
    }
  }

  return {
    ...current,
    level: nextLevel,
    total_answered: totalAnswered,
    total_correct: totalCorrect,
    accuracy,
    last_practiced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function getTopicProgress(userId: string, category: string) {
  const { data, error } = await supabase
    .from("TopicLevel")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category)
    .maybeSingle();

  if (error) {
    throw new Error(`Fehler beim Laden von TopicLevel: ${error.message}`);
  }

  return data as TopicProgressRow | null;
}

export async function getAllTopicProgress(userId: string) {
  const { data, error } = await supabase
    .from("TopicLevel")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Fehler beim Laden aller Themenlevels: ${error.message}`);
  }

  return (data ?? []) as TopicProgressRow[];
}

export async function updateTopicProgressRow(row: TopicProgressRow) {
  const { error } = await supabase
    .from("TopicLevel")
    .update({
      level: row.level,
      total_answered: row.total_answered,
      total_correct: row.total_correct,
      accuracy: row.accuracy,
      last_practiced_at: row.last_practiced_at,
      updated_at: row.updated_at ?? new Date().toISOString(),
    })
    .eq("user_id", row.user_id)
    .eq("category", row.category);

  if (error) {
    throw new Error(`Fehler beim Aktualisieren von TopicLevel: ${error.message}`);
  }
}

export async function applyTrainingResultsToTopicLevels(
  userId: string,
  results: TopicAnswerResult[]
) {
  const allProgress = await getAllTopicProgress(userId);

  for (const row of allProgress) {
    const updatedRow = calculateUpdatedTopicProgress(row, results);
    await updateTopicProgressRow(updatedRow);
  }
}