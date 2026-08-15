"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminFetch,
  getCurrentUser,
  logoutUser,
} from "../../services/auth";

type Section =
  | "overview"
  | "users"
  | "content"
  | "processing"
  | "revenue"
  | "plans"
  | "reports";

type User = {
  id: number;
  username: string;
  email: string;
  plan: string;
  role: string;
  is_active?: boolean;
};

type Plan = {
  id: number;
  name: string;
  display_name: string;
  price: number;
  monthly_video_limit: number;
  max_video_duration: number;
  max_shorts_per_video: number;
  storage_limit_gb: number;
  features: string[];
  is_active: boolean;
};

type Stats = {
  status?: string;
  users?: {
    total?: number;
    active?: number;
    inactive?: number;
    admins?: number;
    free?: number;
    pro?: number;
    business?: number;
    enterprise?: number;
  };
  content?: {
    uploaded_videos?: number;
    generated_shorts?: number;
  };
  processing?: {
    active_jobs?: number;
  };
};

const DEFAULT_PLANS: Plan[] = [
  {
    id: 1,
    name: "free",
    display_name: "Free",
    price: 0,
    monthly_video_limit: 10,
    max_video_duration: 900,
    max_shorts_per_video: 10,
    storage_limit_gb: 1,
    features: [],
    is_active: true,
  },
];

function money(value: number) {
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;
}

function minutes(seconds: number) {
  if (!seconds) return "—";
  return `${Math.round(seconds / 60)} min`;
}

function Icon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    overview: "⌂",
    users: "♙",
    content: "▣",
    processing: "◌",
    revenue: "$",
    plans: "◆",
    reports: "▤",
    refresh: "↻",
    logout: "↪",
    plus: "+",
    edit: "✎",
    delete: "×",
    search: "⌕",
    external: "↗",
    check: "✓",
  };

  return <span aria-hidden="true">{icons[name] || "•"}</span>;
}

function NavButton({
  section,
  active,
  label,
  count,
  onClick,
}: {
  section: Section;
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
      type="button"
    >
      <span className="nav-icon">
        <Icon name={section} />
      </span>
      <span>{label}</span>
      {count !== undefined && (
        <span className="nav-count">{count}</span>
      )}
    </button>
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [section, setSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  async function loadAll(initial = false) {
    try {
      if (initial) setLoading(true);
      else setRefreshing(true);

      setError("");

      const current = await getCurrentUser();

      if (!current) {
        router.push("/login");
        return;
      }

      if (current.role?.toLowerCase() !== "admin") {
        setError("Admin access required.");
        return;
      }

      setUser(current);

      const [statsResult, usersResult, plansResult] =
        await Promise.all([
          adminFetch("/admin/stats"),
          adminFetch("/admin/users"),
          adminFetch("/plans"),
        ]);

      setStats(statsResult || null);

      setUsers(
        usersResult?.users ||
          (Array.isArray(usersResult) ? usersResult : [])
      );

      setPlans(
        Array.isArray(plansResult)
          ? plansResult
          : plansResult?.plans || []
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Admin panelni yuklashda xato."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll(true);
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  function changeSection(next: Section) {
    setSection(next);
    setSearch("");
    setMobileOpen(false);
  }

  function logout() {
    logoutUser();
    router.push("/login");
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((item) =>
      [
        item.username,
        item.email,
        item.plan,
        item.role,
        item.is_active === false ? "inactive" : "active",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [users, search]);

  const planCounts = useMemo(() => {
    const result: Record<string, number> = {};

    for (const item of users) {
      const key = item.plan?.toLowerCase().trim() || "free";
      result[key] = (result[key] || 0) + 1;
    }

    return result;
  }, [users]);

  const totalUsers =
    stats?.users?.total ?? users.length;

  const activeUsers =
    stats?.users?.active ??
    users.filter((u) => u.is_active !== false).length;

  const inactiveUsers =
    stats?.users?.inactive ??
    users.filter((u) => u.is_active === false).length;

  const generatedShorts =
    stats?.content?.generated_shorts ?? 0;

  const uploadedVideos =
    stats?.content?.uploaded_videos ?? 0;

  const activeJobs =
    stats?.processing?.active_jobs ?? 0;

  const revenue = useMemo(() => {
    return plans.reduce((total, plan) => {
      const count = planCounts[plan.name.toLowerCase()] || 0;
      return total + count * Number(plan.price || 0);
    }, 0);
  }, [plans, planCounts]);

  const paidUsers = useMemo(() => {
    return users.filter((u) => {
      const plan = plans.find(
        (p) =>
          p.name.toLowerCase() ===
          u.plan?.toLowerCase()
      );
      return Number(plan?.price || 0) > 0;
    }).length;
  }, [users, plans]);

  const conversion =
    totalUsers > 0
      ? (paidUsers / totalUsers) * 100
      : 0;

  const arpu =
    paidUsers > 0 ? revenue / paidUsers : 0;

  async function saveUser(next: User) {
    try {
      setSaving(true);
      setError("");

      const result = await adminFetch(
        `/admin/users/${next.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: next.username.trim(),
            email: next.email.trim(),
            plan: next.plan.toLowerCase().trim(),
            role: next.role.toLowerCase().trim(),
            is_active: next.is_active !== false,
          }),
        }
      );

      const updated = result?.user || result;

      if (!updated) {
        throw new Error("Server updated userni qaytarmadi.");
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === updated.id
            ? { ...item, ...updated }
            : item
        )
      );

      setEditingUser(null);
      notify(`${updated.username} updated`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Userni saqlashda xato."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(item: User) {
    if (
      !window.confirm(
        `${item.username} userini o'chirishni xohlaysizmi?`
      )
    ) {
      return;
    }

    try {
      setError("");

      await adminFetch(`/admin/users/${item.id}`, {
        method: "DELETE",
      });

      setUsers((current) =>
        current.filter((u) => u.id !== item.id)
      );

      notify(`${item.username} deleted`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Userni o'chirishda xato."
      );
    }
  }

  async function savePlan(next: Plan) {
    try {
      setSaving(true);
      setError("");

      if (!next.name.trim() || !next.display_name.trim()) {
        throw new Error("Plan name va display name majburiy.");
      }

      if (next.max_video_duration <= 0) {
        throw new Error(
          "Max video duration 0 dan katta bo'lishi kerak."
        );
      }

      if (next.max_shorts_per_video <= 0) {
        throw new Error(
          "Max shorts per video 0 dan katta bo'lishi kerak."
        );
      }

      const isNew = next.id === 0;

      const payload = {
        name: next.name.trim().toLowerCase(),
        display_name: next.display_name.trim(),
        price: Number(next.price),
        monthly_video_limit: Number(next.monthly_video_limit),
        max_video_duration: Number(next.max_video_duration),
        max_shorts_per_video: Number(next.max_shorts_per_video),
        storage_limit_gb: Number(next.storage_limit_gb),
        features: next.features,
        is_active: next.is_active,
      };

      const result = await adminFetch(
        isNew
          ? "/admin/plans"
          : `/admin/plans/${next.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const saved = result?.plan || result;

      if (!saved?.id) {
        throw new Error("Server plan ma'lumotini qaytarmadi.");
      }

      setPlans((current) =>
        isNew
          ? [...current, saved]
          : current.map((p) =>
              p.id === saved.id ? saved : p
            )
      );

      setEditingPlan(null);
      notify(
        isNew
          ? `${saved.display_name} created`
          : `${saved.display_name} saved`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Plan saqlashda xato."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(plan: Plan) {
    if (plan.name.toLowerCase() === "free") {
      setError("Free plan o'chirilmaydi.");
      return;
    }

    if (
      !window.confirm(
        `${plan.display_name} planini o'chirishni xohlaysizmi?`
      )
    ) {
      return;
    }

    try {
      setError("");

      await adminFetch(`/admin/plans/${plan.id}`, {
        method: "DELETE",
      });

      setPlans((current) =>
        current.filter((p) => p.id !== plan.id)
      );

      notify(`${plan.display_name} deleted`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Plan o'chirishda xato."
      );
    }
  }

  function createPlan() {
    setEditingPlan({
      id: 0,
      name: "",
      display_name: "",
      price: 0,
      monthly_video_limit: 10,
      max_video_duration: 900,
      max_shorts_per_video: 10,
      storage_limit_gb: 1,
      features: [],
      is_active: true,
    });
  }

  if (loading) {
    return (
      <main className="loading-page">
        <div className="loading-glow" />
        <div className="loading-card">
          <div className="logo-mark">CF</div>
          <div className="spinner" />
          <h2>Loading Admin Panel</h2>
          <p>ClipForge boshqaruv paneli yuklanmoqda...</p>
        </div>
        <style>{loadingStyles}</style>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className="error-page">
        <div className="error-card">
          <div className="error-icon">!</div>
          <span>CLIPFORGE ADMIN</span>
          <h1>Access denied</h1>
          <p>{error}</p>
          <button onClick={() => router.push("/login")}>
            Back to Login
          </button>
        </div>
        <style>{errorStyles}</style>
      </main>
    );
  }

  const title =
    section === "overview"
      ? "Dashboard"
      : section.charAt(0).toUpperCase() +
        section.slice(1);

  return (
    <main className="admin-page">
      {mobileOpen && (
        <button
          className="overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>ClipForge</strong>
            <span>ADMINISTRATION</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          <NavButton
            section="overview"
            active={section === "overview"}
            label="Overview"
            onClick={() => changeSection("overview")}
          />
          <NavButton
            section="users"
            active={section === "users"}
            label="Users"
            count={users.length}
            onClick={() => changeSection("users")}
          />
          <NavButton
            section="content"
            active={section === "content"}
            label="Content"
            onClick={() => changeSection("content")}
          />
          <NavButton
            section="processing"
            active={section === "processing"}
            label="Processing"
            count={activeJobs}
            onClick={() => changeSection("processing")}
          />
          <NavButton
            section="revenue"
            active={section === "revenue"}
            label="Revenue"
            onClick={() => changeSection("revenue")}
          />
          <NavButton
            section="plans"
            active={section === "plans"}
            label="Plans"
            count={plans.length}
            onClick={() => changeSection("plans")}
          />
          <NavButton
            section="reports"
            active={section === "reports"}
            label="Reports"
            onClick={() => changeSection("reports")}
          />
        </nav>

        <div className="nav-label">PLATFORM</div>

        <button
          className="platform-button"
          onClick={() => router.push("/")}
        >
          <Icon name="external" />
          <span>Open ClipForge</span>
        </button>

        <div className="sidebar-spacer" />

        <div className="system-card">
          <span className="system-dot" />
          <div>
            <strong>System operational</strong>
            <span>
              {stats?.status || "All services operational"}
            </span>
          </div>
        </div>

        <div className="profile">
          <div className="avatar">
            {user?.username?.charAt(0).toUpperCase() || "A"}
          </div>
          <div>
            <strong>{user?.username || "Administrator"}</strong>
            <span>Administrator</span>
          </div>
        </div>

        <button
          className="refresh-button"
          onClick={() => loadAll(false)}
          disabled={refreshing}
        >
          <Icon name="refresh" />
          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>

        <button className="logout-button" onClick={logout}>
          <Icon name="logout" />
          Logout
        </button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <div>
              <div className="breadcrumb">
                ClipForge <span>/</span> Admin
              </div>
              <h1>{title}</h1>
              <p>Manage your ClipForge AI platform</p>
            </div>
          </div>

          <div className="top-actions">
            <button
              className="top-refresh"
              onClick={() => loadAll(false)}
            >
              <Icon name="refresh" />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="alert">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}

        {section === "overview" && (
          <Overview
            totalUsers={totalUsers}
            activeUsers={activeUsers}
            inactiveUsers={inactiveUsers}
            uploadedVideos={uploadedVideos}
            generatedShorts={generatedShorts}
            activeJobs={activeJobs}
            revenue={revenue}
            paidUsers={paidUsers}
            conversion={conversion}
            planCounts={planCounts}
            plans={plans}
            onNavigate={changeSection}
          />
        )}

        {section === "users" && (
          <UsersSection
            users={filteredUsers}
            search={search}
            setSearch={setSearch}
            plans={plans}
            onEdit={setEditingUser}
            onDelete={deleteUser}
          />
        )}

        {section === "content" && (
          <ContentSection
            uploadedVideos={uploadedVideos}
            generatedShorts={generatedShorts}
          />
        )}

        {section === "processing" && (
          <ProcessingSection activeJobs={activeJobs} />
        )}

        {section === "revenue" && (
          <RevenueSection
            revenue={revenue}
            paidUsers={paidUsers}
            totalUsers={totalUsers}
            conversion={conversion}
            arpu={arpu}
            plans={plans}
            planCounts={planCounts}
          />
        )}

        {section === "plans" && (
          <PlansSection
            plans={plans}
            planCounts={planCounts}
            onCreate={createPlan}
            onEdit={setEditingPlan}
            onDelete={deletePlan}
          />
        )}

        {section === "reports" && (
          <ReportsSection
            totalUsers={totalUsers}
            activeUsers={activeUsers}
            uploadedVideos={uploadedVideos}
            generatedShorts={generatedShorts}
            activeJobs={activeJobs}
            revenue={revenue}
            paidUsers={paidUsers}
            conversion={conversion}
            plans={plans}
            planCounts={planCounts}
          />
        )}
      </section>

      {editingUser && (
        <UserModal
          user={editingUser}
          plans={plans}
          saving={saving}
          onClose={() => setEditingUser(null)}
          onSave={saveUser}
        />
      )}

      {editingPlan && (
        <PlanModal
          plan={editingPlan}
          saving={saving}
          onClose={() => setEditingPlan(null)}
          onSave={savePlan}
        />
      )}

      <style>{styles}</style>
    </main>
  );
}

function Overview({
  totalUsers,
  activeUsers,
  inactiveUsers,
  uploadedVideos,
  generatedShorts,
  activeJobs,
  revenue,
  paidUsers,
  conversion,
  planCounts,
  plans,
  onNavigate,
}: {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  uploadedVideos: number;
  generatedShorts: number;
  activeJobs: number;
  revenue: number;
  paidUsers: number;
  conversion: number;
  planCounts: Record<string, number>;
  plans: Plan[];
  onNavigate: (s: Section) => void;
}) {
  return (
    <div className="page-body">
      <div className="stats-grid">
        <Metric
          label="Total Users"
          value={totalUsers}
          hint={`${activeUsers} active`}
          icon="♙"
          onClick={() => onNavigate("users")}
        />
        <Metric
          label="Generated Shorts"
          value={generatedShorts}
          hint="All generated content"
          icon="▣"
          onClick={() => onNavigate("content")}
        />
        <Metric
          label="Uploaded Videos"
          value={uploadedVideos}
          hint="Total uploads"
          icon="◉"
          onClick={() => onNavigate("content")}
        />
        <Metric
          label="Estimated MRR"
          value={money(revenue)}
          hint={`${paidUsers} paid users`}
          icon="$"
          accent
          onClick={() => onNavigate("revenue")}
        />
      </div>

      <div className="two-col">
        <Panel
          title="Platform overview"
          subtitle="Current system snapshot"
        >
          <div className="health-row">
            <span className="health-dot" />
            <div>
              <strong>System operational</strong>
              <span>API and admin services available</span>
            </div>
            <b>ONLINE</b>
          </div>

          <div className="mini-grid">
            <MiniStat label="Active users" value={activeUsers} />
            <MiniStat label="Inactive users" value={inactiveUsers} />
            <MiniStat label="Processing" value={activeJobs} />
            <MiniStat label="Paid conversion" value={`${conversion.toFixed(1)}%`} />
          </div>
        </Panel>

        <Panel
          title="Plan distribution"
          subtitle="Users by subscription"
          action={
            <button
              className="link-button"
              onClick={() => onNavigate("plans")}
            >
              Manage
            </button>
          }
        >
          <PlanDistribution
            plans={plans}
            counts={planCounts}
          />
        </Panel>
      </div>

      <Panel
        title="Revenue snapshot"
        subtitle="Estimated recurring monthly revenue"
        action={
          <button
            className="link-button"
            onClick={() => onNavigate("revenue")}
          >
            View revenue
          </button>
        }
      >
        <div className="revenue-big">
          <strong>{money(revenue)}</strong>
          <span>estimated MRR</span>
        </div>
        <div className="revenue-bar">
          {plans.map((plan) => {
            const amount =
              (planCounts[plan.name.toLowerCase()] || 0) *
              Number(plan.price || 0);
            const width =
              revenue > 0 ? (amount / revenue) * 100 : 0;

            return (
              <div
                key={plan.id}
                className="revenue-segment"
                style={{ width: `${width}%` }}
                title={`${plan.display_name}: ${money(amount)}`}
              />
            );
          })}
        </div>
        <div className="revenue-legend">
          {plans.map((plan) => (
            <div key={plan.id}>
              <span className="legend-dot" />
              {plan.display_name}
              <b>
                {money(
                  (planCounts[plan.name.toLowerCase()] || 0) *
                    Number(plan.price || 0)
                )}
              </b>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function UsersSection({
  users,
  search,
  setSearch,
  plans,
  onEdit,
  onDelete,
}: {
  users: User[];
  search: string;
  setSearch: (v: string) => void;
  plans: Plan[];
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
}) {
  return (
    <div className="page-body">
      <Panel
        title="Users"
        subtitle={`${users.length} users shown`}
        action={
          <div className="search-box">
            <Icon name="search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
            />
          </div>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Role</th>
                <th>Status</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <Empty text="No users found." />
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="user-cell">
                        <div className="table-avatar">
                          {item.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{item.username}</strong>
                          <span>{item.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge plan-${item.plan?.toLowerCase()}`}>
                        {item.plan || "free"}
                      </span>
                    </td>
                    <td>
                      <span className="role">{item.role}</span>
                    </td>
                    <td>
                      <span
                        className={
                          item.is_active === false
                            ? "status inactive"
                            : "status active"
                        }
                      >
                        <i />
                        {item.is_active === false
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </td>
                    <td className="right">
                      <div className="actions">
                        <button
                          className="small-button"
                          onClick={() => onEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-button"
                          onClick={() => onDelete(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ContentSection({
  uploadedVideos,
  generatedShorts,
}: {
  uploadedVideos: number;
  generatedShorts: number;
}) {
  return (
    <div className="page-body">
      <div className="stats-grid two">
        <Metric
          label="Uploaded Videos"
          value={uploadedVideos}
          hint="Total platform uploads"
          icon="◉"
        />
        <Metric
          label="Generated Shorts"
          value={generatedShorts}
          hint="AI-generated shorts"
          icon="▣"
        />
      </div>

      <Panel
        title="Content management"
        subtitle="Platform content overview"
      >
        <div className="empty-large">
          <div>▣</div>
          <h3>Content statistics ready</h3>
          <p>
            Detailed video and generated-short management can be
            connected here as dedicated endpoints become available.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function ProcessingSection({
  activeJobs,
}: {
  activeJobs: number;
}) {
  return (
    <div className="page-body">
      <div className="stats-grid">
        <Metric
          label="Active Jobs"
          value={activeJobs}
          hint="Currently processing"
          icon="◌"
        />
        <Metric
          label="System Status"
          value="Online"
          hint="Backend available"
          icon="✓"
        />
      </div>

      <Panel
        title="Processing"
        subtitle="Current processing pipeline"
      >
        <div className="processing-card">
          <div className="processing-icon">◌</div>
          <div>
            <strong>
              {activeJobs
                ? `${activeJobs} job(s) processing`
                : "No active processing jobs"}
            </strong>
            <span>
              Processing data is supplied by the admin statistics API.
            </span>
          </div>
          <div className="pulse" />
        </div>
      </Panel>
    </div>
  );
}

function RevenueSection({
  revenue,
  paidUsers,
  totalUsers,
  conversion,
  arpu,
  plans,
  planCounts,
}: {
  revenue: number;
  paidUsers: number;
  totalUsers: number;
  conversion: number;
  arpu: number;
  plans: Plan[];
  planCounts: Record<string, number>;
}) {
  return (
    <div className="page-body">
      <div className="stats-grid">
        <Metric
          label="Estimated MRR"
          value={money(revenue)}
          hint="Plan price × users"
          icon="$"
          accent
        />
        <Metric
          label="Paid Users"
          value={paidUsers}
          hint={`of ${totalUsers} total users`}
          icon="◆"
        />
        <Metric
          label="Conversion"
          value={`${conversion.toFixed(1)}%`}
          hint="Paid / total users"
          icon="%"
        />
        <Metric
          label="ARPU"
          value={money(arpu)}
          hint="Revenue per paid user"
          icon="◈"
        />
      </div>

      <Panel
        title="Revenue by plan"
        subtitle="Estimated monthly recurring revenue"
      >
        <div className="revenue-list">
          {plans.map((plan) => {
            const count =
              planCounts[plan.name.toLowerCase()] || 0;
            const amount = count * Number(plan.price || 0);
            const share =
              revenue > 0 ? (amount / revenue) * 100 : 0;

            return (
              <div className="revenue-row" key={plan.id}>
                <div className="revenue-plan">
                  <span className="plan-dot" />
                  <div>
                    <strong>{plan.display_name}</strong>
                    <span>
                      {count} user{count === 1 ? "" : "s"} ×{" "}
                      {money(Number(plan.price || 0))}
                    </span>
                  </div>
                </div>
                <div className="revenue-progress">
                  <div>
                    <span style={{ width: `${share}%` }} />
                  </div>
                </div>
                <strong className="revenue-amount">
                  {money(amount)}
                </strong>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="note">
        <strong>Revenue note:</strong> This is an estimated MRR based
        on the current users' plans. Real payment transactions are not
        connected yet.
      </div>
    </div>
  );
}

function PlansSection({
  plans,
  planCounts,
  onCreate,
  onEdit,
  onDelete,
}: {
  plans: Plan[];
  planCounts: Record<string, number>;
  onCreate: () => void;
  onEdit: (p: Plan) => void;
  onDelete: (p: Plan) => void;
}) {
  return (
    <div className="page-body">
      <div className="section-heading">
        <div>
          <h2>Subscription Plans</h2>
          <p>Manage pricing, limits, storage and features.</p>
        </div>
        <button className="primary-button" onClick={onCreate}>
          <Icon name="plus" />
          Create plan
        </button>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            className={`plan-card ${
              plan.is_active ? "" : "disabled"
            }`}
            key={plan.id}
          >
            <div className="plan-top">
              <div>
                <span className="plan-label">
                  {plan.name}
                </span>
                <h3>{plan.display_name}</h3>
              </div>
              <span
                className={
                  plan.is_active
                    ? "active-pill"
                    : "inactive-pill"
                }
              >
                {plan.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="plan-price">
              <strong>{money(Number(plan.price || 0))}</strong>
              <span>/ month</span>
            </div>

            <div className="plan-users">
              <b>{planCounts[plan.name.toLowerCase()] || 0}</b>
              users on this plan
            </div>

            <div className="plan-specs">
              <div>
                <span>AI Shorts / month</span>
                <b>{plan.monthly_video_limit}</b>
              </div>
              <div>
                <span>Max video</span>
                <b>{minutes(plan.max_video_duration)}</b>
              </div>
              <div>
                <span>Shorts / video</span>
                <b>{plan.max_shorts_per_video}</b>
              </div>
              <div>
                <span>Storage</span>
                <b>{plan.storage_limit_gb} GB</b>
              </div>
            </div>

            <div className="plan-actions">
              <button
                className="small-button"
                onClick={() => onEdit(plan)}
              >
                <Icon name="edit" />
                Edit
              </button>
              <button
                className="danger-button"
                disabled={plan.name.toLowerCase() === "free"}
                onClick={() => onDelete(plan)}
              >
                <Icon name="delete" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsSection({
  totalUsers,
  activeUsers,
  uploadedVideos,
  generatedShorts,
  activeJobs,
  revenue,
  paidUsers,
  conversion,
  plans,
  planCounts,
}: {
  totalUsers: number;
  activeUsers: number;
  uploadedVideos: number;
  generatedShorts: number;
  activeJobs: number;
  revenue: number;
  paidUsers: number;
  conversion: number;
  plans: Plan[];
  planCounts: Record<string, number>;
}) {
  function printReport() {
    window.print();
  }

  return (
    <div className="page-body">
      <div className="section-heading">
        <div>
          <h2>Reports</h2>
          <p>Current platform summary and subscription report.</p>
        </div>
        <button className="primary-button" onClick={printReport}>
          Print report
        </button>
      </div>

      <Panel title="Platform report" subtitle="Current snapshot">
        <div className="report-grid">
          <ReportItem label="Total users" value={totalUsers} />
          <ReportItem label="Active users" value={activeUsers} />
          <ReportItem label="Uploaded videos" value={uploadedVideos} />
          <ReportItem label="Generated shorts" value={generatedShorts} />
          <ReportItem label="Active jobs" value={activeJobs} />
          <ReportItem label="Paid users" value={paidUsers} />
          <ReportItem
            label="Paid conversion"
            value={`${conversion.toFixed(1)}%`}
          />
          <ReportItem
            label="Estimated MRR"
            value={money(revenue)}
          />
        </div>
      </Panel>

      <Panel title="Subscription report" subtitle="Users and estimated MRR">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Users</th>
                <th>Estimated MRR</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const count =
                  planCounts[plan.name.toLowerCase()] || 0;
                return (
                  <tr key={plan.id}>
                    <td>
                      <strong>{plan.display_name}</strong>
                    </td>
                    <td>{money(Number(plan.price || 0))}</td>
                    <td>{count}</td>
                    <td>
                      <strong>
                        {money(
                          count * Number(plan.price || 0)
                        )}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon,
  accent,
  onClick,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      className={`metric-card ${accent ? "accent" : ""}`}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <div className="metric-icon">{icon}</div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </Tag>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PlanDistribution({
  plans,
  counts,
}: {
  plans: Plan[];
  counts: Record<string, number>;
}) {
  const total = Object.values(counts).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="distribution">
      {plans.map((plan) => {
        const count =
          counts[plan.name.toLowerCase()] || 0;
        const percent =
          total > 0 ? (count / total) * 100 : 0;

        return (
          <div className="distribution-row" key={plan.id}>
            <div className="distribution-label">
              <span />
              <strong>{plan.display_name}</strong>
              <b>{count}</b>
            </div>
            <div className="distribution-track">
              <i style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ReportItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="report-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <span>⌕</span>
      <strong>{text}</strong>
    </div>
  );
}

function UserModal({
  user,
  plans,
  saving,
  onClose,
  onSave,
}: {
  user: User;
  plans: Plan[];
  saving: boolean;
  onClose: () => void;
  onSave: (u: User) => void;
}) {
  const [draft, setDraft] = useState<User>(user);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span>USER MANAGEMENT</span>
            <h2>Edit user</h2>
          </div>
          <button onClick={onClose}>×</button>
        </div>

        <div className="form-grid">
          <label>
            Username
            <input
              value={draft.username}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  username: e.target.value,
                })
              }
            />
          </label>

          <label>
            Email
            <input
              value={draft.email}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  email: e.target.value,
                })
              }
            />
          </label>

          <label>
            Plan
            <select
              value={draft.plan}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  plan: e.target.value,
                })
              }
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.name}>
                  {plan.display_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Role
            <select
              value={draft.role}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  role: e.target.value,
                })
              }
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={draft.is_active !== false}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  is_active: e.target.checked,
                })
              }
            />
            Active account
          </label>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={saving}
            onClick={() => onSave(draft)}
          >
            {saving ? "Saving..." : "Save user"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanModal({
  plan,
  saving,
  onClose,
  onSave,
}: {
  plan: Plan;
  saving: boolean;
  onClose: () => void;
  onSave: (p: Plan) => void;
}) {
  const [draft, setDraft] = useState<Plan>({
    ...plan,
    features: [...(plan.features || [])],
  });

  function update(
    key: keyof Plan,
    value: string | number | boolean
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateFeatures(value: string) {
    setDraft((current) => ({
      ...current,
      features: value
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    }));
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal wide"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span>PLAN MANAGEMENT</span>
            <h2>
              {draft.id === 0 ? "Create plan" : "Edit plan"}
            </h2>
          </div>
          <button onClick={onClose}>×</button>
        </div>

        <div className="form-grid">
          <label>
            Name
            <input
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="pro"
            />
          </label>

          <label>
            Display name
            <input
              value={draft.display_name}
              onChange={(e) =>
                update("display_name", e.target.value)
              }
              placeholder="Pro"
            />
          </label>

          <label>
            Price / month
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(e) =>
                update("price", Number(e.target.value))
              }
            />
          </label>

          <label>
            Monthly video limit
            <input
              type="number"
              min="0"
              value={draft.monthly_video_limit}
              onChange={(e) =>
                update(
                  "monthly_video_limit",
                  Number(e.target.value)
                )
              }
            />
          </label>

          <label>
            Max video duration (seconds)
            <input
              type="number"
              min="1"
              value={draft.max_video_duration}
              onChange={(e) =>
                update(
                  "max_video_duration",
                  Number(e.target.value)
                )
              }
            />
          </label>

          <label>
            Max shorts / video
            <input
              type="number"
              min="1"
              value={draft.max_shorts_per_video}
              onChange={(e) =>
                update(
                  "max_shorts_per_video",
                  Number(e.target.value)
                )
              }
            />
          </label>

          <label>
            Storage (GB)
            <input
              type="number"
              min="0"
              step="0.1"
              value={draft.storage_limit_gb}
              onChange={(e) =>
                update(
                  "storage_limit_gb",
                  Number(e.target.value)
                )
              }
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) =>
                update("is_active", e.target.checked)
              }
            />
            Active plan
          </label>

          <label className="full">
            Features — one per line
            <textarea
              rows={5}
              value={(draft.features || []).join("\n")}
              onChange={(e) =>
                updateFeatures(e.target.value)
              }
              placeholder={
                "100 AI Shorts / month\n25 GB storage\nMax video 60 min"
              }
            />
          </label>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={saving}
            onClick={() => onSave(draft)}
          >
            {saving
              ? "Saving..."
              : draft.id === 0
              ? "Create plan"
              : "Save plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

const loadingStyles = ".loading-page{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:#07080c;color:white;}.loading-glow{position:absolute;width:420px;height:420px;border-radius:50%;background:rgba(124,58,237,.16);filter:blur(110px);}.loading-card{position:relative;z-index:2;width:min(420px,90%);padding:42px 30px;text-align:center;border:1px solid #252936;border-radius:26px;background:#0d0f15;}.logo-mark{width:58px;height:58px;margin:0 auto 22px;display:flex;align-items:center;justify-content:center;border-radius:17px;background:linear-gradient(135deg,#7c3aed,#d946ef);font-weight:900;}.spinner{width:38px;height:38px;margin:0 auto 20px;border:3px solid #252936;border-top-color:#8b5cf6;border-right-color:#d946ef;border-radius:50%;animation:spin .8s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}h2{margin:0;font-size:21px;}p{color:#777e8d;font-size:13px;}";;

const errorStyles = ".error-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#07080c;color:white;}.error-card{width:min(430px,100%);padding:44px 32px;text-align:center;border:1px solid #29232a;border-radius:25px;background:#101218;}.error-icon{width:60px;height:60px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;border-radius:18px;background:rgba(239,68,68,.1);color:#f87171;font-size:28px;font-weight:900;}.error-card span{color:#717887;font-size:10px;font-weight:800;letter-spacing:2px;}.error-card h1{margin:9px 0;font-size:27px;}.error-card p{color:#858b99;font-size:13px;}.error-card button{border:0;border-radius:12px;padding:12px 22px;background:white;color:#090a0d;font-weight:800;cursor:pointer;}";;

const styles = "*{box-sizing:border-box;}body{margin:0;background:#07080c;}.admin-page{min-height:100vh;display:flex;background:#07080c;color:#f6f7fb;font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;}.sidebar{width:260px;min-width:260px;min-height:100vh;position:sticky;top:0;display:flex;flex-direction:column;padding:22px 16px;border-right:1px solid #20232d;background:#0a0c11;}.brand{display:flex;align-items:center;gap:11px;padding:4px 7px 24px;}.brand-mark{width:39px;height:39px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#d946ef);font-weight:900;}.brand strong{display:block;font-size:15px;}.brand span{display:block;margin-top:2px;color:#686f7f;font-size:8px;font-weight:800;letter-spacing:1.7px;}.mobile-close{display:none;margin-left:auto;background:transparent;border:0;color:#aab0bd;font-size:27px;}.nav-label{padding:0 10px 9px;color:#545b69;font-size:9px;font-weight:900;letter-spacing:1.6px;}nav{display:grid;gap:4px;}.nav-button{width:100%;display:flex;align-items:center;gap:11px;padding:11px 12px;border:1px solid transparent;border-radius:11px;background:transparent;color:#8c93a2;text-align:left;font-size:13px;font-weight:700;cursor:pointer;}.nav-button:hover{background:#11141b;color:#e7e9ef;}.nav-button.active{background:linear-gradient(90deg,rgba(124,58,237,.19),rgba(217,70,239,.06));border-color:rgba(139,92,246,.25);color:#fff;}.nav-icon{width:23px;text-align:center;font-size:16px;}.nav-count{margin-left:auto;min-width:22px;padding:2px 6px;border-radius:99px;background:#191c25;color:#8e96a5;font-size:10px;text-align:center;}.platform-button{display:flex;align-items:center;gap:9px;width:100%;padding:11px 12px;border:1px solid #242833;border-radius:11px;background:#10131a;color:#aeb4c1;font-weight:700;cursor:pointer;}.sidebar-spacer{flex:1;}.system-card{display:flex;align-items:center;gap:10px;padding:12px;margin-bottom:12px;border:1px solid #1f2930;border-radius:13px;background:rgba(16,185,129,.035);}.system-dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 14px #34d399;}.system-card strong{display:block;font-size:11px;}.system-card span{display:block;margin-top:3px;color:#626b79;font-size:9px;}.profile{display:flex;align-items:center;gap:10px;padding:12px 4px;border-top:1px solid #1d2028;}.avatar,.table-avatar{display:flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(135deg,#334155,#7c3aed);color:#fff;font-weight:800;}.avatar{width:34px;height:34px;font-size:12px;}.profile strong{display:block;font-size:11px;}.profile span{display:block;margin-top:2px;color:#646c79;font-size:9px;}.refresh-button,.logout-button{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:9px;border:0;border-radius:10px;background:transparent;color:#747c8b;font-size:11px;font-weight:700;cursor:pointer;}.logout-button{color:#a06b72;}.content{flex:1;min-width:0;}.topbar{min-height:96px;display:flex;align-items:center;justify-content:space-between;padding:22px 34px;border-bottom:1px solid #1d2028;background:rgba(7,8,12,.92);position:sticky;top:0;z-index:10;backdrop-filter:blur(18px);}.topbar-left{display:flex;align-items:center;gap:15px;}.breadcrumb{color:#555c6b;font-size:10px;font-weight:700;}.breadcrumb span{margin:0 6px;color:#303541;}.topbar h1{margin:5px 0 0;font-size:25px;letter-spacing:-.6px;}.topbar p{margin:3px 0 0;color:#666e7d;font-size:11px;}.top-refresh{display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #252a35;border-radius:10px;background:#10131a;color:#a8afbc;cursor:pointer;}.mobile-menu{display:none;border:0;background:transparent;color:#fff;font-size:22px;}.page-body{padding:28px 34px 50px;max-width:1500px;margin:0 auto;}.stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px;}.stats-grid.two{grid-template-columns:repeat(2,minmax(0,1fr));}.metric-card{display:flex;align-items:center;gap:15px;min-height:112px;padding:18px;border:1px solid #20242e;border-radius:16px;background:#0e1016;color:#fff;text-align:left;}button.metric-card{cursor:pointer;}.metric-card:hover{border-color:#343a48;transform:translateY(-1px);}.metric-card.accent{background:linear-gradient(135deg,rgba(124,58,237,.16),rgba(217,70,239,.045));border-color:rgba(124,58,237,.3);}.metric-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:13px;background:#171a23;color:#a78bfa;font-size:18px;font-weight:900;}.metric-copy span,.metric-copy small{display:block;color:#737b8a;font-size:10px;}.metric-copy strong{display:block;margin:4px 0;font-size:25px;letter-spacing:-.5px;}.two-col{display:grid;grid-template-columns:1.1fr .9fr;gap:16px;margin-bottom:16px;}.panel{padding:20px;margin-bottom:16px;border:1px solid #20242e;border-radius:16px;background:#0e1016;}.panel-head,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:18px;}.panel-head h2,.section-heading h2{margin:0;font-size:14px;}.panel-head p,.section-heading p{margin:4px 0 0;color:#626a79;font-size:10px;}.link-button{border:0;background:transparent;color:#a78bfa;font-weight:700;cursor:pointer;}.health-row{display:flex;align-items:center;gap:11px;padding:14px;border-radius:12px;background:#11151a;}.health-dot{width:9px;height:9px;border-radius:50%;background:#34d399;}.health-row strong,.health-row span{display:block;}.health-row strong{font-size:11px;}.health-row span{margin-top:3px;color:#68717f;font-size:9px;}.health-row b{margin-left:auto;color:#34d399;font-size:9px;}.mini-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px;}.mini-stat{padding:12px;border:1px solid #1d222c;border-radius:11px;}.mini-stat span{display:block;color:#626a78;font-size:9px;}.mini-stat strong{display:block;margin-top:5px;font-size:16px;}.distribution-row{margin-bottom:13px;}.distribution-label{display:flex;align-items:center;gap:7px;margin-bottom:6px;font-size:10px;}.distribution-label span{width:7px;height:7px;border-radius:50%;background:#8b5cf6;}.distribution-label b{margin-left:auto;}.distribution-track,.revenue-progress>div{height:6px;overflow:hidden;border-radius:99px;background:#191d26;}.distribution-track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#7c3aed,#d946ef);}.revenue-big strong{display:block;font-size:34px;letter-spacing:-1px;}.revenue-big span{color:#69717f;font-size:10px;}.revenue-bar{display:flex;height:9px;overflow:hidden;margin:20px 0 14px;border-radius:99px;background:#181b23;}.revenue-segment{min-width:0;background:linear-gradient(90deg,#7c3aed,#d946ef);border-right:2px solid #0e1016;}.revenue-legend{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}.revenue-legend div{display:flex;align-items:center;gap:6px;color:#737b89;font-size:9px;}.revenue-legend b{margin-left:auto;color:#d9dce3;}.legend-dot,.plan-dot{width:7px;height:7px;border-radius:50%;background:#8b5cf6;}.alert{display:flex;align-items:center;justify-content:space-between;margin:16px 34px 0;padding:11px 14px;border:1px solid rgba(248,113,113,.25);border-radius:11px;background:rgba(127,29,29,.12);color:#fca5a5;font-size:11px;}.alert button{border:0;background:transparent;color:#fca5a5;cursor:pointer;}.toast{position:fixed;right:24px;bottom:24px;z-index:100;padding:12px 15px;border:1px solid rgba(52,211,153,.3);border-radius:12px;background:#101a17;color:#6ee7b7;font-size:11px;box-shadow:0 15px 40px rgba(0,0,0,.35);}.search-box{display:flex;align-items:center;gap:7px;padding:8px 10px;border:1px solid #272c36;border-radius:10px;background:#0a0c11;}.search-box input{width:190px;border:0;outline:0;background:transparent;color:#fff;font-size:11px;}.table-wrap{overflow-x:auto;}table{width:100%;border-collapse:collapse;min-width:720px;}th{padding:10px 8px;border-bottom:1px solid #222630;color:#555d6c;font-size:9px;font-weight:800;text-align:left;text-transform:uppercase;letter-spacing:1px;}td{padding:12px 8px;border-bottom:1px solid #191c24;color:#b9bec9;font-size:11px;}.right{text-align:right;}.user-cell{display:flex;align-items:center;gap:10px;}.table-avatar{width:30px;height:30px;font-size:10px;}.user-cell strong,.user-cell span{display:block;}.user-cell strong{color:#f1f3f7;}.user-cell span{margin-top:2px;color:#606876;font-size:9px;}.badge{display:inline-flex;padding:4px 8px;border-radius:99px;background:rgba(124,58,237,.12);color:#b9a2ff;font-size:9px;font-weight:800;text-transform:capitalize;}.role{color:#9aa1ae;text-transform:capitalize;}.status{display:inline-flex;align-items:center;gap:6px;font-size:9px;}.status i{width:6px;height:6px;border-radius:50%;background:#34d399;}.status.inactive{color:#9ca3af;}.status.inactive i{background:#6b7280;}.status.active{color:#6ee7b7;}.actions{display:flex;justify-content:flex-end;gap:6px;}.small-button,.danger-button,.secondary-button{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:7px 9px;border:1px solid #292e39;border-radius:8px;background:#151820;color:#b9bfca;font-size:9px;font-weight:700;cursor:pointer;}.danger-button{border-color:rgba(248,113,113,.2);background:rgba(127,29,29,.1);color:#fca5a5;}.danger-button:disabled{opacity:.35;cursor:not-allowed;}.primary-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 14px;border:0;border-radius:9px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:10px;font-weight:800;cursor:pointer;}.primary-button:disabled{opacity:.55;cursor:not-allowed;}.secondary-button{padding:10px 14px;}.empty,.empty-large{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:45px 20px;color:#666e7c;}.empty span{font-size:22px;margin-bottom:8px;}.empty strong{font-size:11px;}.empty-large>div{width:52px;height:52px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;border-radius:15px;background:#161a23;color:#8b5cf6;font-size:20px;}.empty-large h3{margin:0;color:#d8dbe2;font-size:13px;}.empty-large p{max-width:430px;margin:7px 0 0;color:#656d7b;font-size:10px;text-align:center;}.processing-card{display:flex;align-items:center;gap:13px;padding:16px;border:1px solid #202631;border-radius:13px;background:#10131a;}.processing-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:rgba(124,58,237,.13);color:#a78bfa;font-size:20px;}.processing-card strong,.processing-card span{display:block;}.processing-card strong{font-size:11px;}.processing-card span{margin-top:4px;color:#68717e;font-size:9px;}.pulse{width:9px;height:9px;margin-left:auto;border-radius:50%;background:#34d399;box-shadow:0 0 16px #34d399;}.revenue-list{display:grid;gap:14px;}.revenue-row{display:grid;grid-template-columns:210px 1fr 100px;align-items:center;gap:15px;}.revenue-plan{display:flex;align-items:center;gap:9px;}.revenue-plan strong,.revenue-plan span{display:block;}.revenue-plan strong{font-size:11px;}.revenue-plan span{margin-top:3px;color:#626a78;font-size:8px;}.revenue-progress>div{height:8px;}.revenue-progress>div>span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#7c3aed,#d946ef);}.revenue-amount{text-align:right;font-size:11px;}.note{padding:13px 15px;border:1px solid #262b36;border-radius:11px;background:#0e1117;color:#727b89;font-size:10px;}.note strong{color:#aeb4c0;}.plans-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;}.plan-card{padding:18px;border:1px solid #252a35;border-radius:16px;background:#0e1016;}.plan-card.disabled{opacity:.62;}.plan-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}.plan-label{color:#737b89;font-size:8px;text-transform:uppercase;letter-spacing:1px;}.plan-card h3{margin:5px 0 0;font-size:16px;}.active-pill,.inactive-pill{padding:4px 7px;border-radius:99px;font-size:8px;font-weight:800;}.active-pill{background:rgba(52,211,153,.1);color:#6ee7b7;}.inactive-pill{background:#1a1d25;color:#777f8c;}.plan-price{display:flex;align-items:baseline;gap:5px;margin:20px 0 5px;}.plan-price strong{font-size:28px;}.plan-price span{color:#646c79;font-size:9px;}.plan-users{color:#69717e;font-size:9px;}.plan-users b{margin-right:4px;color:#e0e3e9;font-size:13px;}.plan-specs{display:grid;gap:8px;margin:18px 0;padding-top:15px;border-top:1px solid #20242e;}.plan-specs div{display:flex;justify-content:space-between;gap:10px;}.plan-specs span{color:#626a78;font-size:9px;}.plan-specs b{color:#c9cdd5;font-size:9px;}.plan-actions{display:flex;gap:7px;}.plan-actions button{flex:1;}.report-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;}.report-item{padding:14px;border:1px solid #20242e;border-radius:11px;background:#10131a;}.report-item span{display:block;color:#626a78;font-size:9px;}.report-item strong{display:block;margin-top:5px;font-size:17px;}.modal-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.68);backdrop-filter:blur(8px);}.modal{width:min(650px,100%);max-height:90vh;overflow-y:auto;padding:22px;border:1px solid #2b303b;border-radius:18px;background:#0d1016;box-shadow:0 30px 100px rgba(0,0,0,.6);}.modal.wide{width:min(780px,100%);}.modal-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;}.modal-head span{color:#676f7e;font-size:8px;font-weight:800;letter-spacing:1.5px;}.modal-head h2{margin:5px 0 0;font-size:18px;}.modal-head button{border:0;background:transparent;color:#8b93a1;font-size:25px;cursor:pointer;}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;}.form-grid label{display:grid;gap:6px;color:#818997;font-size:9px;font-weight:700;}.form-grid label.full{grid-column:1 / -1;}.form-grid input,.form-grid select,.form-grid textarea{width:100%;padding:10px 11px;border:1px solid #282d38;border-radius:9px;outline:none;background:#090c11;color:#eef0f5;font-size:11px;font-family:inherit;}.form-grid textarea{resize:vertical;}.checkbox-label{display:flex !important;grid-template-columns:auto 1fr;align-items:center;gap:8px !important;}.checkbox-label input{width:15px !important;height:15px;}.modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:22px;padding-top:17px;border-top:1px solid #20242d;}.overlay{display:none;}@media (max-width:1100px){.sidebar{width:230px;min-width:230px;}.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.plans-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.two-col{grid-template-columns:1fr;}}@media (max-width:760px){.sidebar{position:fixed;z-index:100;left:0;top:0;transform:translateX(-105%);transition:transform .2s ease;}.sidebar.sidebar-open{transform:translateX(0);}.mobile-close,.mobile-menu{display:block;}.mobile-menu{padding:0;}.overlay{display:block;position:fixed;inset:0;z-index:90;border:0;background:rgba(0,0,0,.55);}.topbar{padding:18px 16px;}.top-actions{display:none;}.page-body{padding:20px 16px 40px;}.alert{margin:12px 16px 0;}.stats-grid,.stats-grid.two{grid-template-columns:1fr;}.mini-grid{grid-template-columns:repeat(2,1fr);}.revenue-legend{grid-template-columns:repeat(2,1fr);}.plans-grid{grid-template-columns:1fr;}.report-grid{grid-template-columns:repeat(2,1fr);}.section-heading{align-items:flex-start;flex-direction:column;}.search-box{width:100%;}.search-box input{width:100%;}.panel-head{align-items:flex-start;flex-direction:column;}.revenue-row{grid-template-columns:1fr;gap:7px;}.revenue-amount{text-align:left;}.form-grid{grid-template-columns:1fr;}.form-grid label.full{grid-column:auto;}}";;

