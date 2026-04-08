"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage("Login fehlgeschlagen: " + error.message);
        return;
      }

      setMessage("Login erfolgreich. Du wirst weitergeleitet...");
      router.push("/dashboard");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setErrorMessage("Unerwarteter Fehler beim Login.");
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
                Willkommen zurück.
                <br />
                Weiter lernen.
              </h1>
              <p className="mt-5 max-w-md text-lg text-gray-300">
                Logge dich ein und mach mit deinem persönlichen Lernpfad,
                Diagnoseverlauf und Training weiter.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-gray-300">Mit deinem Konto kannst du</p>
              <div className="mt-4 space-y-3 text-sm text-white">
                <p>• deinen Fortschritt speichern</p>
                <p>• gezielt nach Themen trainieren</p>
                <p>• dein Niveau im Dashboard verfolgen</p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 md:p-12">
            <p className="text-sm font-medium text-gray-500">Login</p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              In dein Konto einloggen
            </h2>
            <p className="mt-3 text-gray-600">
              Gib deine E-Mail und dein Passwort ein, um weiterzulernen.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
                  placeholder="Dein Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-black px-6 py-4 text-base font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Bitte warten..." : "Einloggen"}
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
              Noch kein Konto?{" "}
              <Link
                href="/register"
                className="font-medium text-black underline underline-offset-4"
              >
                Jetzt registrieren
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}