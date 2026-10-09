import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileSearch,
  Fingerprint,
  Landmark,
  LayoutDashboard,
  Menu,
  Network,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import UploadPage from "./pages/UploadPage";

const navItems = [
  ["Dashboard", LayoutDashboard],
  ["Data Upload", Upload],
  ["Beneficiary Explorer", Users],
  ["Identity Matching", Fingerprint],
  ["Shared Accounts", Landmark],
  ["Network Investigation", Network],
  ["Payment Analysis", CreditCard],
  ["Reports & Cases", FileSearch],
  ["Settings", Settings],
];

const fmt = (value) =>
  value == null || value === ""
    ? "—"
    : Number.isFinite(Number(value))
      ? Number(value).toLocaleString()
      : "—";

function Metric({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
          <Icon size={21} />
        </div>
        <ArrowUpRight size={17} className="text-slate-600" />
      </div>
      <p className="mt-5 text-3xl font-bold">{fmt(value)}</p>
      <p className="mt-2 text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
    </div>
  );
}

function Dashboard({ results, onUpload }) {
  const summary = results?.summary;
  const pairs = results?.review_pairs || [];

  const metrics = [
    {
      label: "Beneficiaries analyzed",
      value: summary?.beneficiaries,
      icon: Users,
      hint: "Records in uploaded dataset",
    },
    {
      label: "Shared accounts",
      value: summary?.shared_accounts,
      icon: Landmark,
      hint: "Accounts linked to multiple beneficiaries",
    },
    {
      label: "Potential duplicate pairs",
      value: summary?.potential_duplicate_pairs,
      icon: Fingerprint,
      hint: "Matches requiring human review",
    },
    {
      label: "Transactions analyzed",
      value: summary?.transactions,
      icon: CreditCard,
      hint: "Disbursement records processed",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-blue-400">
            AUDITX / Overview
          </p>
          <h1 className="mt-2 text-3xl font-bold">Audit Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            Detect suspicious beneficiary patterns and payment risks.
          </p>
        </div>

        <button
          onClick={onUpload}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
        >
          <Upload size={17} />
          {results ? "Run another audit" : "Upload datasets"}
        </button>
      </div>

      {!results ? (
        <div className="flex gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <ShieldCheck className="mt-0.5 text-blue-400" size={22} />
          <div>
            <p className="font-medium">Ready to analyze your datasets</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Upload beneficiaries, bank accounts, and disbursement CSV files.
              Dashboard numbers appear after the backend completes an audit.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <CheckCircle2 className="text-emerald-400" size={21} />
          <div>
            <p className="font-medium text-emerald-300">
              Latest audit completed
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Potential matches are investigation leads, not proof of fraud.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Review queue</h2>
              <p className="mt-1 text-sm text-slate-400">
                Potential beneficiary matches
              </p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
              {fmt(pairs.length)} pairs
            </span>
          </div>

          {!results ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <FileSearch className="mx-auto text-slate-600" size={30} />
              <p className="mt-3 text-sm text-slate-400">
                No audit results yet.
              </p>
              <button
                onClick={onUpload}
                className="mt-3 text-sm text-blue-400"
              >
                Upload datasets <ChevronRight className="inline" size={15} />
              </button>
            </div>
          ) : pairs.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">
              No review pairs were returned.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Beneficiary 1</th>
                    <th className="px-3 py-3">Beneficiary 2</th>
                    <th className="px-3 py-3">Shared account</th>
                    <th className="px-3 py-3">Risk score</th>
                  </tr>
                </thead>
                <tbody>
                  {pairs.slice(0, 8).map((row, index) => (
                    <tr
                      key={`${row.beneficiary_1}-${row.beneficiary_2}-${index}`}
                      className="border-b border-slate-800/70"
                    >
                      <td className="px-3 py-3">
                        {row.beneficiary_1 || "—"}
                        {row.name_1 ? ` · ${row.name_1}` : ""}
                      </td>
                      <td className="px-3 py-3">
                        {row.beneficiary_2 || "—"}
                        {row.name_2 ? ` · ${row.name_2}` : ""}
                      </td>
                      <td className="px-3 py-3">
                        {row.shared_account || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {row.risk_score ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2">
            <Activity size={19} className="text-blue-400" />
            <h2 className="font-semibold">Audit status</h2>
          </div>

          <div className="mt-5 flex gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                results ? "bg-emerald-400" : "bg-slate-600"
              }`}
            />
            <div>
              <p className="text-sm font-medium">
                {results ? "Results available" : "Waiting for first audit"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {results
                  ? "Latest successful run stored in this browser session."
                  : "Upload the three required CSV datasets to start."}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-950 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Potential review pairs</span>
              <span className="font-semibold">
                {fmt(summary?.review_pairs ?? pairs.length)}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-800">
              <div className="h-full w-full rounded-full bg-blue-500/70" />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Review evidence before drawing conclusions about a beneficiary
              or payment.
            </p>
          </div>
        </section>
      </div>

      <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-slate-300">
        <AlertTriangle className="mt-0.5 text-amber-400" size={19} />
        <p>
          A shared account or similar name may have a legitimate explanation.
          AUDITX supports investigation; it does not prove fraud.
        </p>
      </div>
    </div>
  );
}

function Placeholder({ title, onUpload }) {
  const Icon = navItems.find(([name]) => name === title)?.[1] || CircleHelp;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 md:p-12">
      <div className="inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-400">
        <Icon size={25} />
      </div>
      <h1 className="mt-5 text-2xl font-bold">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
        This section is a placeholder in the current demo.
      </p>
      <button
        onClick={onUpload}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold"
      >
        <Upload size={17} />
        Go to Data Upload
      </button>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [auditResults, setAuditResults] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        {menuOpen && (
          <button
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform lg:static lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
            <div className="rounded-xl bg-blue-600 p-2">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-wide">AUDITX</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Financial Intelligence
              </p>
            </div>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={19} />
            </button>
          </div>

          <div className="px-4 pt-6">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Workspace
            </p>
            <nav className="mt-3 space-y-1">
              {navItems.map(([label, Icon]) => (
                <button
                  key={label}
                  onClick={() => navigate(label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${
                    activePage === label
                      ? "bg-blue-600/15 font-semibold text-blue-300"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {label === "Data Upload" && (
                    <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px]">
                      CSV
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-800 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Activity size={17} />
              </div>
              <div>
                <p className="text-xs font-medium">Audit engine</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Local API integration
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-sm font-semibold">{activePage}</p>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Automated Financial Micro-Audit & Ghost-Beneficiary Detection
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Local workspace
              </span>
              <button
                title="Notifications"
                className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-900"
              >
                <Bell size={17} />
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-4 md:p-8">
            {activePage === "Dashboard" ? (
              <Dashboard
                results={auditResults}
                onUpload={() => navigate("Data Upload")}
              />
            ) : activePage === "Data Upload" ? (
              <UploadPage
                onAuditComplete={setAuditResults}
                onBack={() => navigate("Dashboard")}
              />
            ) : (
              <Placeholder
                title={activePage}
                onUpload={() => navigate("Data Upload")}
              />
            )}

            <footer className="mt-10 border-t border-slate-900 pt-5 text-xs text-slate-600">
              AUDITX · Local demo · Review all risk indicators before drawing
              conclusions
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}