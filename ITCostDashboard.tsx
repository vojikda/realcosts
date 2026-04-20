import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

type CapId = "CAP_RETAIL" | "CAP_CORE" | "CAP_PAYMENTS" | "CAP_DIGITAL";
type Domain = "RETAIL" | "CORE_BANKING" | "PAYMENTS" | "DIGITAL_CHANNELS";
type Scenario = "blended" | "optimized";

type CapPool = {
  id: CapId;
  name: string;
  budgetBlended: number;
};

type ProjectBase = {
  id: string;
  name: string;
  cap: CapId;
  domain: Domain;
  mandays: number;
  blendedRate: number;
  realRate: number;
  developerMD: number;
  testerMD: number;
  analystMD: number;
  architectMD: number;
};

type CapEfficiencyRow = {
  capId: CapId;
  capName: string;
  budget: number;
  blendedConsumption: number;
  realCost: number;
  distortionIndex: number;
  realMDCapacity: number;
  mdGainPercent: number;
  blendedAvgRate: number;
  realAvgRate: number;
};

type SimulationSummary = {
  projectsFit: number;
  totalMD: number;
  totalRealCost: number;
};

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat("en-US");

const capColors: Record<CapId, string> = {
  CAP_RETAIL: "#2563eb",
  CAP_CORE: "#0ea5e9",
  CAP_PAYMENTS: "#10b981",
  CAP_DIGITAL: "#8b5cf6",
};

const caps: CapPool[] = [
  { id: "CAP_RETAIL", name: "RETAIL", budgetBlended: 500_000_000 },
  { id: "CAP_CORE", name: "CORE_BANKING", budgetBlended: 450_000_000 },
  { id: "CAP_PAYMENTS", name: "PAYMENTS", budgetBlended: 400_000_000 },
  { id: "CAP_DIGITAL", name: "DIGITAL_CHANNELS", budgetBlended: 350_000_000 },
];

const projectBase: ProjectBase[] = [
  {
    id: "P1",
    name: "Retail Pricing Engine",
    cap: "CAP_RETAIL",
    domain: "RETAIL",
    mandays: 12000,
    blendedRate: 13000,
    realRate: 10000,
    developerMD: 6000,
    testerMD: 4000,
    analystMD: 1500,
    architectMD: 500,
  },
  {
    id: "P2",
    name: "Customer Segmentation",
    cap: "CAP_RETAIL",
    domain: "RETAIL",
    mandays: 9000,
    blendedRate: 13000,
    realRate: 9800,
    developerMD: 4500,
    testerMD: 3000,
    analystMD: 1200,
    architectMD: 300,
  },
  {
    id: "P10",
    name: "Retail Analytics Platform",
    cap: "CAP_RETAIL",
    domain: "RETAIL",
    mandays: 10000,
    blendedRate: 13000,
    realRate: 9500,
    developerMD: 5500,
    testerMD: 2500,
    analystMD: 1500,
    architectMD: 500,
  },
  {
    id: "P3",
    name: "Core Ledger Modernization",
    cap: "CAP_CORE",
    domain: "CORE_BANKING",
    mandays: 15000,
    blendedRate: 13000,
    realRate: 15000,
    developerMD: 7000,
    testerMD: 2000,
    analystMD: 1000,
    architectMD: 5000,
  },
  {
    id: "P4",
    name: "Regulatory Reporting Engine",
    cap: "CAP_CORE",
    domain: "CORE_BANKING",
    mandays: 11000,
    blendedRate: 13000,
    realRate: 14500,
    developerMD: 4000,
    testerMD: 1500,
    analystMD: 1500,
    architectMD: 4000,
  },
  {
    id: "P9",
    name: "AML Compliance Upgrade",
    cap: "CAP_CORE",
    domain: "CORE_BANKING",
    mandays: 16000,
    blendedRate: 13000,
    realRate: 15500,
    developerMD: 5000,
    testerMD: 2000,
    analystMD: 4000,
    architectMD: 5000,
  },
  {
    id: "P5",
    name: "Instant Payments Platform",
    cap: "CAP_PAYMENTS",
    domain: "PAYMENTS",
    mandays: 13000,
    blendedRate: 13000,
    realRate: 12500,
    developerMD: 6500,
    testerMD: 3000,
    analystMD: 1500,
    architectMD: 2000,
  },
  {
    id: "P6",
    name: "Fraud Detection System",
    cap: "CAP_PAYMENTS",
    domain: "PAYMENTS",
    mandays: 10000,
    blendedRate: 13000,
    realRate: 12000,
    developerMD: 5000,
    testerMD: 2500,
    analystMD: 1500,
    architectMD: 1000,
  },
  {
    id: "P7",
    name: "Mobile Banking App",
    cap: "CAP_DIGITAL",
    domain: "DIGITAL_CHANNELS",
    mandays: 14000,
    blendedRate: 13000,
    realRate: 14000,
    developerMD: 8000,
    testerMD: 3000,
    analystMD: 1500,
    architectMD: 1500,
  },
  {
    id: "P8",
    name: "Web Self-Service Portal",
    cap: "CAP_DIGITAL",
    domain: "DIGITAL_CHANNELS",
    mandays: 9500,
    blendedRate: 13000,
    realRate: 11000,
    developerMD: 5000,
    testerMD: 2500,
    analystMD: 1200,
    architectMD: 800,
  },
];

const cardClass = "rounded-2xl bg-white p-4 md:p-5 shadow-sm ring-1 ring-slate-200";
const sectionTitleClass = "text-base font-semibold text-slate-800";
const explainClass =
  "inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 cursor-help";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ITCostDashboard() {
  const [selectedCap, setSelectedCap] = useState<CapId | "ALL">("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("P1");
  const [scenario, setScenario] = useState<Scenario>("blended");
  const [mixShift, setMixShift] = useState<number>(0);

  const filteredCaps = useMemo(
    () => (selectedCap === "ALL" ? caps : caps.filter((cap) => cap.id === selectedCap)),
    [selectedCap]
  );

  const shiftFactor = 1 - mixShift / 100;

  const projects = useMemo(() => {
    return projectBase
      .filter((project) => selectedCap === "ALL" || project.cap === selectedCap)
      .map((project) => {
        const adjustedRealRate = Math.round(project.realRate * shiftFactor);
        const blendedCost = project.mandays * project.blendedRate;
        const realCost = project.mandays * adjustedRealRate;
        const varianceAbsolute = blendedCost - realCost;
        const variancePercent = realCost === 0 ? 0 : (varianceAbsolute / realCost) * 100;
        return {
          ...project,
          adjustedRealRate,
          blendedCost,
          realCost,
          varianceAbsolute,
          variancePercent,
        };
      });
  }, [selectedCap, shiftFactor]);

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ??
    projects[0] ??
    null;

  const capEfficiencyRows = useMemo<CapEfficiencyRow[]>(() => {
    return filteredCaps.map((cap) => {
      const capProjects = projects.filter((project) => project.cap === cap.id);
      const totalMD = capProjects.reduce((sum, project) => sum + project.mandays, 0);
      const blendedConsumption = capProjects.reduce((sum, project) => sum + project.blendedCost, 0);
      const realCost = capProjects.reduce((sum, project) => sum + project.realCost, 0);
      const blendedAvgRate = totalMD === 0 ? 0 : blendedConsumption / totalMD;
      const realAvgRate = totalMD === 0 ? 0 : realCost / totalMD;
      const distortionIndex = realCost === 0 ? 0 : blendedConsumption / realCost;
      const realMDCapacity = realAvgRate === 0 ? 0 : cap.budgetBlended / realAvgRate;
      const blendedMDCapacity = blendedAvgRate === 0 ? 0 : cap.budgetBlended / blendedAvgRate;
      const mdGainPercent =
        blendedMDCapacity === 0 ? 0 : ((realMDCapacity - blendedMDCapacity) / blendedMDCapacity) * 100;

      return {
        capId: cap.id,
        capName: cap.name,
        budget: cap.budgetBlended,
        blendedConsumption,
        realCost,
        distortionIndex,
        realMDCapacity,
        mdGainPercent,
        blendedAvgRate,
        realAvgRate,
      };
    });
  }, [filteredCaps, projects]);

  const globalKPIs = useMemo(() => {
    const totalBudget = capEfficiencyRows.reduce((sum, row) => sum + row.budget, 0);
    const totalBlendedConsumption = capEfficiencyRows.reduce((sum, row) => sum + row.blendedConsumption, 0);
    const totalRealCost = capEfficiencyRows.reduce((sum, row) => sum + row.realCost, 0);
    const totalVariance = totalBlendedConsumption - totalRealCost;
    const avgDistortionIndex =
      capEfficiencyRows.length === 0
        ? 0
        : capEfficiencyRows.reduce((sum, row) => sum + row.distortionIndex, 0) / capEfficiencyRows.length;
    const totalRealPower = capEfficiencyRows.reduce((sum, row) => sum + row.realMDCapacity, 0);

    return {
      totalBudget,
      totalRealCost,
      totalVariance,
      avgDistortionIndex,
      totalRealPower,
    };
  }, [capEfficiencyRows]);

  const capOverviewData = capEfficiencyRows.map((row) => ({
    capId: row.capId,
    cap: row.capName,
    budget: row.budget,
    realCost: row.realCost,
    purchasingPower: Math.round(row.realMDCapacity),
  }));

  const projectComparisonData = projects.map((project) => ({
    id: project.id,
    name: project.name,
    blendedCost: project.blendedCost,
    realCost: project.realCost,
    varianceAbsolute: project.varianceAbsolute,
    variancePercent: project.variancePercent,
  }));

  const scatterData = projects.map((project) => ({
    id: project.id,
    cap: project.cap,
    name: project.name,
    x: project.realCost,
    y: Number(project.variancePercent.toFixed(2)),
    z: project.mandays,
  }));

  const rolePieData = selectedProject
    ? [
        { name: "Developer", value: selectedProject.developerMD, color: "#2563eb" },
        { name: "Tester", value: selectedProject.testerMD, color: "#10b981" },
        { name: "Analyst", value: selectedProject.analystMD, color: "#0ea5e9" },
        { name: "Architect", value: selectedProject.architectMD, color: "#dc2626" },
      ]
    : [];

  const simulation = useMemo<SimulationSummary>(() => {
    const perCapSimulation = filteredCaps.map((cap) => {
      const capProjects = projects.filter((project) => project.cap === cap.id);
      const sorted = [...capProjects].sort((a, b) => {
        if (scenario === "blended") {
          return a.blendedCost - b.blendedCost;
        }
        const aEfficiency = a.mandays / a.realCost;
        const bEfficiency = b.mandays / b.realCost;
        return bEfficiency - aEfficiency;
      });

      let budgetUsed = 0;
      let realCostUsed = 0;
      let totalMD = 0;
      let projectsFit = 0;

      sorted.forEach((project) => {
        const planningCost = scenario === "blended" ? project.blendedCost : project.realCost;
        if (budgetUsed + planningCost <= cap.budgetBlended) {
          budgetUsed += planningCost;
          realCostUsed += project.realCost;
          totalMD += project.mandays;
          projectsFit += 1;
        }
      });

      return { projectsFit, totalMD, totalRealCost: realCostUsed };
    });

    return perCapSimulation.reduce(
      (acc, current) => ({
        projectsFit: acc.projectsFit + current.projectsFit,
        totalMD: acc.totalMD + current.totalMD,
        totalRealCost: acc.totalRealCost + current.totalRealCost,
      }),
      { projectsFit: 0, totalMD: 0, totalRealCost: 0 }
    );
  }, [filteredCaps, projects, scenario]);

  const totalBlendedCapacity = capEfficiencyRows.reduce(
    (sum, row) => sum + (row.blendedAvgRate === 0 ? 0 : row.budget / row.blendedAvgRate),
    0
  );
  const totalRealCapacity = capEfficiencyRows.reduce(
    (sum, row) => sum + (row.realAvgRate === 0 ? 0 : row.budget / row.realAvgRate),
    0
  );
  const additionalMDOutput = totalRealCapacity - totalBlendedCapacity;
  const mdOutputGainPct = totalBlendedCapacity === 0 ? 0 : (additionalMDOutput / totalBlendedCapacity) * 100;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">CAP Cost Efficiency Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Blended budgeting vs real-cost delivery power for portfolio planning.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-700">
              CAP Filter:
              <select
                className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={selectedCap}
                onChange={(event) => setSelectedCap(event.target.value as CapId | "ALL")}
              >
                <option value="ALL">ALL</option>
                {caps.map((cap) => (
                  <option key={cap.id} value={cap.id}>
                    {cap.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className={cardClass}>
            <p className="text-sm font-semibold text-slate-700">Total Budget (Blended)</p>
            <p className="mt-2 text-xl font-semibold">{CURRENCY.format(globalKPIs.totalBudget)}</p>
          </div>
          <div className={cardClass}>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              Total Real Cost
              <span
                className={explainClass}
                title="Real cost uses role-weighted rates. It reflects managerial economics, not contractual blended pricing."
              >
                i
              </span>
            </p>
            <p className="mt-2 text-xl font-semibold">{CURRENCY.format(globalKPIs.totalRealCost)}</p>
          </div>
          <div className={cardClass}>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              Total Variance
              <span
                className={explainClass}
                title="Blended vs Real Cost variance shows how blended pricing distorts portfolio economics."
              >
                i
              </span>
            </p>
            <p className={`mt-2 text-xl font-semibold ${globalKPIs.totalVariance >= 0 ? "text-red-600" : "text-green-600"}`}>
              {CURRENCY.format(globalKPIs.totalVariance)}
            </p>
          </div>
          <div className={cardClass}>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              Avg Distortion Index
              <span
                className={explainClass}
                title="Cost Distortion Index = blended consumption / real cost. Values above 1 imply inflated budget view."
              >
                i
              </span>
            </p>
            <p className="mt-2 text-xl font-semibold text-blue-700">{globalKPIs.avgDistortionIndex.toFixed(2)}x</p>
          </div>
          <div className={cardClass}>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              Total Real MD Power
              <span
                className={explainClass}
                title="Real Purchasing Power = blended budget divided by average real rate. This estimates delivery capacity in MD."
              >
                i
              </span>
            </p>
            <p className="mt-2 text-xl font-semibold text-green-700">{NUMBER.format(Math.round(globalKPIs.totalRealPower))} MD</p>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className={cardClass}>
            <h2 className={sectionTitleClass}>CAP Overview</h2>
            <p className="text-xs text-slate-500 mt-1">Bars: Budget and real cost | Line: real MD purchasing power</p>
            <div className="h-80 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={capOverviewData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="cap" />
                  <YAxis yAxisId="left" tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${Math.round(value)}`} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "Real MD Purchasing Power") {
                        return [`${NUMBER.format(Math.round(value))} MD`, name];
                      }
                      return [CURRENCY.format(value), name];
                    }}
                    contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="budget"
                    name="Budget"
                    fill="#2563eb"
                    radius={[8, 8, 0, 0]}
                    onClick={(point) => setSelectedCap(point.capId as CapId)}
                  />
                  <Bar yAxisId="left" dataKey="realCost" name="Real Cost" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="purchasingPower"
                    name="Real MD Purchasing Power"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className={sectionTitleClass}>Portfolio Simulation</h2>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setScenario("blended")}
                className={`rounded-lg px-3 py-2 text-sm border ${
                  scenario === "blended"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                Scenario A: Blended Planning
              </button>
              <button
                type="button"
                onClick={() => setScenario("optimized")}
                className={`rounded-lg px-3 py-2 text-sm border ${
                  scenario === "optimized"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                Scenario B: Real Cost Optimized
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">Projects Fit</p>
                <p className="text-lg font-semibold">{simulation.projectsFit}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">MD Delivered</p>
                <p className="text-lg font-semibold text-blue-700">{NUMBER.format(simulation.totalMD)} MD</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">Total Real Cost</p>
                <p className="text-lg font-semibold text-green-700">{CURRENCY.format(simulation.totalRealCost)}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium text-slate-700">What-if: Shift to cheaper resource mix (%)</p>
                <p className="text-slate-600">{mixShift}%</p>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={mixShift}
                onChange={(event) => setMixShift(clamp(Number(event.target.value), 0, 25))}
                className="mt-2 w-full accent-blue-600"
              />
              <div className="mt-3 rounded-xl bg-green-50 p-3 ring-1 ring-green-100">
                <p className="text-sm text-green-800">
                  Potential MD output gain: <span className="font-semibold">{NUMBER.format(Math.round(additionalMDOutput))} MD</span>{" "}
                  ({mdOutputGainPct.toFixed(1)}%) with the same blended budget envelope.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className={sectionTitleClass}>CAP Efficiency Table</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-3">CAP</th>
                  <th className="py-2 pr-3">Budget</th>
                  <th className="py-2 pr-3">Blended Consumption</th>
                  <th className="py-2 pr-3">Real Cost</th>
                  <th className="py-2 pr-3">Distortion Index</th>
                  <th className="py-2 pr-3">Real MD Capacity</th>
                  <th className="py-2 pr-3">Potential MD Gain %</th>
                </tr>
              </thead>
              <tbody>
                {capEfficiencyRows.map((row) => {
                  const efficient = row.mdGainPercent > 20;
                  return (
                    <tr
                      key={row.capId}
                      className={`border-b border-slate-100 cursor-pointer ${
                        efficient ? "bg-green-50" : "bg-red-50"
                      } ${selectedCap === row.capId ? "ring-2 ring-inset ring-blue-400" : ""}`}
                      onClick={() => setSelectedCap(row.capId)}
                    >
                      <td className="py-2 pr-3 font-semibold" style={{ color: capColors[row.capId] }}>
                        {row.capName}
                      </td>
                      <td className="py-2 pr-3">{CURRENCY.format(row.budget)}</td>
                      <td className="py-2 pr-3">{CURRENCY.format(row.blendedConsumption)}</td>
                      <td className="py-2 pr-3">{CURRENCY.format(row.realCost)}</td>
                      <td className="py-2 pr-3 font-semibold">{row.distortionIndex.toFixed(2)}x</td>
                      <td className="py-2 pr-3 text-blue-700 font-semibold">{NUMBER.format(Math.round(row.realMDCapacity))}</td>
                      <td className={`py-2 pr-3 font-semibold ${efficient ? "text-green-700" : "text-red-700"}`}>
                        {row.mdGainPercent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className={`${cardClass} xl:col-span-2`}>
            <h2 className={sectionTitleClass}>Project View: Blended vs Real Cost</h2>
            <div className="h-80 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectComparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" angle={-20} interval={0} textAnchor="end" height={75} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
                  <Tooltip
                    formatter={(value: number) => CURRENCY.format(value)}
                    labelFormatter={(label) => `Project: ${label}`}
                    contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                  />
                  <Legend />
                  <Bar dataKey="blendedCost" name="Blended Cost" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="realCost" name="Real Cost" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className={sectionTitleClass}>Role Mix View</h2>
            <label className="mt-3 block text-sm text-slate-700">
              Project
              <select
                value={selectedProject?.id ?? ""}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="h-64 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(value: number) => `${NUMBER.format(value)} MD`} />
                  <Legend />
                  <Pie data={rolePieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85}>
                    {rolePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className={sectionTitleClass}>Enhanced Scatter: Cost Distortion vs Project Size</h2>
          <p className="mt-1 text-xs text-slate-500">X = Real Cost | Y = Variance % | Bubble size = Mandays | Color = CAP</p>
          <div className="h-80 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="x" name="Real Cost" tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
                <YAxis type="number" dataKey="y" name="Variance %" unit="%" />
                <ZAxis type="number" dataKey="z" range={[80, 380]} name="Mandays" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: number, label: string) => {
                    if (label === "Real Cost") return [CURRENCY.format(value), label];
                    if (label === "Variance %") return [`${value.toFixed(1)}%`, label];
                    return [`${NUMBER.format(value)} MD`, label];
                  }}
                  labelFormatter={(_, payload) => (payload && payload[0] ? payload[0].payload.name : "")}
                  contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                />
                <Legend />
                {filteredCaps.map((cap) => (
                  <Scatter
                    key={cap.id}
                    name={cap.name}
                    data={scatterData.filter((point) => point.cap === cap.id)}
                    fill={capColors[cap.id]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
