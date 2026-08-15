"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Crown,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { getCurrentUser } from "../../services/auth";

type PlanId = "free" | "pro" | "business" | "enterprise";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  credits: string;
  shorts: string;
  duration: string;
  storage: string;
  features: string[];
  button: string;
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/ forever",
    description:
      "Explore ClipForge and turn your first videos into AI-powered shorts.",
    credits: "30 AI credits / month",
    shorts: "10 AI Shorts / month",
    duration: "Up to 15 min video",
    storage: "1 GB storage",
    features: [
      "AI highlight detection",
      "Basic AI captions",
      "2 caption styles",
      "9:16 vertical format",
      "Standard processing",
      "No credit card required",
    ],
    button: "Start Creating",
    icon: <Sparkles size={19} />,
  },

  {
    id: "pro",
    name: "Pro",
    price: "$9",
    period: "/ month",
    description:
      "For creators who publish consistently and want more powerful AI tools.",
    credits: "300 AI credits / month",
    shorts: "100 AI Shorts / month",
    duration: "Up to 60 min video",
    storage: "25 GB storage",
    features: [
      "Everything in Free",
      "Advanced AI highlight scoring",
      "All caption styles",
      "Filler word removal",
      "Smart silence removal",
      "AI video enhancement",
      "Priority processing",
      "No watermark",
    ],
    button: "Upgrade to Pro",
    popular: true,
    icon: <Zap size={19} />,
  },

  {
    id: "business",
    name: "Business",
    price: "$29",
    period: "/ month",
    description:
      "Built for teams, agencies and creators producing content at scale.",
    credits: "1,500 AI credits / month",
    shorts: "500 AI Shorts / month",
    duration: "Up to 120 min video",
    storage: "100 GB storage",
    features: [
      "Everything in Pro",
      "Advanced AI editing",
      "Custom caption presets",
      "Brand colors & fonts",
      "Saved brand templates",
      "Team workspace",
      "Higher processing priority",
      "Large project storage",
    ],
    button: "Choose Business",
    icon: <Users size={19} />,
  },

  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    period: "/ month",
    description:
      "Maximum power for agencies, media teams and high-volume production.",
    credits: "5,000+ AI credits / month",
    shorts: "2,000 AI Shorts / month",
    duration: "Up to 240 min video",
    storage: "500 GB storage",
    features: [
      "Everything in Business",
      "Maximum processing priority",
      "Advanced AI tools",
      "Unlimited brand presets",
      "Team & workspace controls",
      "API access",
      "White-label support",
      "Priority support",
    ],
    button: "Choose Enterprise",
    icon: <Crown size={19} />,
  },
];

export default function PlansPage() {
  const [currentPlan, setCurrentPlan] =
    useState<PlanId>("free");

  const [loadingUser, setLoadingUser] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUserPlan() {
      try {
        const user = await getCurrentUser();

        const backendPlan =
          user?.plan?.trim().toLowerCase();

        const validPlan: PlanId =
          backendPlan === "pro" ||
          backendPlan === "business" ||
          backendPlan === "enterprise"
            ? backendPlan
            : "free";

        if (mounted) {
          setCurrentPlan(validPlan);
        }
      } catch (error) {
        console.error(
          "PLANS USER ERROR:",
          error
        );
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    loadUserPlan();

    return () => {
      mounted = false;
    };
  }, []);

  function handlePlanClick(plan: Plan) {
    if (plan.id === currentPlan) {
      return;
    }

    /*
      PAYMENT SYSTEM WILL BE CONNECTED HERE.

      Later:
      - Stripe checkout
      - backend subscription endpoint
      - payment success
      - update user's plan
    */

    console.log(
      `Selected ClipForge plan: ${plan.id}`
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute left-1/2 top-[-180px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-[150px]" />

        <div className="absolute bottom-[-200px] left-[-150px] h-[450px] w-[450px] rounded-full bg-fuchsia-600/[0.04] blur-[140px]" />

        <div className="absolute right-[-150px] top-[30%] h-[450px] w-[450px] rounded-full bg-blue-600/[0.035] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="mx-auto mb-14 max-w-3xl text-center">

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-wider text-violet-300"
          >
            <Sparkles
              size={14}
              className="text-violet-400"
            />

            ClipForge AI
          </motion.div>

          <motion.h1
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08,
            }}
            className="text-4xl font-black tracking-tight sm:text-6xl"
          >
            Create more.
            <br />

            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-300 bg-clip-text text-transparent">
              Edit smarter.
            </span>
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.16,
            }}
            className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg"
          >
            Choose a plan that gives your AI video
            workflow the power it needs.
          </motion.p>

          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.22,
            }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500"
          >
            <span className="flex items-center gap-1.5">
              <Check
                size={14}
                className="text-emerald-400"
              />
              No hidden fees
            </span>

            <span className="text-zinc-700">
              •
            </span>

            <span className="flex items-center gap-1.5">
              <Check
                size={14}
                className="text-emerald-400"
              />
              Cancel anytime
            </span>

            <span className="text-zinc-700">
              •
            </span>

            <span className="flex items-center gap-1.5">
              <Check
                size={14}
                className="text-emerald-400"
              />
              Start free
            </span>
          </motion.div>
        </section>

        {/* =====================================================
            PLAN GRID
        ====================================================== */}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          {plans.map((plan, index) => {
            const isCurrent =
              currentPlan === plan.id;

            return (
              <motion.article
                key={plan.id}
                initial={{
                  opacity: 0,
                  y: 35,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.45,
                }}
                whileHover={{
                  y: -7,
                }}
                className={`relative flex min-h-[650px] flex-col rounded-3xl border p-6 transition-all duration-300 sm:p-7 ${
                  plan.popular
                    ? "border-violet-500/50 bg-gradient-to-b from-violet-500/[0.10] to-[#0d0d10] shadow-2xl shadow-violet-950/30"
                    : isCurrent
                    ? "border-emerald-500/30 bg-[#0d0d10]"
                    : "border-zinc-800/80 bg-[#0b0b0e] hover:border-zinc-700"
                }`}
              >

                {/* TOP BADGE */}

                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">

                    <div className="flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-violet-950/40">
                      <Zap size={12} />
                      Most Popular
                    </div>

                  </div>
                )}

                {isCurrent && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">

                    <div className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      Your Plan
                    </div>

                  </div>
                )}

                {/* PLAN HEADER */}

                <div>

                  <div className="flex items-center justify-between">

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        plan.popular
                          ? "bg-violet-500/15 text-violet-300"
                          : "bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {plan.icon}
                    </div>

                    {isCurrent && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </div>
                    )}

                  </div>

                  <h2 className="mt-6 text-2xl font-black">
                    {plan.name}
                  </h2>

                  <p className="mt-2 min-h-[66px] text-sm leading-6 text-zinc-500">
                    {plan.description}
                  </p>

                </div>

                {/* PRICE */}

                <div className="mt-7">

                  <div className="flex items-end gap-2">

                    <span className="text-5xl font-black tracking-tight">
                      {plan.price}
                    </span>

                    <span className="mb-2 text-xs text-zinc-500">
                      {plan.period}
                    </span>

                  </div>

                </div>

                {/* CTA */}

                <motion.button
                  type="button"
                  disabled={
                    isCurrent ||
                    loadingUser
                  }
                  whileHover={
                    !isCurrent
                      ? {
                          scale: 1.02,
                        }
                      : undefined
                  }
                  whileTap={
                    !isCurrent
                      ? {
                          scale: 0.98,
                        }
                      : undefined
                  }
                  onClick={() =>
                    handlePlanClick(plan)
                  }
                  className={`mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black transition-all ${
                    isCurrent
                      ? "cursor-default border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : plan.popular
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/30 hover:from-violet-500 hover:to-fuchsia-500"
                      : "border border-zinc-700 bg-zinc-900 text-white hover:border-violet-500/40 hover:bg-violet-500/10"
                  }`}
                >
                  {isCurrent
                    ? "Current Plan"
                    : plan.button}

                  {!isCurrent && (
                    <ArrowRight
                      size={16}
                    />
                  )}
                </motion.button>

                {/* DIVIDER */}

                <div className="my-7 h-px bg-zinc-800/80" />

                {/* USAGE */}

                <div className="space-y-2">

                  <div className="flex items-center justify-between rounded-xl bg-zinc-900/60 px-3 py-2.5">

                    <span className="text-xs text-zinc-500">
                      AI Credits
                    </span>

                    <span className="text-xs font-bold text-white">
                      {plan.credits}
                    </span>

                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-zinc-900/60 px-3 py-2.5">

                    <span className="text-xs text-zinc-500">
                      Shorts
                    </span>

                    <span className="text-xs font-bold text-white">
                      {plan.shorts}
                    </span>

                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-zinc-900/60 px-3 py-2.5">

                    <span className="text-xs text-zinc-500">
                      Max video
                    </span>

                    <span className="text-xs font-bold text-white">
                      {plan.duration}
                    </span>

                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-zinc-900/60 px-3 py-2.5">

                    <span className="text-xs text-zinc-500">
                      Storage
                    </span>

                    <span className="text-xs font-bold text-white">
                      {plan.storage}
                    </span>

                  </div>

                </div>

                {/* FEATURES */}

                <div className="mt-7 flex-1">

                  <p className="mb-4 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
                    Includes
                  </p>

                  <div className="space-y-3">

                    {plan.features.map(
                      (feature) => (
                        <div
                          key={feature}
                          className="flex items-start gap-2.5"
                        >

                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              plan.popular
                                ? "bg-violet-500/15"
                                : "bg-zinc-900"
                            }`}
                          >
                            <Check
                              size={12}
                              className={
                                plan.popular
                                  ? "text-violet-400"
                                  : "text-zinc-500"
                              }
                            />
                          </span>

                          <span className="text-xs leading-5 text-zinc-400">
                            {feature}
                          </span>

                        </div>
                      )
                    )}

                  </div>

                </div>

              </motion.article>
            );
          })}

        </section>

        {/* =====================================================
            AI CREDITS EXPLANATION
        ====================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.6,
          }}
          className="mt-8 rounded-3xl border border-zinc-800/80 bg-[#0b0b0e] p-6 sm:p-8"
        >

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="max-w-2xl">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <Sparkles size={17} />
                </div>

                <h3 className="font-bold text-white">
                  What are AI credits?
                </h3>

              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Credits power ClipForge's AI processing.
                Longer videos and advanced AI tools use
                more credits. Your monthly allowance
                automatically refreshes with your plan.
              </p>

            </div>

            <div className="shrink-0 rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] px-5 py-4">

              <p className="text-xs text-zinc-500">
                Starting with
              </p>

              <p className="mt-1 text-lg font-black text-violet-300">
                Free AI credits
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                No credit card required
              </p>

            </div>

          </div>

        </motion.section>

        {/* =====================================================
            BOTTOM CTA
        ====================================================== */}

        <section className="py-16 text-center">

          <p className="text-sm text-zinc-600">
            Need more power?
          </p>

          <h3 className="mt-2 text-xl font-bold">
            Upgrade when your content grows.
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">
            Start free and move to Pro, Business or
            Enterprise whenever you need more AI
            processing power.
          </p>

        </section>

      </div>
    </main>
  );
}