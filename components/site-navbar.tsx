import Link from "next/link";

export default function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white/85 px-6 py-4 shadow-sm backdrop-blur">
          <Link href="/landing" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
              M
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Mathe-Plattform
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#funktionen" className="text-sm font-medium text-gray-600 hover:text-black">
              Funktionen
            </a>
            <a href="#ablauf" className="text-sm font-medium text-gray-600 hover:text-black">
              Ablauf
            </a>
            <a href="#vorteile" className="text-sm font-medium text-gray-600 hover:text-black">
              Vorteile
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
            >
              Login
            </Link>

            <Link
              href="/login"
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Jetzt starten
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}