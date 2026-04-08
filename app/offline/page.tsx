export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 text-5xl">📶</div>
        <h1 className="text-3xl font-bold tracking-tight">Du bist gerade offline</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Sobald wieder eine Internetverbindung besteht, kannst du MatheTrainer wie
          gewohnt weiterverwenden.
        </p>
      </div>
    </main>
  );
}
