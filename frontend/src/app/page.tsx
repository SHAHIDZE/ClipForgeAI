"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clapperboard,
  Film,
  Languages,
  Play,
  Scissors,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Sparkles,
    title: "AI Highlight Detection",
    description:
      "ClipForge analyzes your video and finds the moments with the strongest hooks, stories and engagement potential.",
  },
  {
    icon: WandSparkles,
    title: "Smart Captions",
    description:
      "Create dynamic captions with multiple styles, animated words and highlighted keywords.",
  },
  {
    icon: Clapperboard,
    title: "Auto Reframe",
    description:
      "Turn landscape footage into social-ready vertical videos while keeping the important subject in frame.",
  },
  {
    icon: Scissors,
    title: "AI Editing",
    description:
      "Trim clips, remove unnecessary parts, adjust framing and polish your content inside the editor.",
  },
  {
    icon: Languages,
    title: "Multi-language",
    description:
      "Build content for different audiences with multilingual transcription and captions.",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description:
      "Heavy video processing happens in the background while you continue working in ClipForge.",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload",
    description: "Upload a long video or bring your source into ClipForge.",
  },
  {
    number: "02",
    title: "AI analyzes",
    description:
      "Our pipeline transcribes the video and understands its most important moments.",
  },
  {
    number: "03",
    title: "Generate clips",
    description:
      "ClipForge selects strong moments and turns them into short-form videos.",
  },
  {
    number: "04",
    title: "Edit & export",
    description:
      "Choose captions, polish the clip and export it for your favorite platform.",
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    description: "Try ClipForge and create your first clips.",
    features: [
      "Starter AI credits",
      "AI highlight detection",
      "Basic captions",
      "720p export",
    ],
  },
  {
    name: "Pro",
    price: "$9",
    description: "For creators who publish consistently.",
    popular: true,
    features: [
      "100 shorts / month",
      "Advanced AI selection",
      "Animated captions",
      "1080p export",
      "AI Editor",
    ],
  },
  {
    name: "Business",
    price: "$29",
    description: "For teams and high-volume creators.",
    features: [
      "500 shorts / month",
      "Priority processing",
      "All caption styles",
      "Advanced editor",
      "100 GB storage",
    ],
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
  });
}

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070709] text-white">
      {/* ============================================================
          NAVBAR
      ============================================================ */}

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#070709]/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          {/* LOGO */}

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-lg shadow-violet-950/40">
              <div className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />

              <span className="relative text-lg font-black">C</span>
            </div>

            <div className="text-left">
              <div className="text-[15px] font-black tracking-tight">
                ClipForge
                <span className="text-violet-400"> AI</span>
              </div>

              <div className="text-[8px] font-bold uppercase tracking-[0.24em] text-zinc-600">
                Video Intelligence
              </div>
            </div>
          </button>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              Features
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("workflow")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              How it works
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              Pricing
            </button>
          </nav>

          {/* ACTIONS */}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:text-white sm:block"
            >
              Log in
            </button>

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="group flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================
          HERO
      ============================================================ */}

      <section className="relative px-5 pb-24 pt-36 sm:px-6 sm:pt-40 lg:px-8">
        {/* BACKGROUND GLOW */}

        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
          <div className="mx-auto h-[620px] max-w-5xl rounded-full bg-violet-600/[0.10] blur-[150px]" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            {/* BADGE */}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-3.5 py-2 text-xs font-bold text-violet-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered video creation
              <ChevronRight className="h-3.5 w-3.5 text-violet-500" />
            </motion.div>

            {/* TITLE */}

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.05 }}
              className="text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-8xl"
            >
              Turn long videos
              <br />
              into{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                scroll-stopping
              </span>{" "}
              clips.
            </motion.h1>

            {/* DESCRIPTION */}

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mx-auto mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg"
            >
              ClipForge uses AI to understand your videos, find the moments
              worth sharing, create short-form clips and add captions
              automatically.
            </motion.p>

            {/* CTA */}

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-black shadow-xl shadow-white/5 transition hover:-translate-y-0.5 hover:bg-zinc-200"
              >
                Create free clips
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("showcase")}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 text-sm font-bold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                <Play className="h-4 w-4 fill-current" />
                See how it works
              </button>
            </motion.div>

            <p className="mt-4 text-xs text-zinc-600">
              No credit card required · Start with free AI credits
            </p>
          </div>

          {/* ========================================================
              VIDEO SHOWCASE
          ======================================================== */}

          <motion.div
            id="showcase"
            initial={{ opacity: 0, y: 35, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="relative mx-auto mt-20 max-w-5xl"
          >
            {/* OUTER GLOW */}

            <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-violet-600/[0.10] blur-3xl" />

            <div className="relative overflow-hidden rounded-[26px] border border-white/[0.10] bg-[#101014] p-2 shadow-2xl shadow-black/60">
              {/* WINDOW HEADER */}

              <div className="flex h-10 items-center justify-between border-b border-white/[0.06] px-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                </div>

                <div className="rounded-md bg-white/[0.04] px-4 py-1 text-[10px] font-medium text-zinc-600">
                  clipforge.ai/editor
                </div>

                <div className="w-10" />
              </div>

              {/* EDITOR MOCKUP */}

              <div className="grid min-h-[460px] grid-cols-1 lg:grid-cols-[1fr_270px]">
                {/* VIDEO */}

                <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-[#08080a]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.18),transparent_45%)]" />

                  <div className="relative aspect-[9/14] h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.25),transparent_40%)]" />

                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent" />

                    <div className="absolute inset-x-4 bottom-12">
                      <div className="text-center text-[11px] font-black uppercase tracking-[0.18em] text-violet-300">
                        AI GENERATED SHORT
                      </div>

                      <div className="mt-3 text-center text-xl font-black leading-tight text-white drop-shadow-lg">
                        The one thing
                        <br />
                        <span className="text-violet-400">
                          nobody tells you.
                        </span>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
                  </div>

                  {/* PLAY */}

                  <button
                    type="button"
                    className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:scale-105"
                  >
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </button>
                </div>

                {/* AI PANEL */}

                <div className="border-t border-white/[0.06] bg-[#111115] p-5 lg:border-l lg:border-t-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
                    AI analysis
                  </div>

                  <div className="mt-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs font-medium text-zinc-500">
                          Viral potential
                        </div>

                        <div className="mt-1 text-4xl font-black text-white">
                          94
                        </div>
                      </div>

                      <div className="text-xs font-bold text-emerald-400">
                        Excellent
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" />
                    </div>
                  </div>

                  <div className="mt-7 space-y-3">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Hook
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-300">
                        Strong opening statement
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Story
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-300">
                        Complete thought detected
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Caption
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-300">
                        Dynamic highlight style
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-black text-white transition hover:bg-violet-500"
                  >
                    Try ClipForge
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          TRUST / STATS
      ============================================================ */}

      <section className="border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-white/[0.06] sm:grid-cols-4">
          {[
            ["AI", "powered editing"],
            ["9:16", "social ready"],
            ["10+", "caption styles"],
            ["24/7", "background processing"],
          ].map(([value, label]) => (
            <div key={value} className="px-5 py-8 text-center">
              <div className="text-2xl font-black tracking-tight text-white">
                {value}
              </div>
              <div className="mt-1 text-xs font-medium text-zinc-600">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          FEATURES
      ============================================================ */}

      <section id="features" className="px-5 py-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">
              Built for creators
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Everything you need to
              <br />
              create better clips.
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-500 sm:text-base">
              From finding the right moment to adding captions and exporting
              the final video, ClipForge puts the entire workflow in one
              place.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.07] md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.04,
                  }}
                  className="group bg-[#0b0b0e] p-7 transition hover:bg-[#101014]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/10 bg-violet-500/[0.08] text-violet-400 transition group-hover:scale-105 group-hover:bg-violet-500/[0.14]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-6 text-base font-bold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          WORKFLOW
      ============================================================ */}

      <section
        id="workflow"
        className="border-y border-white/[0.06] bg-[#0a0a0d] px-5 py-28 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">
              Simple workflow
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              From long video to
              <br />
              ready-to-post clips.
            </h2>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
              >
                <div className="text-4xl font-black tracking-[-0.05em] text-white/[0.08]">
                  {step.number}
                </div>

                <h3 className="mt-6 text-lg font-bold">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.08] bg-[#0a0a0d] text-zinc-600 lg:flex">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CAPTION SHOWCASE
      ============================================================ */}

      <section className="px-5 py-28 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">
              Smart captions
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Your captions.
              <br />
              Your style.
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-500 sm:text-base">
              Choose from multiple caption styles and customize your clips
              inside the editor. Highlight important words, change typography
              and create a visual identity for your content.
            </p>

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="group mt-8 flex items-center gap-2 text-sm font-bold text-white"
            >
              Explore the editor
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-10 rounded-full bg-fuchsia-600/[0.08] blur-3xl" />

            <div className="relative rounded-[30px] border border-white/[0.08] bg-[#101014] p-3 shadow-2xl">
              <div className="relative aspect-[9/13] overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800 via-zinc-900 to-black">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.18),transparent_45%)]" />

                <div className="absolute inset-x-5 bottom-20 text-center">
                  <div className="text-3xl font-black uppercase leading-[1.05] tracking-tight">
                    Make
                    <br />
                    <span className="text-yellow-300">something</span>
                    <br />
                    people remember.
                  </div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400 backdrop-blur">
                  Highlight captions
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PRICING
      ============================================================ */}

      <section
        id="pricing"
        className="border-y border-white/[0.06] bg-[#0a0a0d] px-5 py-28 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">
              Pricing
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Start free.
              <br />
              Scale when you need.
            </h2>

            <p className="mt-5 text-sm leading-6 text-zinc-500">
              Try ClipForge without a credit card and upgrade when your
              content workflow grows.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl border p-7 ${
                  plan.popular
                    ? "border-violet-500/40 bg-violet-500/[0.06] shadow-2xl shadow-violet-950/20"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute right-5 top-5 rounded-full bg-violet-500 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                    Most popular
                  </div>
                )}

                <div className="text-sm font-bold text-zinc-400">
                  {plan.name}
                </div>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-5xl font-black tracking-[-0.05em]">
                    {plan.price}
                  </span>

                  {plan.name !== "Free" && (
                    <span className="mb-2 text-xs text-zinc-600">
                      / month
                    </span>
                  )}
                </div>

                <p className="mt-4 min-h-12 text-sm leading-6 text-zinc-500">
                  {plan.description}
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className={`mt-7 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-black transition ${
                    plan.popular
                      ? "bg-violet-600 text-white hover:bg-violet-500"
                      : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  }`}
                >
                  Get started
                </button>

                <div className="mt-7 space-y-3 border-t border-white/[0.06] pt-6">
                  {plan.features.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-zinc-400"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <Check className="h-3 w-3" />
                      </span>

                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}

      <section className="relative overflow-hidden px-5 py-32 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.16),transparent_45%)]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
            <Film className="h-6 w-6" />
          </div>

          <h2 className="mt-7 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Your next great clip
            <br />
            is already in your video.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-zinc-500 sm:text-base">
            Let ClipForge find it, edit it and turn it into content your
            audience wants to watch.
          </p>

          <button
            type="button"
            onClick={() => router.push("/register")}
            className="group mx-auto mt-9 flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
          >
            Create free clips
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}

      <footer className="border-t border-white/[0.06] px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-[11px] font-black">
              C
            </div>

            <span className="text-sm font-bold">
              ClipForge
              <span className="text-violet-400"> AI</span>
            </span>
          </div>

          <div className="text-xs text-zinc-600">
            © 2026 ClipForge AI. All rights reserved.
          </div>

          <div className="flex items-center gap-5 text-xs font-medium text-zinc-600">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="transition hover:text-white"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="transition hover:text-white"
            >
              Register
            </button>

            <button
              type="button"
              onClick={() => router.push("/plans")}
              className="transition hover:text-white"
            >
              Plans
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}