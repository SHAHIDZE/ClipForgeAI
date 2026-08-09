import Navbar from "../components/Navbar";
import UploadBox from "../components/UploadBox";
import StatCard from "../components/StatCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
        {/* HEADER */}
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold text-violet-400">
            Dashboard
          </p>

          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Welcome to ClipForge AI
          </h1>

          <p className="mt-2 max-w-2xl text-zinc-400">
            Turn long videos into engaging short-form content with AI.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Projects" value="12" />
          <StatCard title="Videos" value="89" />
          <StatCard title="Minutes" value="421" />
          <StatCard title="AI Score" value="96%" />
        </div>

        {/* GENERATOR */}
        <section className="mt-10 rounded-3xl border border-zinc-800 bg-[#111113] p-5 shadow-2xl shadow-black/20 md:p-8">
          <UploadBox />
        </section>
      </main>
    </div>
  );
}