"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getCurrentUser,
  logoutUser,
  type User,
} from "../services/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ============================================================
  // LOAD CURRENT USER
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();

        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("NAVBAR USER ERROR:", error);
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    // Initial load
    loadUser();

    // Refresh when the tab becomes active again.
    const handleFocus = () => {
      loadUser();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadUser();
      }
    };

    // Admin panel dispatches this event after changing a user's plan.
    const handleUserUpdated = () => {
      loadUser();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    window.addEventListener(
      "clipforge:user-updated",
      handleUserUpdated
    );

    // Keep the navbar synchronized if the plan is changed
    // from another page/component without a full reload.
    const refreshInterval = window.setInterval(() => {
      loadUser();
    }, 5000);

    return () => {
      mounted = false;

      window.removeEventListener(
        "focus",
        handleFocus
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener(
        "clipforge:user-updated",
        handleUserUpdated
      );
      window.clearInterval(refreshInterval);
    };
  }, [pathname]);

  // ============================================================
  // LOGOUT
  // ============================================================

  function handleLogout() {
    logoutUser();
    setUser(null);
    router.replace("/login");
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: "⌂",
  },
  {
    label: "Projects",
    path: "/projects",
    icon: "▣",
  },
];

  // ============================================================
  // ADMIN
  // ============================================================

  const isAdmin =
    user?.role?.toLowerCase() === "admin";

  // ============================================================
  // PLAN
  // ============================================================

  // Always use the plan returned by the backend /me endpoint.
  // The user state is refreshed on focus, visibility changes,
  // the custom user-updated event, and every 5 seconds.
  const currentPlan =
    user?.plan?.trim() || "Free";

  const normalizedPlan =
    currentPlan.toLowerCase();

  const isEnterprise =
    normalizedPlan === "enterprise";

  // ============================================================
  // USER INITIAL
  // ============================================================

  const userInitial =
    user?.username?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <motion.nav
      initial={{
        y: -30,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      transition={{
        duration: 0.45,
      }}
      className="
        sticky
        top-0
        z-50
        border-b
        border-zinc-800/80
        bg-[#09090B]/90
        px-4
        backdrop-blur-xl
        md:px-8
      "
    >
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-4">

        {/* =====================================================
            LEFT
        ====================================================== */}

        <div className="flex min-w-0 items-center gap-8">

          {/* LOGO */}

          <button
            type="button"
            onClick={() => router.push("/")}
            className="
              group
              flex
              shrink-0
              items-center
              gap-3
              text-left
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                from-violet-600
                to-fuchsia-600
                text-lg
                font-black
                text-white
                shadow-lg
                shadow-violet-950/30
                transition
                duration-200
                group-hover:scale-105
              "
            >
              C
            </div>

            <div className="hidden leading-none sm:block">
              <p className="text-base font-black tracking-tight text-white">
                ClipForge
                <span className="text-violet-400">
                  {" "}AI
                </span>
              </p>

              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                AI Video Studio
              </p>
            </div>
          </button>

          {/* NAVIGATION */}

          <div className="hidden items-center gap-1 md:flex">

            {navItems.map((item) => {
              const active =
                item.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() =>
                    router.push(item.path)
                  }
                  className={`
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    px-4
                    py-2.5
                    text-sm
                    font-bold
                    transition-all
                    duration-200

                    ${
                      active
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "text-zinc-500 hover:bg-zinc-900/70 hover:text-white"
                    }
                  `}
                >
                  <span
                    className={
                      active
                        ? "text-violet-400"
                        : "text-zinc-600"
                    }
                  >
                    {item.icon}
                  </span>

                  {item.label}
                </button>
              );
            })}

            {/* ADMIN */}

            {!loadingUser && isAdmin && (
              <button
                type="button"
                onClick={() =>
                  router.push("/admin")
                }
                className={`
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  px-4
                  py-2.5
                  text-sm
                  font-bold
                  transition-all
                  duration-200

                  ${
                    pathname.startsWith("/admin")
                      ? "bg-red-500/10 text-red-400"
                      : "text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                  }
                `}
              >
                <span>⚙</span>
                Admin
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            RIGHT
        ====================================================== */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* PLAN BADGE */}

          <button
            type="button"
            onClick={() => router.push("/plans")}
            className="
              hidden
              items-center
              gap-2
              rounded-xl
              border
              border-zinc-800
              bg-zinc-900/60
              px-3
              py-2
              transition
              hover:border-violet-500/30
              hover:bg-violet-500/5
              sm:flex
            "
          >
            <span
              className={`
                h-1.5
                w-1.5
                rounded-full

                ${
                  normalizedPlan === "free"
                    ? "bg-zinc-500"
                    : normalizedPlan === "pro"
                    ? "bg-violet-400"
                    : normalizedPlan === "business"
                    ? "bg-blue-400"
                    : "bg-amber-400"
                }
              `}
            />

            <span className="text-xs font-bold capitalize text-zinc-400">
              {currentPlan} Plan
            </span>
          </button>

          {/* UPGRADE */}

          {!isEnterprise && (
            <button
              type="button"
              onClick={() =>
                router.push("/plans")
              }
              className="
                rounded-xl
                bg-gradient-to-r
                from-violet-600
                to-fuchsia-600
                px-4
                py-2.5
                text-xs
                font-black
                text-white
                shadow-lg
                shadow-violet-950/20
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-xl
                hover:shadow-violet-950/30
                active:translate-y-0
                sm:px-5
                sm:text-sm
              "
            >
              Upgrade
            </button>
          )}

          {/* ENTERPRISE CURRENT PLAN */}

          {isEnterprise && (
            <div
              className="
                hidden
                rounded-xl
                border
                border-amber-500/20
                bg-amber-500/5
                px-4
                py-2.5
                text-xs
                font-black
                text-amber-400
                sm:block
              "
            >
              Enterprise
            </div>
          )}

          {/* USER */}

          <div className="group relative">

            <button
              type="button"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                border
                border-zinc-800
                bg-zinc-900
                text-sm
                font-black
                text-zinc-300
                transition-all
                duration-200
                hover:border-violet-500/30
                hover:bg-violet-500/10
                hover:text-white
              "
              aria-label="Account"
            >
              {userInitial}
            </button>

            {/* =================================================
                ACCOUNT DROPDOWN
            ================================================== */}

            <div
              className="
                invisible
                absolute
                right-0
                top-12
                w-72
                translate-y-2
                rounded-2xl
                border
                border-zinc-800
                bg-[#111113]
                p-2
                opacity-0
                shadow-2xl
                shadow-black/40
                transition-all
                duration-200
                group-hover:visible
                group-hover:translate-y-0
                group-hover:opacity-100
              "
            >

              {/* USER INFO */}

              <div className="rounded-xl px-3 py-3">

                <div className="flex items-center gap-3">

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-br
                      from-violet-600/20
                      to-fuchsia-600/20
                      text-sm
                      font-black
                      text-violet-300
                    "
                  >
                    {userInitial}
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold text-white">
                      {user?.username || "User"}
                    </p>

                    <p className="truncate text-xs text-zinc-500">
                      {user?.email || "Loading..."}
                    </p>

                  </div>

                </div>

                {/* PLAN */}

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-zinc-800
                    bg-zinc-900/60
                    px-3
                    py-2
                  "
                >
                  <span className="text-xs text-zinc-500">
                    Current plan
                  </span>

                  <span className="text-xs font-black capitalize text-violet-400">
                    {currentPlan}
                  </span>
                </div>

                {/* ADMIN BADGE */}

                {isAdmin && (
                  <span
                    className="
                      mt-3
                      inline-flex
                      rounded-lg
                      bg-red-500/10
                      px-2
                      py-1
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      text-red-400
                    "
                  >
                    Administrator
                  </span>
                )}

              </div>

              {/* PLANS */}

              <button
                type="button"
                onClick={() =>
                  router.push("/plans")
                }
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  font-semibold
                  text-zinc-400
                  transition
                  hover:bg-violet-500/10
                  hover:text-white
                "
              >
                <span>◆</span>
                Plans & Upgrade
              </button>

              {/* ACCOUNT */}

              <button
                type="button"
                onClick={() => {
                  alert(
                    "Account settings will be available soon."
                  );
                }}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  font-semibold
                  text-zinc-400
                  transition
                  hover:bg-zinc-900
                  hover:text-white
                "
              >
                <span>👤</span>
                Account
              </button>

              {/* ADMIN */}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin")
                  }
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    font-semibold
                    text-zinc-400
                    transition
                    hover:bg-red-500/10
                    hover:text-red-400
                  "
                >
                  <span>⚙</span>
                  Admin Panel
                </button>
              )}

              {/* LOGOUT */}

              <div className="my-1 border-t border-zinc-800" />

              <button
                type="button"
                onClick={handleLogout}
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-2.5
                  text-left
                  text-sm
                  font-bold
                  text-red-400
                  transition
                  hover:bg-red-500/10
                  hover:text-red-300
                "
              >
                <span>↪</span>
                Logout
              </button>

            </div>
          </div>

        </div>
      </div>
    </motion.nav>
  );
}