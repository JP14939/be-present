import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full space-y-10">

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-stone-800">Be Present</h1>
          <p className="text-stone-500 text-base leading-relaxed">
            A focus app with a twist — your plant&apos;s health reflects how well you stay on task.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-stone-700">How it works</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Set a deep work timer and put your phone down. Every time you leave the app mid-session, your plant takes damage. Stay focused and it thrives.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-stone-700">Points &amp; garden</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Complete a session without leaving and you earn points. Spend them in your hobby garden to grow new plants.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-stone-700">The goal</p>
            <p className="text-sm text-stone-500 leading-relaxed">
              Build the habit of single-tasking. One session at a time.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full text-center py-3 rounded-xl bg-stone-800 text-white font-medium hover:bg-stone-700 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            className="w-full text-center py-3 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-100 transition-colors"
          >
            Go to my dashboard
          </Link>
        </div>

      </div>
    </main>
  )
}
