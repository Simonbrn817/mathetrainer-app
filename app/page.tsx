"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type HomeUser = {
  id: string;
  email: string | null;
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

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<HomeUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadUser() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          if (!isActive) return;
          setErrorMessage("Fehler beim Laden des Nutzers: " + error.message);
          setLoading(false);
          return;
        }

        if (!isActive) return;

        setUser(
          authUser
            ? {
                id: authUser.id,
                email: authUser.email ?? null,
              }
            : null
        );
      } catch (error) {
        console.error("HOME PAGE ERROR:", error);
        if (!isActive) return;
        setErrorMessage("Unerwarteter Fehler auf der Startseite.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? null,
            }
          : null
      );
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    setErrorMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage("Fehler beim Logout: " + error.message);
      return;
    }

    clearSetupStorage();
    setUser(null);
  }

  const primaryHref = user ? "/dashboard" : "/register";
  const primaryLabel = loading
    ? "Lädt..."
    : user
    ? "Zum Dashboard"
    : "Mit Diagnose starten";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 text-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-6 md:px-8">
        <header className="sticky top-0 z-20 mb-8 rounded-3xl border border-gray-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-base font-bold text-white">
                M
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight">MatheTrainer</p>
                <p className="text-sm text-gray-500">
                  Diagnose, Lernpfad und gezieltes Training
                </p>
              </div>
            </div>

            {user ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="text-sm text-gray-600">
                  Eingeloggt{user.email ? ` als ${user.email}` : ""}
                </span>

                <Link
                  href="/dashboard"
                  className="rounded-2xl bg-black px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Zum Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium transition hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-center text-sm font-medium transition hover:bg-gray-50"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-2xl bg-black px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </header>

        <section className="grid items-center gap-12 py-10 md:grid-cols-2 md:py-20">
          <div>
            <p className="inline-flex rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
              Gezielt lernen statt planlos üben
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Finde deine Mathelücken
              <br />
              und trainiere genau
              <br />
              das, was du wirklich brauchst.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Starte mit einer kurzen Diagnose, erhalte deinen persönlichen
              Lernpfad und übe genau die Themen, die dich Schritt für Schritt
              wirklich weiterbringen.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:bg-gray-800"
              >
                {primaryLabel}
              </Link>

              <a
                href="#so-funktionierts"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-6 py-4 text-base font-semibold text-gray-800 transition hover:bg-gray-100"
              >
                So funktioniert&apos;s
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-semibold text-gray-900">
                  Kurze Diagnose
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Schnell erkennen, wo du stehst.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-semibold text-gray-900">
                  Persönlicher Lernpfad
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Passende Aufgaben statt Zufall.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm font-semibold text-gray-900">
                  Sichtbarer Fortschritt
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Du siehst, was du bereits geschafft hast.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-600">
              <span className="rounded-full border border-gray-200 bg-white px-4 py-2">
                Individuelle Aufgaben
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-4 py-2">
                Klarer nächster Schritt
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-4 py-2">
                Schrittweiser Aufbau
              </span>
            </div>

            {errorMessage && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="rounded-[36px] bg-black p-6 text-white shadow-2xl md:p-8">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Dein persönlicher Lernbereich
                  </p>
                  <h2 className="mt-2 text-2xl font-bold leading-tight">
                    So könnte dein Mathe-Training aussehen
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Personalisiert
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-white p-4 text-gray-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Aktuelles Thema
                      </p>
                      <h3 className="mt-1 text-lg font-bold">Bruchrechnen</h3>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Fokus
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    Du bist bei den Grundlagen schon sicher. Jetzt trainierst du
                    gezielt das Kürzen und Vergleichen von Brüchen.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-300">
                      Fortschritt
                    </p>
                    <p className="mt-2 text-3xl font-bold">68%</p>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-2 w-[68%] rounded-full bg-white"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-300">
                      Bereits viel geschafft
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-300">
                      Nächster Schritt
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      5 passende Aufgaben lösen
                    </p>
                    <p className="mt-2 text-sm text-gray-300">
                      Direkt abgestimmt auf dein aktuelles Niveau
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-300">
                        Lernpfad
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        Dein Weg in 3 Schritten
                      </h3>
                    </div>
                    <span className="text-xs text-gray-400">
                      Klar strukturiert
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Diagnose abgeschlossen
                        </p>
                        <p className="text-xs text-gray-300">
                          Ausgangspunkt erkannt
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Lücken identifiziert
                        </p>
                        <p className="text-xs text-gray-300">
                          Schwerpunkt auf Bruchrechnen
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Gezieltes Training
                        </p>
                        <p className="text-xs text-gray-300">
                          Passende Aufgaben als Nächstes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-300">
                      Vorteil
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      Kein planloses Üben mehr
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-300">
                      Ziel
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      Schritt für Schritt sicherer werden
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="so-funktionierts" className="py-12">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              So funktioniert&apos;s
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              In 3 klaren Schritten zu deinem persönlichen Lernpfad
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Du startest nicht mit zufälligen Aufgaben, sondern mit einer
              sinnvollen Reihenfolge: erst einschätzen, dann verstehen, dann
              gezielt trainieren.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-lg font-bold text-white">
                1
              </div>
              <h3 className="mt-5 text-2xl font-bold">Diagnose starten</h3>
              <p className="mt-4 text-gray-600">
                Wähle Klasse, Alter und Themen aus, damit dein Lernstart zu
                deinem aktuellen Stand passt.
              </p>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-lg font-bold text-white">
                2
              </div>
              <h3 className="mt-5 text-2xl font-bold">Niveau testen</h3>
              <p className="mt-4 text-gray-600">
                Ein kurzer Test zeigt, was du schon sicher kannst und wo du noch
                Unterstützung brauchst.
              </p>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-lg font-bold text-white">
                3
              </div>
              <h3 className="mt-5 text-2xl font-bold">Gezielt trainieren</h3>
              <p className="mt-4 text-gray-600">
                Du bekommst passende Aufgaben, einen klaren Lernweg und
                sichtbaren Fortschritt statt Zufall.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Warum MatheTrainer?
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Weil gutes Lernen Struktur braucht
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Mathe wird leichter, wenn du nicht alles gleichzeitig übst,
              sondern genau dort anfängst, wo es für dich sinnvoll ist.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Individuell</p>
              <h3 className="mt-3 text-2xl font-bold">
                Passende Aufgaben statt Standardübungen
              </h3>
              <p className="mt-4 text-gray-600">
                Deine Aufgaben orientieren sich an deinem aktuellen Niveau und
                an den Themen, die für dich wirklich relevant sind.
              </p>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Strukturiert</p>
              <h3 className="mt-3 text-2xl font-bold">
                Ein klarer nächster Schritt
              </h3>
              <p className="mt-4 text-gray-600">
                Statt planlos Aufgaben zu lösen, arbeitest du mit einem
                nachvollziehbaren Lernpfad, der dich Schritt für Schritt
                weiterführt.
              </p>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Motivierend</p>
              <h3 className="mt-3 text-2xl font-bold">
                Fortschritt, den du wirklich siehst
              </h3>
              <p className="mt-4 text-gray-600">
                Du erkennst, was du geschafft hast, wo du besser geworden bist
                und welches Thema als Nächstes sinnvoll ist.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Für wen?
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                Für Schüler:innen, die gezielter lernen wollen
              </h2>
              <p className="mt-4 text-gray-600">
                Besonders hilfreich ist MatheTrainer für alle, die in Mathe
                nicht einfach mehr machen wollen, sondern das Richtige.
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  Wenn du oft nicht weißt, wo du anfangen sollst
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  Wenn du Lücken aus früheren Themen schließen willst
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  Wenn du strukturiert statt planlos üben möchtest
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Was bringt es?
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                Mehr Klarheit, mehr Struktur, mehr Sicherheit
              </h2>
              <p className="mt-4 text-gray-600">
                Gute Lernplattformen nehmen nicht nur Aufgaben ab, sondern auch
                Unsicherheit. Genau darin liegt hier die Stärke.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-black p-4 text-white">
                  <p className="text-sm text-gray-300">Klarheit</p>
                  <p className="mt-2 font-semibold">
                    Du weißt, woran du arbeiten solltest
                  </p>
                </div>
                <div className="rounded-2xl bg-black p-4 text-white">
                  <p className="text-sm text-gray-300">Fokus</p>
                  <p className="mt-2 font-semibold">
                    Du trainierst nicht mehr ins Blaue hinein
                  </p>
                </div>
                <div className="rounded-2xl bg-black p-4 text-white">
                  <p className="text-sm text-gray-300">Motivation</p>
                  <p className="mt-2 font-semibold">
                    Fortschritt wird sichtbar und greifbar
                  </p>
                </div>
                <div className="rounded-2xl bg-black p-4 text-white">
                  <p className="text-sm text-gray-300">Sicherheit</p>
                  <p className="mt-2 font-semibold">
                    Du arbeitest Schritt für Schritt sauber auf
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Häufige Fragen
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Kurz erklärt
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">
                Muss ich sofort alles wissen?
              </h3>
              <p className="mt-3 text-gray-600">
                Nein. Genau dafür ist die Diagnose da. Sie hilft dir
                einzuschätzen, wo du stehst und was der beste nächste Schritt
                ist.
              </p>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">
                Ist das nur für starke Schüler:innen?
              </h3>
              <p className="mt-3 text-gray-600">
                Nein. Gerade wenn du Lücken hast oder oft nicht weißt, wo du
                anfangen sollst, ist die strukturierte Herangehensweise
                besonders hilfreich.
              </p>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">
                Was ist der Unterschied zu normalem Üben?
              </h3>
              <p className="mt-3 text-gray-600">
                Du bekommst nicht einfach irgendwelche Aufgaben, sondern
                passende Aufgaben auf Basis deines aktuellen Niveaus und deiner
                Themen.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="rounded-[36px] bg-gradient-to-r from-black to-gray-800 px-8 py-12 text-white md:px-12">
            <p className="text-sm font-medium text-gray-300">
              Bereit loszulegen?
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Starte jetzt mit deinem persönlichen Mathe-Lernpfad
            </h2>
            <p className="mt-4 max-w-2xl text-gray-300">
              Melde dich an, starte deine Diagnose und beginne direkt mit den
              Aufgaben, die wirklich zu deinem Niveau passen.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-base font-semibold text-black transition hover:bg-gray-100"
              >
                {user ? "Zum Dashboard" : "Kostenlos registrieren"}
              </Link>

              {!user && (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/20"
                >
                  Ich habe schon ein Konto
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}