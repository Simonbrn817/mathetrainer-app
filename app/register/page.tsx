"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/dashboard");
      }
    }

    checkSession();
  }, [router]);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setMessage("");

    if (password.length < 6) {
      setErrorMessage("Das Passwort muss mindestens 6 Zeichen lang sein.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Die Passwörter stimmen nicht überein.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage("Registrierung fehlgeschlagen: " + error.message);
        return;
      }

      if (data.session) {
        setMessage("Registrierung erfolgreich. Du wirst weitergeleitet...");
        router.push("/dashboard");
        return;
      }

      setMessage(
        "Registrierung erfolgreich. Bitte prüfe deine E-Mails und bestätige dein Konto, falls die E-Mail-Bestätigung in Supabase aktiviert ist."
      );
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setErrorMessage("Unerwarteter Fehler bei der Registrierung.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-xl md:grid-cols-2">
          <div className="hidden bg-black p-10 text-white md:flex md:flex-col md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
                Mathe-Plattform
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-tight">
                Neues Konto.
                <br />
                Neuer Lernstart.
              </h1>
              <p className="mt-5 max-w-md text-lg text-gray-300">
                Erstelle dein Konto und starte mit Diagnose, Lernpfad und
                individuellem Mathe-Training.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-gray-300">Nach der Registrierung</p>
              <div className="mt-4 space-y-3 text-sm text-white">
                <p>• startest du mit deiner Diagnose</p>
                <p>• erhältst passende Aufgaben</p>
                <p>• siehst deinen Fortschritt im Dashboard</p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 md:p-12">
            <p className="text-sm font-medium text-gray-500">Registrierung</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Konto erstellen
            </h2>
            <p className="mt-3 text-gray-600">
              Registriere dich mit deiner E-Mail und lege ein Passwort fest.
            </p>

            <form onSubmit={handleRegister} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  E-Mail
                </label>
                <input
                  type="email"
                  placeholder="deine@email.at"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Passwort
                </label>
                <input
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Passwort wiederholen
                </label>
                <input
                  type="password"
                  placeholder="Passwort erneut eingeben"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-black px-6 py-4 text-base font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Bitte warten..." : "Registrieren"}
              </button>
            </form>

            {message && (
              <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="mt-8 text-sm text-gray-600">
              Schon ein Konto?{" "}
              <Link
                href="/login"
                className="font-medium text-black underline underline-offset-4"
              >
                Jetzt einloggen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}