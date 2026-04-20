import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";

type Domain = "RET" | "CORP" | "PAYMENTS";
type ViewMode = "blended" | "real";

type RoleMix = {
  developerMD: number;
  testerMD: number;
  analystMD: number;
  architectMD: number;
};

type ProjectBase = {
  id: string;
  name: string;
  domain: Domain;
  mandays: number;
  blendedRate: number;
  realRate: number;
  roleMix: RoleMix;
};

type Project = ProjectBase & {
  blendedCost: number;
  realCost: number;
  varianceAbsolute: number;
  variancePercent: number;
};

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat("en-US");

const dummyProjects: ProjectBase[] = [
  {
    id: "P-001",
    name: "Retail Revamp",
    domain: "RET",
    mandays: 240,
    blendedRate: 13000,
    realRate: 9800,
    roleMix: { developerMD: 140, testerMD: 45, analystMD: 35, architectMD: 20 },
  },
  {
    id: "P-002",
    name: "POS Sync",
    domain: "RET",
    mandays: 175,
    blendedRate: 12800,
    realRate: 9400,
    roleMix: { developerMD: 105, testerMD: 32, analystMD: 23, architectMD: 15 },
  },
  {
    id: "P-003",
    name: "Loyalty Engine",
    domain: "RET",
    mandays: 210,
    blendedRate: 13200,
    realRate: 10300,
    roleMix: { developerMD: 123, testerMD: 40, analystMD: 30, architectMD: 17 },
  },
  {
    id: "P-004",
    name: "Corporate BI Hub",
    domain: "CORP",
    mandays: 280,
    blendedRate: 12900,
    realRate: 11100,
    roleMix: { developerMD: 145, testerMD: 52, analystMD: 58, architectMD: 25 },
  },
  {
    id: "P-005",
    name: "HR Workflow",
    domain: "CORP",
    mandays: 165,
    blendedRate: 12700,
    realRate: 11600,
    roleMix: { developerMD: 78, testerMD: 33, analystMD: 39, architectMD: 15 },
  },
  {
    id: "P-006",
    name: "Finance Controls",
    domain: "CORP",
    mandays: 230,
    blendedRate: 13100,
    realRate: 10800,
    roleMix: { developerMD: 122, testerMD: 41, analystMD: 44, architectMD: 23 },
  },
  {
    id: "P-007",
    name: "Payments Gateway",
    domain: "PAYMENTS",
    mandays: 260,
    blendedRate: 13400,
    realRate: 10100,
    roleMix: { developerMD: 150, testerMD: 54, analystMD: 34, architectMD: 22 },
  },
  {
    id: "P-008",
    name: "Fraud Shield",
    domain: "PAYMENTS",
    mandays: 225,
    blendedRate: 13300,
    realRate: 9700,
    roleMix: { developerMD: 130, testerMD: 45, analystMD: 30, architectMD: 20 },
  },
  {
    id: "P-009",
    name: "SEPA Modernization",
    domain: "PAYMENTS",
    mandays: 195,
    blendedRate: 13000,
    realRate: 10900,
    roleMix: { developerMD: 107, testerMD: 36, analystMD: 34, architectMD: 18 },
  },
  {
    id: "P-010",
    name: "Merchant API",
    domain: "PAYMENTS",
    mandays: 185,
    blendedRate: 12600,
    realRate: 12300,
    roleMix: { developerMD: 99, testerMD: 34, analystMD: 36, architectMD: 16 },
  },
];

const computeProject = (p: ProjectBase): Project => {
  const blendedCost = p.mandays * p.blendedRate;
  const realCost = p.mandays * p.realRate;
  const varianceAbsolute = blendedCost - realCost;
  const variancePercent = realCost === 0 ? 0 : (varianceAbsolute / realCost) * 100;
  return {
    ...p,
    blendedCost,
    realCost,
    varianceAbsolute,
    variancePercent,
  };
};

const domains: Array<Domain | "ALL"> = ["ALL", "RET", "CORP", "PAYMENTS"];

const colors = {
  blended: "#2563eb",
  real: "#10b981",
  negative: "#dc2626",
  neutral: "#2563eb",
};

const cardClass =
  "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 md:p-5 transition-all";

const sectionTitleClass = "text-sm font-semibold text-slate-700 tracking-wide";

export default function ITCostDashboard() {
  const [selectedDomain, setSelectedDomain] = useState<Domain | "ALL">("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRoleProjectId, setSelectedRoleProjectId] = useState<string>("P-001");
  const [viewMode, setViewMode] = useState<ViewMode>("blended");

  const projects = useMemo(() => dummyProjects.map(computeProject), []);

  const filteredProjects = useMemo(() => {
    const scoped =
      selectedDomain === "ALL"
        ? projects
        : projects.filter((p) => p.domain === selectedDomain);
    return scoped;
  }, [projects, selectedDomain]);

  const activeProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return filteredProjects.find((p) => p.id === selectedProjectId) ?? null;
  }, [selectedProjectId, filteredProjects]);

  const roleMixProject = useMemo(() => {
    return (
      projects.find((p) => p.id === selectedRoleProjectId) ??
      filteredProjects[0] ??
      projects[0]
    );
  }, [projects, filteredProjects, selectedRoleProjectId]);

  const totals = useMemo(() => {
    const totalBlended = filteredProjects.reduce((acc, p) => acc + p.blendedCost, 0);
    const totalReal = filteredProjects.reduce((acc, p) => acc + p.realCost, 0);
    const varianceAbs = totalBlended - totalReal;
    const variancePct = totalReal === 0 ? 0 : (varianceAbs / totalReal) * 100;
    const distortionIndex = totalReal === 0 ? 0 : totalBlended / totalReal;

    return {
      totalBlended,
      totalReal,
      varianceAbs,
      variancePct,
      distortionIndex,
    };
  }, [filteredProjects]);

  const domainAggregates = useMemo(() => {
    const map = new Map<Domain, { domain: Domain; mandays: number; blended: number; real: number }>();
    projects.forEach((p) => {
      const current = map.get(p.domain) ?? {
        domain: p.domain,
        mandays: 0,
        blended: 0,
        real: 0,
      };
      current.mandays += p.mandays;
      current.blended += p.blendedCost;
      current.real += p.realCost;
      map.set(p.domain, current);
    });
    return Array.from(map.values());
  }, [projects]);

  const rolePieData = useMemo(() => {
    const mix = roleMixProject.roleMix;
    return [
      { name: "Developer", value: mix.developerMD, color: "#2563eb" },
      { name: "Tester", value: mix.testerMD, color: "#10b981" },
      { name: "Analyst", value: mix.analystMD, color: "#f59e0b" },
      { name: "Architect", value: mix.architectMD, color: "#8b5cf6" },
    ];
  }, [roleMixProject]);

  const scatterData = filteredProjects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    x: p.realCost,
    y: Number(p.variancePercent.toFixed(2)),
  }));

  const chartModeLabel = viewMode === "blended" ? "Blended-first lens" : "Real-first lens";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              IT Cost Distortion Dashboard
            </h1>
            <p className="text-slate-600 mt-1">
              Compare blended pricing versus real role-weighted costs across projects.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-sm text-slate-700">
              Domain:
              <select
                className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value as Domain | "ALL");
                  setSelectedProjectId(null);
                }}
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setViewMode((v) => (v === "blended" ? "real" : "blended"))}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100"
              title="Switch chart emphasis between blended and real perspective."
            >
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
              {viewMode === "blended" ? "Show Real View" : "Show Blended View"}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className={cardClass}>
            <p className={sectionTitleClass}>Total Blended Cost</p>
            <p className="mt-2 text-xl font-semibold">{CURRENCY.format(totals.totalBlended)}</p>
          </div>
          <div className={cardClass}>
            <p className={sectionTitleClass}>Total Real Cost</p>
            <p className="mt-2 text-xl font-semibold">{CURRENCY.format(totals.totalReal)}</p>
          </div>
          <div className={cardClass}>
            <p className={sectionTitleClass}>Total Variance</p>
            <p
              className={`mt-2 text-xl font-semibold ${
                totals.varianceAbs >= 0 ? "text-red-600" : "text-blue-600"
              }`}
            >
              {CURRENCY.format(totals.varianceAbs)}
            </p>
          </div>
          <div className={cardClass}>
            <p className={sectionTitleClass}>Variance (%)</p>
            <p
              className={`mt-2 text-xl font-semibold ${
                totals.variancePct >= 0 ? "text-red-600" : "text-blue-600"
              }`}
            >
              {totals.variancePct.toFixed(1)}%
            </p>
          </div>
          <div className={cardClass}>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              Cost Distortion Index
              <span
                title="Cost Distortion Index = Total Blended Cost / Total Real Cost. Above 1 means blended pricing inflates cost perception."
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 cursor-help"
              >
                i
              </span>
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {totals.distortionIndex.toFixed(2)}x
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className={`${cardClass} xl:col-span-2`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Project Comparison</h2>
              <span className="text-xs text-slate-500">{chartModeLabel}</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredProjects} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`} />
                  <Tooltip
                    formatter={(value: number) => CURRENCY.format(value)}
                    labelFormatter={(label) => `Project: ${label}`}
                    contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="blendedCost"
                    name="Blended Cost"
                    fill={viewMode === "blended" ? colors.blended : "#93c5fd"}
                    radius={[8, 8, 0, 0]}
                    onClick={(d) => setSelectedProjectId(d.id)}
                  />
                  <Bar
                    dataKey="realCost"
                    name="Real Cost"
                    fill={viewMode === "real" ? colors.real : "#86efac"}
                    radius={[8, 8, 0, 0]}
                    onClick={(d) => setSelectedProjectId(d.id)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {activeProject ? (
              <p className="mt-3 text-sm text-slate-700">
                Selected: <span className="font-medium">{activeProject.name}</span> | Variance:{" "}
                <span
                  className={
                    activeProject.varianceAbsolute >= 0 ? "text-red-600 font-semibold" : "text-blue-600 font-semibold"
                  }
                >
                  {CURRENCY.format(activeProject.varianceAbsolute)} ({activeProject.variancePercent.toFixed(1)}%)
                </span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Click a project bar or scatter dot to highlight it.</p>
            )}
          </div>

          <div className={cardClass}>
            <h2 className="text-base font-semibold mb-3">Role Mix Analysis</h2>
            <label className="text-sm text-slate-700">
              Project:
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={roleMixProject.id}
                onChange={(e) => setSelectedRoleProjectId(e.target.value)}
              >
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="h-64 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(v: number) => `${v} MD`} />
                  <Legend />
                  <Pie data={rolePieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88}>
                    {rolePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className={cardClass}>
            <h2 className="text-base font-semibold mb-3">Variance Heatmap Table</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200 text-slate-600">
                    <th className="py-2 pr-3">Project</th>
                    <th className="py-2 pr-3">Domain</th>
                    <th className="py-2 pr-3">Mandays</th>
                    <th className="py-2 pr-3">Blended</th>
                    <th className="py-2 pr-3">Real</th>
                    <th className="py-2 pr-3">Variance %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((p) => {
                    const isOverpriced = p.variancePercent > 0;
                    const rowBg = isOverpriced ? "bg-red-50" : "bg-blue-50";
                    const isSelected = selectedProjectId === p.id;
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${rowBg} ${
                          isSelected ? "ring-2 ring-inset ring-indigo-400" : ""
                        }`}
                        onClick={() => setSelectedProjectId(p.id)}
                      >
                        <td className="py-2 pr-3 font-medium">{p.name}</td>
                        <td className="py-2 pr-3">{p.domain}</td>
                        <td className="py-2 pr-3">{NUMBER.format(p.mandays)}</td>
                        <td className="py-2 pr-3">{CURRENCY.format(p.blendedCost)}</td>
                        <td className="py-2 pr-3">{CURRENCY.format(p.realCost)}</td>
                        <td
                          className={`py-2 pr-3 font-semibold ${
                            isOverpriced ? "text-red-700" : "text-blue-700"
                          }`}
                        >
                          {p.variancePercent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-base font-semibold mb-3">Domain View (Aggregated)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domainAggregates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="domain" />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      CURRENCY.format(value),
                      name === "blended" ? "Blended Cost" : name === "real" ? "Real Cost" : "Mandays",
                    ]}
                    contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                  />
                  <Legend />
                  <Bar dataKey="blended" name="Blended Cost" fill={colors.blended} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="real" name="Real Cost" fill={colors.real} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold mb-3">Project Distortion Scatter</h2>
          <p className="text-xs text-slate-500 mb-2">
            X = Real Cost, Y = Variance %. Top-right points are expensive and strongly distorted.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Real Cost"
                  tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`}
                />
                <YAxis type="number" dataKey="y" name="Variance %" unit="%" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: number, name) =>
                    name === "Real Cost" ? CURRENCY.format(value) : `${value.toFixed(2)}%`
                  }
                  labelFormatter={(_, payload) =>
                    payload && payload[0] ? `${payload[0].payload.projectName}` : ""
                  }
                  contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                />
                <Scatter
                  name="Projects"
                  data={scatterData}
                  fill={colors.neutral}
                  onClick={(d) => setSelectedProjectId(d.projectId)}
                  shape={(props: any) => {
                    const isSelected = selectedProjectId === props.payload.projectId;
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={isSelected ? 8 : 6}
                        fill={isSelected ? colors.negative : colors.neutral}
                        stroke={isSelected ? "#7f1d1d" : "#1e40af"}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        <footer className="text-xs text-slate-500">
          Clean management view with dummy data. Values illustrate how blended rates can mask role-based cost reality.
        </footer>
      </div>
    </div>
  );
}
