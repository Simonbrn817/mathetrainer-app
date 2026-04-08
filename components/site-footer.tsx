import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
                M
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Mathe-Plattform
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-600">
              Individuelles Mathe-Training mit Diagnose, Ausgangstest,
              Lernpfad und Fortschrittsübersicht im Dashboard.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Navigation</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600">
              <Link href="/landing" className="hover:text-black">
                Landing Page
              </Link>
              <Link href="/login" className="hover:text-black">
                Login / Registrierung
              </Link>
              <Link href="/dashboard" className="hover:text-black">
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Warum diese Plattform?</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600">
              <p>• Passende Aufgaben nach Themenbereich</p>
              <p>• Schritt-für-Schritt Lernpfad</p>
              <p>• Sichtbarer Fortschritt im Dashboard</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Mathe-Plattform</p>
          <p>Mit Next.js, Tailwind und Supabase gebaut.</p>
        </div>
      </div>
    </footer>
  );
}