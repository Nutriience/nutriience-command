import { useState, useEffect, useCallback, useRef } from "react";

// ─── PIN CONFIG ──────────────────────────────────────────────────────────────
// Change this to your preferred 4-digit PIN
const APP_PIN = "1234";
const PIN_SESSION_KEY = "nutriience_pin_session";

// ─── PERSISTENT STORAGE ─────────────────────────────────────────────────────
const STORAGE_KEY = "nutriience_data_v1";

const saveData = async (data) => {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

const loadData = async () => {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    if (result?.value) return JSON.parse(result.value);
  } catch {}
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) return JSON.parse(local);
  } catch {}
  return null;
};

// ─── DEFAULT DATA ────────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  meta: { lastUpdated: new Date().toISOString(), updatedBy: "Owner" },
  settings: {
    companyName: "Nutriience",
    fiscalYearStart: "2025-01-01",
    employees: 8,
    team: ["Owner", "Mari", "Gina"],
    commissionProfiles: [
      { name: "Gina", rate: 18, drawAnnual: 80000, drawPeriod: "quarterly", compType: "Commission", active: true },
      { name: "Mari", rate: 18, drawAnnual: 0, drawPeriod: "quarterly", compType: "Reference Only", active: true },
    ],
    guardrails: {
      minGM_manufacturing: 22, minGM_rawMaterial: 20, minGM_npd: 18,
      minGPPerAccount: 40000, maxCustomerConcentration: 30,
      empeTarget: 62000, revenuePerHeadTarget: 280000,
      cashReserveTarget: 150000, ohNoFundTarget: 75000,
      distributionApprovalThreshold: 20000, marginExceptionThreshold: 5,
    },
  },
  cash: {
    accounts: [
      { name: "Chase Operating", balance: 241800 },
      { name: "Chase Payroll", balance: 98200 },
      { name: "Chase Reserve", balance: 47420 },
    ],
    ohNoProgress: 47420,
  },
  ar: {
    dueThisWeek: 84200,
    aging: [
      { bucket: "Current", amount: 148600 },
      { bucket: "1–30 days", amount: 91400 },
      { bucket: "31–45 days", amount: 42200 },
      { bucket: "46–60 days", amount: 18800 },
      { bucket: "60+ days", amount: 11400 },
    ],
  },
  ap: {
    dueThisWeek: 41300,
    aging: [
      { bucket: "Current", amount: 72400 },
      { bucket: "1–30 days", amount: 38200 },
      { bucket: "31+ days", amount: 14200 },
    ],
  },
  financials: {
    // Primary basis: Accrual (from bookkeeper confirmed report)
    // Cash figures maintained separately for Cash Command Center
    basisNote: "accrual",
    lastBookkeeperReport: null,
    lastBookkeeperMonth: null,
    revenue: { mtd: 412800, qtd: 1184200, ytd: 2241600, budget: 2400000 },
    gp: { mtd: 99072, qtd: 272366, ytd: 515568 },
    gm: { mtd: 24.0, qtd: 23.0, ytd: 23.0, target: 25.0 },
    // Cash basis equivalents (from QBO direct)
    cash_revenue: { mtd: 388400, qtd: 1142800, ytd: 2198200 },
    cash_gp: { mtd: 93216, qtd: 262844, ytd: 505487 },
    cash_gm: { mtd: 24.0, qtd: 23.0, ytd: 23.0 },
    netIncomeEstimate: 38400,
    netIncomeCash: 34200,
    overheadRunRate: 42000,
    payrollRunRate: 38500,
    ownerCompYTD: 82000,
    distributionsYTD: 40000,
    taxReserveTarget: 60000,
    taxReserveActual: 38000,
    personalLoansToCompany: 0,
    reimbursementQueue: 2400,
    serviceLines: [
      { name: "Manufacturing Mgmt", revenue: 1204000, gp: 288960, gm: 24.0 },
      { name: "Raw Material Supply", revenue: 768400, gp: 184416, gm: 24.0 },
      { name: "NPD / Projects", revenue: 269200, gp: 42192, gm: 15.7 },
    ],
  },
  customers: [
    { id: 1, name: "Alpine Nutrition", owners: ["Owner", "Mari"], tier: "A", strategy: "defend", revenue_mtd: 98400, revenue_qtd: 281200, revenue_ytd: 524800, gp_mtd: 26568, gp_qtd: 75924, gp_ytd: 141696, gm: 26.9, arOpen: 84200, arPastDue: 0, avgOrderSize: 24600, skus: 14, manufacturers: 2, openIssues: 1, trend: "stable", payDays: 28, operatorScore: "good_margin_low_pain", concentration: 23.4,
      tenureStartDate: "2023-01-01",
      monthlySnapshots: [
        { month: "2024-10", gm: 27.1, arPastDue: 0, openIssues: 0, revenue_mtd: 96200, gp_mtd: 26070 },
        { month: "2024-11", gm: 26.8, arPastDue: 0, openIssues: 0, revenue_mtd: 97400, gp_mtd: 26103 },
        { month: "2024-12", gm: 27.2, arPastDue: 0, openIssues: 1, revenue_mtd: 99100, gp_mtd: 26955 },
        { month: "2025-01", gm: 26.5, arPastDue: 0, openIssues: 1, revenue_mtd: 97800, gp_mtd: 25917 },
        { month: "2025-02", gm: 26.9, arPastDue: 0, openIssues: 1, revenue_mtd: 98400, gp_mtd: 26568 },
      ],
    },
    { id: 2, name: "Vitacore Labs", owners: ["Owner"], tier: "A", strategy: "grow", revenue_mtd: 74200, revenue_qtd: 218400, revenue_ytd: 401600, gp_mtd: 22260, gp_qtd: 65520, gp_ytd: 120480, gm: 30.0, arOpen: 38200, arPastDue: 0, avgOrderSize: 18550, skus: 8, manufacturers: 1, openIssues: 0, trend: "improving", payDays: 22, operatorScore: "expansion_candidate", concentration: 17.9,
      tenureStartDate: "2023-06-01",
      monthlySnapshots: [
        { month: "2024-10", gm: 27.4, arPastDue: 0, openIssues: 0, revenue_mtd: 68200, gp_mtd: 18699 },
        { month: "2024-11", gm: 28.2, arPastDue: 0, openIssues: 0, revenue_mtd: 70100, gp_mtd: 19768 },
        { month: "2024-12", gm: 29.1, arPastDue: 0, openIssues: 0, revenue_mtd: 72400, gp_mtd: 21068 },
        { month: "2025-01", gm: 29.6, arPastDue: 0, openIssues: 0, revenue_mtd: 73100, gp_mtd: 21638 },
        { month: "2025-02", gm: 30.0, arPastDue: 0, openIssues: 0, revenue_mtd: 74200, gp_mtd: 22260 },
      ],
    },
    { id: 3, name: "NutriFirst", owners: ["Mari", "Gina"], tier: "B", strategy: "fix", revenue_mtd: 62100, revenue_qtd: 178200, revenue_ytd: 338400, gp_mtd: 9315, gp_qtd: 26730, gp_ytd: 50760, gm: 15.0, arOpen: 92400, arPastDue: 42200, avgOrderSize: 15525, skus: 22, manufacturers: 4, openIssues: 3, trend: "deteriorating", payDays: 47, operatorScore: "high_revenue_low_margin", concentration: 15.1,
      tenureStartDate: "2023-09-01",
      monthlySnapshots: [
        { month: "2024-10", gm: 22.1, arPastDue: 0, openIssues: 1, revenue_mtd: 64200, gp_mtd: 14188 },
        { month: "2024-11", gm: 19.4, arPastDue: 8200, openIssues: 2, revenue_mtd: 63100, gp_mtd: 12241 },
        { month: "2024-12", gm: 17.2, arPastDue: 18400, openIssues: 2, revenue_mtd: 62800, gp_mtd: 10802 },
        { month: "2025-01", gm: 16.1, arPastDue: 28200, openIssues: 3, revenue_mtd: 62400, gp_mtd: 10046 },
        { month: "2025-02", gm: 15.0, arPastDue: 42200, openIssues: 3, revenue_mtd: 62100, gp_mtd: 9315 },
      ],
    },
    { id: 4, name: "Peak Performance Co.", owners: ["Owner", "Mari"], tier: "B", strategy: "grow", revenue_mtd: 54800, revenue_qtd: 156200, revenue_ytd: 294600, gp_mtd: 15344, gp_qtd: 43736, gp_ytd: 82488, gm: 28.0, arOpen: 54800, arPastDue: 0, avgOrderSize: 13700, skus: 11, manufacturers: 2, openIssues: 1, trend: "improving", payDays: 31, operatorScore: "expansion_candidate", concentration: 13.1,
      tenureStartDate: "2024-01-01",
      monthlySnapshots: [
        { month: "2024-10", gm: 25.2, arPastDue: 0, openIssues: 1, revenue_mtd: 50100, gp_mtd: 12625 },
        { month: "2024-11", gm: 26.1, arPastDue: 0, openIssues: 1, revenue_mtd: 51800, gp_mtd: 13520 },
        { month: "2024-12", gm: 27.0, arPastDue: 0, openIssues: 0, revenue_mtd: 52900, gp_mtd: 14283 },
        { month: "2025-01", gm: 27.4, arPastDue: 0, openIssues: 1, revenue_mtd: 53600, gp_mtd: 14687 },
        { month: "2025-02", gm: 28.0, arPastDue: 0, openIssues: 1, revenue_mtd: 54800, gp_mtd: 15344 },
      ],
    },
    { id: 5, name: "Blueprint Wellness", owners: ["Owner"], tier: "C", strategy: "exit", revenue_mtd: 48200, revenue_qtd: 138400, revenue_ytd: 261800, gp_mtd: 5784, gp_qtd: 16608, gp_ytd: 31416, gm: 12.0, arOpen: 48200, arPastDue: 18800, avgOrderSize: 12050, skus: 31, manufacturers: 6, openIssues: 5, trend: "deteriorating", payDays: 61, operatorScore: "slow_payer", concentration: 11.7,
      tenureStartDate: "2023-03-01",
      monthlySnapshots: [
        { month: "2024-10", gm: 23.8, arPastDue: 0, openIssues: 1, revenue_mtd: 49200, gp_mtd: 11710 },
        { month: "2024-11", gm: 18.2, arPastDue: 6400, openIssues: 2, revenue_mtd: 48800, gp_mtd: 8882 },
        { month: "2024-12", gm: 14.9, arPastDue: 12200, openIssues: 4, revenue_mtd: 48600, gp_mtd: 7241 },
        { month: "2025-01", gm: 13.1, arPastDue: 14800, openIssues: 4, revenue_mtd: 48400, gp_mtd: 6340 },
        { month: "2025-02", gm: 12.0, arPastDue: 18800, openIssues: 5, revenue_mtd: 48200, gp_mtd: 5784 },
      ],
    },
    { id: 6, name: "ProHealth Direct", owners: ["Gina"], tier: "B", strategy: "defend", revenue_mtd: 38400, revenue_qtd: 112200, revenue_ytd: 208800, gp_mtd: 10752, gp_qtd: 31416, gp_ytd: 58464, gm: 28.0, arOpen: 18800, arPastDue: 0, avgOrderSize: 9600, skus: 7, manufacturers: 1, openIssues: 0, trend: "stable", payDays: 26, operatorScore: "good_margin_low_pain", concentration: 9.3,
      tenureStartDate: "2023-11-01",
      monthlySnapshots: [
        { month: "2024-10", gm: 27.8, arPastDue: 0, openIssues: 0, revenue_mtd: 37900, gp_mtd: 10536 },
        { month: "2024-11", gm: 28.1, arPastDue: 0, openIssues: 0, revenue_mtd: 38100, gp_mtd: 10706 },
        { month: "2024-12", gm: 27.9, arPastDue: 0, openIssues: 0, revenue_mtd: 38200, gp_mtd: 10658 },
        { month: "2025-01", gm: 28.2, arPastDue: 0, openIssues: 0, revenue_mtd: 38300, gp_mtd: 10801 },
        { month: "2025-02", gm: 28.0, arPastDue: 0, openIssues: 0, revenue_mtd: 38400, gp_mtd: 10752 },
      ],
    },
  ],
  issues: [
    { id: 1, entity: "Blueprint Wellness", type: "customer", category: "NCR", description: "Batch #441 label failure — dispute open", daysOpen: 22, owner: "Mari", exposure: 18800, status: "open" },
    { id: 2, entity: "NutriFirst", type: "customer", category: "Collections", description: "A/R 47 days past cycle — follow-up needed", daysOpen: 17, owner: "Gina", exposure: 42200, status: "open" },
    { id: 3, entity: "PMG (Mfr B)", type: "vendor", category: "Late Shipment", description: "2 late shipments this week — Alpine order at risk", daysOpen: 6, owner: "Mari", exposure: 24600, status: "open" },
    { id: 4, entity: "Blueprint Wellness", type: "customer", category: "Dispute", description: "Price increase not accepted — invoice on hold", daysOpen: 14, owner: "Owner", exposure: 11400, status: "escalated" },
    { id: 5, entity: "NutriFirst", type: "customer", category: "Quality", description: "3 open QC deviations across 2 SKUs", daysOpen: 9, owner: "Mari", exposure: 8200, status: "open" },
  ],
  marginLeaks: [
    { id: 1, category: "Customer", name: "Blueprint Wellness", type: "Below GM floor", impactMonthly: 4800, severity: "high", action: "Reprice or exit" },
    { id: 2, category: "Customer", name: "NutriFirst", type: "Margin erosion + ops drag", impactMonthly: 3200, severity: "high", action: "Fix or restructure" },
    { id: 3, category: "Service Line", name: "NPD / Projects", type: "Below GM floor (15.7%)", impactMonthly: 2800, severity: "medium", action: "Reprice NPD engagements" },
    { id: 4, category: "Complexity", name: "Blueprint Wellness", type: "Too many SKUs (31)", impactMonthly: 1800, severity: "medium", action: "SKU rationalization" },
    { id: 5, category: "Complexity", name: "Blueprint Wellness", type: "6 manufacturers per account", impactMonthly: 1400, severity: "medium", action: "Consolidate to 2 mfrs" },
    { id: 6, category: "Collections", name: "NutriFirst", type: "Cash drag from slow pay", impactMonthly: 1100, severity: "medium", action: "Enforce payment terms" },
    { id: 7, category: "Rush / Rework", name: "Multiple accounts", type: "Rush fees not passed through", impactMonthly: 900, severity: "low", action: "Update billing policy" },
    { id: 8, category: "Small Orders", name: "ProHealth Direct", type: "Order size below efficiency threshold", impactMonthly: 600, severity: "low", action: "Minimum order policy" },
  ],
  cashForecast: [
    { week: "Mar W3", inflows: 84200, outflows: 62400 },
    { week: "Mar W4", inflows: 71400, outflows: 88300 },
    { week: "Apr W1", inflows: 92800, outflows: 41200 },
    { week: "Apr W2", inflows: 54200, outflows: 98400 },
    { week: "Apr W3", inflows: 108400, outflows: 52800 },
    { week: "Apr W4", inflows: 44200, outflows: 112400 },
    { week: "May W1", inflows: 88200, outflows: 48200 },
    { week: "May W2", inflows: 62400, outflows: 89400 },
    { week: "May W3", inflows: 98400, outflows: 44200 },
    { week: "May W4", inflows: 52200, outflows: 118800 },
    { week: "Jun W1", inflows: 84200, outflows: 62400 },
    { week: "Jun W2", inflows: 74200, outflows: 94400 },
    { week: "Jun W3", inflows: 88400, outflows: 52200 },
  ],
  changelog: [
    { date: new Date().toISOString(), changes: ["Initial data loaded — sample Nutriience data"] },
  ],
  pipeline: [
    { id: 1, name: "Omega Health Co.", revenue: 480000, gm: 26.0, serviceType: "manufacturing", stage: "proposal", probability: 35, expectedCloseMonth: "2026-04", owner: "Owner", dealScore: null, verdict: null, notes: "Strong fit, pricing negotiation pending" },
    { id: 2, name: "PureForm Nutrition", revenue: 320000, gm: 28.5, serviceType: "raw", stage: "negotiation", probability: 60, expectedCloseMonth: "2026-03", owner: "Mari", dealScore: null, verdict: null, notes: "Verbal interest, finalizing terms" },
    { id: 3, name: "Apex Wellness", revenue: 750000, gm: 15.0, serviceType: "manufacturing", stage: "prospect", probability: 15, expectedCloseMonth: "2026-06", owner: "Owner", dealScore: null, verdict: null, notes: "Large opportunity, margin concern" },
    { id: 4, name: "VitaCore Plus", revenue: 180000, gm: 31.0, serviceType: "npd", stage: "verbal", probability: 85, expectedCloseMonth: "2026-03", owner: "Gina", dealScore: null, verdict: null, notes: "Ready to close" },
  ],
  manufacturers: [
    { id: 1, name: "PMG (Mfr B)", tier: "B", status: "active", lateShipments: 2, openNCRs: 1, onTimeRate: 74, qualityScore: 78, activeCustomers: ["Alpine Nutrition", "Peak Performance Co."], openIssues: 2, concentration: 34, tenureStartDate: "2022-06-01",
      monthlySnapshots: [
        { month: "2024-10", onTimeRate: 88, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2024-11", onTimeRate: 82, openNCRs: 1, lateShipments: 1, openIssues: 1, healthStatus: "yellow" },
        { month: "2024-12", onTimeRate: 79, openNCRs: 1, lateShipments: 1, openIssues: 1, healthStatus: "yellow" },
        { month: "2025-01", onTimeRate: 76, openNCRs: 1, lateShipments: 2, openIssues: 2, healthStatus: "yellow" },
        { month: "2025-02", onTimeRate: 74, openNCRs: 1, lateShipments: 2, openIssues: 2, healthStatus: "red" },
      ],
    },
    { id: 2, name: "NutraCo Labs", tier: "A", status: "active", lateShipments: 0, openNCRs: 0, onTimeRate: 96, qualityScore: 94, activeCustomers: ["Vitacore Labs", "ProHealth Direct"], openIssues: 0, concentration: 28, tenureStartDate: "2021-03-01",
      monthlySnapshots: [
        { month: "2024-10", onTimeRate: 97, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2024-11", onTimeRate: 96, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2024-12", onTimeRate: 95, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2025-01", onTimeRate: 97, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2025-02", onTimeRate: 96, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
      ],
    },
    { id: 3, name: "Apex Formulations", tier: "B", status: "active", lateShipments: 1, openNCRs: 2, onTimeRate: 81, qualityScore: 83, activeCustomers: ["NutriFirst", "Blueprint Wellness"], openIssues: 3, concentration: 22, tenureStartDate: "2023-01-01",
      monthlySnapshots: [
        { month: "2024-10", onTimeRate: 88, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2024-11", onTimeRate: 85, openNCRs: 1, lateShipments: 1, openIssues: 1, healthStatus: "yellow" },
        { month: "2024-12", onTimeRate: 83, openNCRs: 2, lateShipments: 1, openIssues: 2, healthStatus: "yellow" },
        { month: "2025-01", onTimeRate: 82, openNCRs: 2, lateShipments: 1, openIssues: 3, healthStatus: "yellow" },
        { month: "2025-02", onTimeRate: 81, openNCRs: 2, lateShipments: 1, openIssues: 3, healthStatus: "yellow" },
      ],
    },
    { id: 4, name: "BioSource Inc.", tier: "A", status: "active", lateShipments: 0, openNCRs: 0, onTimeRate: 98, qualityScore: 97, activeCustomers: ["Alpine Nutrition", "Vitacore Labs", "Peak Performance Co."], openIssues: 0, concentration: 16, tenureStartDate: "2020-09-01",
      monthlySnapshots: [
        { month: "2024-10", onTimeRate: 99, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2024-11", onTimeRate: 98, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2024-12", onTimeRate: 98, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2025-01", onTimeRate: 97, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
        { month: "2025-02", onTimeRate: 98, openNCRs: 0, lateShipments: 0, openIssues: 0, healthStatus: "green" },
      ],
    },
  ],
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};
const fmtFull = (n) => `$${(n || 0).toLocaleString()}`;
const pct = (n) => `${(n || 0).toFixed(1)}%`;
const num = (v) => parseFloat(v) || 0;

const STRATEGY_COLORS = { defend: "#3b82f6", grow: "#22c55e", fix: "#f59e0b", exit: "#ef4444" };
const OPERATOR_LABELS = {
  good_margin_low_pain: "Clean Account", expansion_candidate: "Expand",
  high_revenue_low_margin: "Margin Risk", slow_payer: "Slow Payer",
  good_margin_operational_pain: "Ops Drag", high_support_burden: "High Touch",
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500&family=Syne:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f0f4fa;--surface:#ffffff;--surface2:#f0f4fa;--surface3:#e8eef6;
  --border:#d0daea;--border2:#e0e8f0;
  --text:#1a2a3a;--text2:#5a6f85;--text3:#8a9aaa;
  --accent:#1878a8;--blue:#1878a8;
  --red:#dc2626;--yellow:#d97706;--green:#059669;--brand-blue:#1878a8;--brand-gray:#8a9099;
  --red-bg:rgba(220,38,38,0.07);--yellow-bg:rgba(217,119,6,0.08);--green-bg:rgba(5,150,105,0.07);--blue-bg:rgba(24,120,168,0.07);
  --header-bg:#1e3a5f;--header-border:#2a4f7a;--nav-bg:#f0f4fa;--nav-border:#d0daea;
}
body{background:var(--bg);color:var(--text);font-family:'Syne',sans-serif;font-size:14px;overflow-x:hidden}
button{font-family:'Syne',sans-serif;cursor:pointer}
input,select,textarea{font-family:'Syne',sans-serif}

/* LAYOUT */
.app{display:flex;flex-direction:column;min-height:100vh;max-width:1440px;margin:0 auto;overflow-x:hidden}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:#1e3a5f;border-bottom:1px solid #2a4f7a;position:sticky;top:0;z-index:200;gap:12px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px}
.brand-mark{width:36px;height:36px;display:flex;align-items:center;justify-content:center;}
.brand-name{font-size:14px;font-weight:700;letter-spacing:.3px}
.brand-sub{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:.8px}
.header-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.last-updated{font-family:'DM Mono',monospace;font-size:10px;color:var(--text3)}
.admin-toggle{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#c8e0f4;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:600;letter-spacing:.3px;transition:all .15s;white-space:nowrap;cursor:pointer}
.admin-toggle:hover{border-color:#7ed4f7;color:#7ed4f7}
.admin-toggle.active{background:rgba(126,212,247,.15);border-color:#7ed4f7;color:#7ed4f7}

/* NAV */
.nav{display:flex;gap:2px;padding:6px 24px;background:#f0f4fa;border-bottom:1px solid #d0daea;overflow-x:auto}
.nav::-webkit-scrollbar{display:none}
.nav-btn{padding:7px 14px;border-radius:6px;border:none;background:transparent;color:var(--text3);font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s;letter-spacing:.3px}
.nav-btn:hover{background:var(--surface2);color:var(--text)}
.nav-btn.active{background:#ffffff;color:#1878a8;border:1px solid rgba(24,120,168,.3);box-shadow:0 1px 3px rgba(0,0,0,.08)}

/* MAIN */
.main{flex:1;padding:20px 24px;display:flex;flex-direction:column;gap:20px;min-width:0;overflow-x:hidden}

/* CARDS */
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;min-width:0;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.card-title{font-size:10px;font-weight:700;color:var(--text3);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:16px;font-family:'DM Mono',monospace}
.card-sm{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px}

/* GRIDS */
.g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.g5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
@media(max-width:1100px){.g5{grid-template-columns:repeat(3,minmax(0,1fr))}.g4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:800px){.g3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){.g4,.g3,.g2{grid-template-columns:minmax(0,1fr)}.g5{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* STAT TILES */
.tile{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px}
.tile-label{font-size:9px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:.9px;text-transform:uppercase;margin-bottom:8px}
.tile-val{font-size:22px;font-weight:800;letter-spacing:-.5px}
.tile-sub{font-size:10px;color:var(--text3);margin-top:4px;font-family:'DM Mono',monospace}
.green{color:var(--green)}.yellow{color:var(--yellow)}.red{color:var(--red)}.blue{color:var(--blue)}

/* STATUS PILLS */
.pill-row{display:flex;gap:8px;flex-wrap:wrap}
.pill{display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:20px;font-size:11px;font-weight:600;font-family:'DM Mono',monospace;letter-spacing:.3px}
.pill.green{background:var(--green-bg);color:var(--green);border:1px solid rgba(0,212,160,.2)}
.pill.yellow{background:var(--yellow-bg);color:var(--yellow);border:1px solid rgba(255,201,71,.2)}
.pill.red{background:var(--red-bg);color:var(--red);border:1px solid rgba(255,71,87,.2)}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.dot.green{background:var(--green)}.dot.yellow{background:var(--yellow)}.dot.red{background:var(--red)}

/* ALERTS */
.alert{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:8px;margin-bottom:6px;font-size:13px}
.alert.red{background:var(--red-bg);border-left:3px solid var(--red)}
.alert.yellow{background:var(--yellow-bg);border-left:3px solid var(--yellow)}
.alert.green{background:var(--green-bg);border-left:3px solid var(--green)}
.abadge{font-size:9px;font-family:'DM Mono',monospace;padding:2px 6px;border-radius:4px;white-space:nowrap;margin-top:2px;font-weight:700;letter-spacing:.5px}
.abadge.red{background:rgba(255,71,87,.2);color:var(--red)}
.abadge.yellow{background:rgba(255,201,71,.2);color:var(--yellow)}
.abadge.green{background:rgba(0,212,160,.2);color:var(--green)}

/* TABLES */
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:left;padding:8px 10px;font-size:9px;font-weight:700;color:var(--text3);letter-spacing:.9px;text-transform:uppercase;border-bottom:1px solid var(--border2);font-family:'DM Mono',monospace;white-space:nowrap}
td{padding:9px 10px;border-bottom:1px solid var(--border);color:var(--text2)}
tr:last-child td{border-bottom:none}
tr.clickable{cursor:pointer}
tr.clickable:hover td{background:var(--surface2);color:var(--text)}

/* TAGS / CHIPS */
.tag{display:inline-block;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.5px;font-family:'DM Mono',monospace}
.tag-a{background:rgba(0,212,160,.15);color:var(--green)}
.tag-b{background:rgba(59,130,246,.15);color:var(--blue)}
.tag-c{background:rgba(255,71,87,.15);color:var(--red)}
.chip{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;font-family:'DM Mono',monospace;letter-spacing:.3px}

/* PROGRESS */
.track{height:5px;background:var(--border2);border-radius:3px;overflow:hidden}
.fill{height:100%;border-radius:3px;transition:width .4s}
.fill.green{background:#00c98a}.fill.yellow{background:var(--yellow)}.fill.red{background:var(--red)}.fill.blue{background:var(--blue)}

/* METRIC ROW */
.mrow{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)}
.mrow:last-child{border-bottom:none}
.mname{font-size:12.5px;color:var(--text2)}
.mval{font-size:12.5px;font-weight:700;font-family:'DM Mono',monospace}

/* SECTION HEADER */
.sh{margin-bottom:4px}
.sh-title{font-size:20px;font-weight:800;letter-spacing:-.3px}
.sh-sub{font-size:11px;color:var(--text3);margin-top:3px;font-family:'DM Mono',monospace}

/* GUARDRAIL ROW */
.grail{display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:8px;margin-bottom:6px;background:var(--surface2);border:1px solid var(--border)}
.grail-name{font-size:13px;font-weight:600;margin-bottom:2px}
.grail-detail{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace}
.grail-status{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;font-family:'DM Mono',monospace}
.grail-status.pass{color:var(--green)}.grail-status.warn{color:var(--yellow)}.grail-status.fail{color:var(--red)}

/* ADMIN PANEL */
.admin-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:500;display:flex;justify-content:flex-end;backdrop-filter:blur(4px)}
.admin-panel{width:min(680px,95vw);background:var(--surface);border-left:1px solid var(--border2);display:flex;flex-direction:column;overflow:hidden}
.admin-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border);flex-shrink:0}
.admin-title{font-size:16px;font-weight:800}
.admin-close{background:var(--surface2);border:1px solid var(--border2);color:var(--text2);width:32px;height:32px;border-radius:6px;font-size:16px}
.admin-nav{display:flex;gap:2px;padding:10px 16px;border-bottom:1px solid var(--border);overflow-x:auto;flex-shrink:0}
.admin-nav::-webkit-scrollbar{display:none}
.admin-tab{padding:6px 12px;border-radius:5px;border:none;background:transparent;color:var(--text3);font-size:11px;font-weight:600;white-space:nowrap;transition:all .15s}
.admin-tab:hover{background:var(--surface2);color:var(--text)}
.admin-tab.active{background:var(--surface2);color:var(--accent)}
.admin-body{flex:1;overflow-y:auto;padding:20px 24px}
.admin-save{padding:14px 24px;border-bottom:1px solid var(--border);flex-shrink:0}
.save-btn{width:100%;background:#1878a8;color:#fff;border:none;border-radius:8px;padding:11px;font-size:13px;font-weight:700;letter-spacing:.5px;transition:opacity .15s}
.save-btn:hover{opacity:.85}
.save-btn:disabled{opacity:.4;cursor:not-allowed}

/* FORM ELEMENTS */
.field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.flabel{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:.5px;text-transform:uppercase}
.finput{background:var(--surface2);border:1px solid var(--border2);border-radius:7px;padding:8px 11px;color:var(--text);font-size:13px;width:100%;transition:border-color .15s}
.finput:focus{outline:none;border-color:var(--accent)}
.fselect{background:var(--surface2);border:1px solid var(--border2);border-radius:7px;padding:8px 11px;color:var(--text);font-size:13px;width:100%}
.ftextarea{background:var(--surface2);border:1px solid var(--border2);border-radius:7px;padding:8px 11px;color:var(--text);font-size:12px;width:100%;min-height:80px;resize:vertical;line-height:1.5;transition:border-color .15s}
.ftextarea:focus{outline:none;border-color:var(--accent)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:500px){.fg2{grid-template-columns:1fr}}
.fsection{font-size:11px;font-weight:700;color:var(--text2);letter-spacing:.5px;text-transform:uppercase;margin:18px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.parse-hint{font-size:10px;color:var(--text3);margin-top:4px;font-family:'DM Mono',monospace}

/* DEAL EVALUATOR */
.verdict{border-radius:12px;padding:24px;margin-top:16px}
.verdict.take{background:rgba(0,212,160,.07);border:1px solid rgba(0,212,160,.3)}
.verdict.renegotiate{background:rgba(255,201,71,.07);border:1px solid rgba(255,201,71,.3)}
.verdict.decline{background:rgba(255,71,87,.07);border:1px solid rgba(255,71,87,.3)}
.verdict-label{font-size:26px;font-weight:800;letter-spacing:-.5px;margin-bottom:16px}
.verdict-label.take{color:var(--green)}.verdict-label.renegotiate{color:var(--yellow)}.verdict-label.decline{color:var(--red)}
.eval-btn{background:#1878a8;color:#fff;border:none;border-radius:8px;padding:11px 28px;font-size:13px;font-weight:700;letter-spacing:.5px;margin-top:16px;transition:opacity .15s}
.eval-btn:hover{opacity:.85}

/* CASH FORECAST */
.fc-row{display:flex;align-items:center;gap:8px;padding:4px 0}
.fc-label{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;width:56px;flex-shrink:0}
.fc-bars{flex:1;display:flex;gap:3px;align-items:center}
.fc-bar{height:12px;border-radius:2px;min-width:2px}
.fc-in{background:rgba(0,212,160,.55)}.fc-out{background:rgba(255,71,87,.45)}
.fc-net{font-size:10px;font-family:'DM Mono',monospace;width:66px;text-align:right;flex-shrink:0}
.fc-bal{font-size:10px;font-family:'DM Mono',monospace;width:72px;text-align:right;flex-shrink:0}

/* ISSUE TRACKER */
.issue-card{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:8px}
.issue-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.issue-entity{font-size:13px;font-weight:700}
.issue-desc{font-size:12px;color:var(--text2);margin-bottom:8px;line-height:1.5}
.issue-meta{display:flex;gap:12px;flex-wrap:wrap}
.issue-meta-item{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace}

/* MARGIN LEAK */
.leak-row{display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:8px;margin-bottom:6px;background:var(--surface2);border:1px solid var(--border)}
.leak-left{flex:1}
.leak-cat{font-size:9px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px}
.leak-name{font-size:13px;font-weight:600;margin-bottom:2px}
.leak-type{font-size:11px;color:var(--text3)}
.leak-right{text-align:right}
.leak-impact{font-size:16px;font-weight:800;font-family:'DM Mono',monospace}
.leak-action{font-size:10px;color:var(--text3);margin-top:2px}

/* WHAT CHANGED */
.change-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
.change-item:last-child{border-bottom:none}
.change-icon{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}

/* DISTRIBUTION */
.dist-meter{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center}
.dist-val{font-size:32px;font-weight:800;letter-spacing:-1px;margin-bottom:4px}
.dist-label{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:.8px;text-transform:uppercase}

/* ADD BUTTONS */
.add-btn{background:transparent;border:1px dashed var(--border2);color:var(--text3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;width:100%;margin-top:8px;transition:all .15s}
.add-btn:hover{border-color:var(--accent);color:var(--accent)}
.remove-btn{background:transparent;border:none;color:var(--text3);font-size:18px;line-height:1;padding:2px 6px;border-radius:4px}
.remove-btn:hover{color:var(--red)}

/* TOAST */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--green);color:var(--bg);padding:10px 24px;border-radius:8px;font-size:13px;font-weight:700;z-index:999;animation:fadeup .3s ease}
@keyframes fadeup{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* REVIEW BANNER */
.review-banner{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,201,71,.08);border:1px solid rgba(255,201,71,.25);border-radius:10px;margin-bottom:4px;flex-wrap:wrap;gap:10px}
.review-banner-left{display:flex;align-items:center;gap:10px}
.review-banner-icon{font-size:18px}
.review-banner-text{font-size:13px;font-weight:600;color:var(--yellow)}
.review-banner-sub{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace;margin-top:2px}
.review-banner-btn{background:#1878a8;color:#fff;border:none;border-radius:7px;padding:7px 16px;font-size:12px;font-weight:700;letter-spacing:.5px;white-space:nowrap}
.review-banner-btn:hover{opacity:.85}

/* SCORING WORKFLOW */
.score-wrap{max-width:640px;margin:0 auto}
.score-progress{display:flex;gap:4px;margin-bottom:24px}
.score-progress-step{flex:1;height:3px;border-radius:2px;background:var(--border2);transition:background .3s}
.score-progress-step.done{background:var(--accent)}
.score-progress-step.active{background:var(--yellow)}
.score-customer-header{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.score-customer-name{font-size:22px;font-weight:800;letter-spacing:-.3px}
.score-customer-meta{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace;margin-top:4px}
.score-question{font-size:15px;font-weight:700;margin-bottom:6px;line-height:1.4}
.score-question-hint{font-size:11px;color:var(--text3);margin-bottom:18px;font-family:'DM Mono',monospace}
.score-options{display:flex;flex-direction:column;gap:8px;margin-bottom:24px}
.score-option{background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:13px 16px;text-align:left;color:var(--text2);font-size:13px;font-weight:600;transition:all .15s}
.score-option:hover{border-color:var(--accent);color:var(--text)}
.score-option.selected{background:rgba(0,212,160,.08);border-color:var(--accent);color:var(--accent)}
.score-nav{display:flex;gap:10px;margin-top:8px}
.score-next{background:#1878a8;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:13px;font-weight:700;letter-spacing:.5px}
.score-next:disabled{opacity:.3;cursor:not-allowed}
.score-back{background:transparent;border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:10px 18px;font-size:13px;font-weight:600}
.score-back:hover{border-color:var(--text2);color:var(--text)}
.score-recommendation{background:var(--surface2);border:1px solid var(--border2);border-radius:12px;padding:20px;margin-bottom:20px}
.score-rec-label{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
.score-rec-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)}
.score-rec-row:last-child{border-bottom:none}
.score-rec-field{font-size:12px;color:var(--text3)}
.score-rec-val{font-size:13px;font-weight:700}
.score-rec-reasoning{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);line-height:1.6}
.score-override-section{margin-bottom:20px}
.score-override-label{font-size:12px;color:var(--text2);margin-bottom:8px;font-weight:600}
.score-override-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}
.score-override-btn{background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:8px;font-size:11px;font-weight:700;color:var(--text3);transition:all .15s;font-family:'DM Mono',monospace}
.score-override-btn:hover{border-color:var(--text2);color:var(--text)}
.score-override-btn.active{border-color:var(--yellow);color:var(--yellow);background:rgba(255,201,71,.08)}
.score-note-required{font-size:11px;color:var(--yellow);font-family:'DM Mono',monospace;margin-bottom:6px}
.score-complete{text-align:center;padding:32px 0}
.score-complete-icon{font-size:48px;margin-bottom:16px}
.score-complete-title{font-size:22px;font-weight:800;margin-bottom:8px}
.score-complete-sub{font-size:13px;color:var(--text3);font-family:'DM Mono',monospace}
.score-summary-table{margin-top:24px;text-align:left}
.override-note-badge{display:inline-block;font-size:9px;font-family:'DM Mono',monospace;padding:2px 7px;border-radius:4px;background:rgba(255,201,71,.15);color:var(--yellow);margin-left:6px;font-weight:700}
.stale-override-badge{display:inline-block;font-size:9px;font-family:'DM Mono',monospace;padding:2px 7px;border-radius:4px;background:rgba(255,71,87,.15);color:var(--red);margin-left:6px;font-weight:700}

/* SNAPSHOT / PRINT */
.snapshot-btn{background:var(--surface2);border:1px solid var(--border2);color:var(--text2);border-radius:7px;padding:6px 14px;font-size:11px;font-weight:700;letter-spacing:.5px;transition:all .15s;display:flex;align-items:center;gap:6px}
.snapshot-btn:hover{border-color:var(--accent);color:var(--accent)}
.snapshot-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:800;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
.snapshot-modal{background:#fff;border-radius:12px;width:min(720px,95vw);max-height:90vh;overflow-y:auto;color:#111}
.snapshot-actions{display:flex;gap:10px;padding:16px 24px;background:#f8f9fa;border-bottom:1px solid #e5e7eb;border-radius:12px 12px 0 0;justify-content:space-between;align-items:center}
.snapshot-actions-label{font-size:12px;color:#6b7280;font-family:'DM Mono',monospace}
.snap-print-btn{background:#1878a8;color:#fff;border:none;border-radius:7px;padding:8px 20px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.5px}
.snap-close-btn{background:transparent;border:1px solid #d1d5db;color:#6b7280;border-radius:7px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer}
.snapshot-body{padding:32px}
.snap-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #111}
.snap-co{font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;font-family:'DM Mono',monospace}
.snap-name{font-size:28px;font-weight:800;letter-spacing:-.5px;color:#111}
.snap-date{font-size:11px;color:#6b7280;font-family:'DM Mono',monospace;text-align:right}
.snap-owners{font-size:12px;color:#374151;margin-top:4px;font-weight:600}
.snap-health{display:flex;align-items:center;gap:8px;margin-top:8px}
.snap-health-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
.snap-health-label{font-size:13px;font-weight:700}
.snap-section{margin-bottom:24px}
.snap-section-title{font-size:10px;font-weight:700;color:#6b7280;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;font-family:'DM Mono',monospace}
.snap-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
.snap-tile{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px}
.snap-tile-label{font-size:9px;color:#9ca3af;letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px;font-family:'DM Mono',monospace}
.snap-tile-val{font-size:18px;font-weight:800;color:#111;letter-spacing:-.3px}
.snap-tile-val.snap-green{color:#059669}
.snap-tile-val.snap-yellow{color:#d97706}
.snap-tile-val.snap-red{color:#dc2626}
.snap-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f3f4f6;font-size:13px}
.snap-row:last-child{border-bottom:none}
.snap-row-label{color:#6b7280}
.snap-row-val{font-weight:700;color:#111;font-family:'DM Mono',monospace}
.snap-row-val.snap-green{color:#059669}
.snap-row-val.snap-red{color:#dc2626}
.snap-row-val.snap-yellow{color:#d97706}
.snap-issue{display:flex;gap:10px;padding:8px 10px;border-radius:6px;margin-bottom:6px;background:#fef2f2;border-left:3px solid #ef4444;font-size:12px;color:#374151}
.snap-issue-cat{font-weight:700;color:#dc2626;min-width:80px;font-family:'DM Mono',monospace;font-size:10px}
.snap-history-table{width:100%;border-collapse:collapse;font-size:11px}
.snap-history-table th{text-align:left;padding:6px 8px;font-size:9px;color:#9ca3af;letter-spacing:.8px;text-transform:uppercase;border-bottom:1px solid #e5e7eb;font-family:'DM Mono',monospace}
.snap-history-table td{padding:6px 8px;border-bottom:1px solid #f3f4f6;color:#374151;font-family:'DM Mono',monospace}
.snap-footer{margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;font-family:'DM Mono',monospace;display:flex;justify-content:space-between}
.snap-guardrail-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f3f4f6;font-size:12px}
.snap-guardrail-status{font-size:10px;font-weight:700;font-family:'DM Mono',monospace}
.snap-guardrail-status.pass{color:#059669}
.snap-guardrail-status.fail{color:#dc2626}
.snap-guardrail-status.warn{color:#d97706}
.snap-note{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 12px;font-size:12px;color:#92400e;margin-top:8px}
@media print{
  .snapshot-overlay{position:static;background:none;padding:0;display:block}
  .snapshot-modal{border-radius:0;max-height:none;width:100%;box-shadow:none}
  .snapshot-actions{display:none}
  .snapshot-body{padding:24px}
}

/* HEALTH TIMELINE */
.timeline-wrap{overflow-x:auto;padding-bottom:8px}
.timeline-row{display:flex;gap:4px;align-items:flex-start;min-width:max-content}
.timeline-cell{display:flex;flex-direction:column;align-items:center;gap:3px;width:32px;flex-shrink:0}
.timeline-dot{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;cursor:pointer;transition:transform .15s;flex-shrink:0}
.timeline-dot:hover{transform:scale(1.2)}
.timeline-dot.green{background:var(--green);color:var(--bg)}
.timeline-dot.yellow{background:var(--yellow);color:var(--bg)}
.timeline-dot.red{background:var(--red);color:#fff}
.timeline-dot.none{background:var(--border2);color:var(--text3)}
.timeline-month{font-size:8px;color:var(--text3);font-family:'DM Mono',monospace;text-align:center;white-space:nowrap}
.timeline-anno{width:22px;height:4px;border-radius:2px;background:var(--yellow);margin-top:1px}
.timeline-summary{display:flex;gap:16px;padding:12px 0;flex-wrap:wrap}
.timeline-summary-item{display:flex;align-items:center;gap:6px;font-size:12px;font-family:'DM Mono',monospace}
.timeline-anno-list{margin-top:12px;border-top:1px solid var(--border);padding-top:12px}
.timeline-anno-item{display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px}
.timeline-anno-item:last-child{border-bottom:none}
.timeline-anno-month{font-family:'DM Mono',monospace;color:var(--text3);min-width:60px}
.anno-input-row{display:flex;gap:8px;margin-top:8px;align-items:center}
.anno-input{background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:6px 10px;color:var(--text);font-size:12px;flex:1}
.anno-input:focus{outline:none;border-color:var(--accent)}
.anno-save-btn{background:#1878a8;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700}

/* COMMISSION TRACKER */
.comm-card{background:var(--surface2);border:1px solid var(--border2);border-radius:12px;padding:20px;margin-bottom:0}
.comm-name{font-size:16px;font-weight:800;margin-bottom:2px}
.comm-sub{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:16px}
.comm-big{font-size:32px;font-weight:800;letter-spacing:-1px}
.comm-label{font-size:9px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px}
.comm-status-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;margin-top:12px;font-size:12px;font-weight:600}
.comm-status-bar.ahead{background:rgba(0,212,160,.08);border:1px solid rgba(0,212,160,.25);color:var(--green)}
.comm-status-bar.behind{background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.25);color:var(--red)}
.comm-status-bar.even{background:rgba(255,201,71,.08);border:1px solid rgba(255,201,71,.25);color:var(--yellow)}
.comm-account-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:12.5px}
.comm-account-row:last-child{border-bottom:none}
.comm-estimate-note{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;padding:8px 10px;background:var(--surface2);border-radius:6px;margin-top:12px;line-height:1.6}

/* PIPELINE & DIVERSIFICATION */
.pipe-stage{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;font-family:'DM Mono',monospace;letter-spacing:.5px}
.pipe-stage.prospect{background:rgba(72,86,106,.3);color:var(--text3)}
.pipe-stage.proposal{background:rgba(59,130,246,.15);color:var(--blue)}
.pipe-stage.negotiation{background:rgba(255,201,71,.15);color:var(--yellow)}
.pipe-stage.verbal{background:rgba(0,212,160,.15);color:var(--green)}
.pipe-stage.closed{background:rgba(0,212,160,.25);color:var(--green)}
.pipe-verdict.take{color:var(--green);font-weight:700;font-size:11px;font-family:'DM Mono',monospace}
.pipe-verdict.renegotiate{color:var(--yellow);font-weight:700;font-size:11px;font-family:'DM Mono',monospace}
.pipe-verdict.decline{color:var(--red);font-weight:700;font-size:11px;font-family:'DM Mono',monospace}
.pipe-verdict.unscored{color:var(--text3);font-size:11px;font-family:'DM Mono',monospace}
.divers-gap{background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:16px}
.divers-gap-title{font-size:10px;font-weight:700;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;font-family:'DM Mono',monospace}
.divers-gap-anchor{font-size:18px;font-weight:800;margin-bottom:4px}
.divers-gap-sub{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:12px}
.divers-gap-bar-wrap{margin-bottom:8px}
.divers-gap-bar-labels{display:flex;justify-content:space-between;font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:4px}
.scenario-modal{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:600;display:flex;justify-content:center;align-items:flex-start;padding:40px 20px;overflow-y:auto;backdrop-filter:blur(4px)}
.scenario-panel{background:var(--surface);border:1px solid var(--border2);border-radius:14px;width:min(820px,95vw);padding:28px}
.scenario-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
.scenario-title{font-size:18px;font-weight:800}
.scenario-customer-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:10px;align-items:end;margin-bottom:10px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px}
.scenario-result-card{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px}
.scenario-result-title{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px}
.scenario-delta{font-size:11px;font-family:'DM Mono',monospace;margin-top:3px}
.proforma-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px}
.proforma-row:last-child{border-bottom:none}
.proforma-current{color:var(--text3);font-family:'DM Mono',monospace;font-size:12px}
.proforma-new{font-weight:700;font-family:'DM Mono',monospace}
.proforma-arrow{color:var(--text3);margin:0 6px}

/* BASIS LABELS */
.basis-tag{display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;font-weight:700;font-family:'DM Mono',monospace;letter-spacing:.5px;margin-left:6px;vertical-align:middle}
.basis-tag.accrual{background:rgba(59,130,246,.15);color:var(--blue)}
.basis-tag.cash{background:rgba(0,212,160,.1);color:var(--accent)}
.basis-tag.confirmed{background:rgba(0,212,160,.15);color:var(--green)}
.basis-tag.preliminary{background:rgba(255,201,71,.15);color:var(--yellow)}
.basis-banner{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.2);border-radius:8px;margin-bottom:4px;flex-wrap:wrap;gap:8px}
.basis-banner-text{font-size:12px;color:var(--blue);font-weight:600}
.basis-banner-sub{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;margin-top:2px}
.basis-compare-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid var(--border)}
.basis-compare-row:last-child{border-bottom:none}
.basis-compare-label{padding:8px 10px;font-size:12px;color:var(--text2)}
.basis-compare-val{padding:8px 10px;font-size:12px;font-weight:700;font-family:'DM Mono',monospace;text-align:right}
.basis-compare-diff{padding:8px 10px;font-size:11px;font-family:'DM Mono',monospace;text-align:right;color:var(--text3)}
.basis-compare-header{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid var(--border2);padding-bottom:6px;margin-bottom:2px}
.basis-col-header{font-size:9px;font-weight:700;color:var(--text3);letter-spacing:.8px;text-transform:uppercase;font-family:'DM Mono',monospace;padding:4px 10px;text-align:right}
.basis-col-header:first-child{text-align:left}

/* PDF IMPORTER */
.pdf-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:700;display:flex;justify-content:flex-end;backdrop-filter:blur(4px)}
.pdf-panel{width:min(640px,95vw);background:var(--surface);border-left:1px solid var(--border2);display:flex;flex-direction:column;overflow:hidden}
.pdf-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border);flex-shrink:0}
.pdf-title{font-size:15px;font-weight:800}
.pdf-sub{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;margin-top:2px}
.pdf-body{flex:1;overflow-y:auto;padding:20px 22px}
.pdf-drop{border:2px dashed var(--border2);border-radius:10px;padding:32px 20px;text-align:center;cursor:pointer;transition:all .2s;position:relative}
.pdf-drop:hover,.pdf-drop.drag{border-color:var(--accent);background:rgba(0,212,160,.04)}
.pdf-drop-icon{font-size:36px;margin-bottom:10px}
.pdf-drop-text{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px}
.pdf-drop-sub{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace}
.pdf-processing{text-align:center;padding:32px 20px}
.pdf-processing-icon{font-size:36px;margin-bottom:12px;animation:spin 1.5s linear infinite;display:inline-block}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.pdf-processing-text{font-size:14px;font-weight:700;margin-bottom:4px}
.pdf-processing-sub{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace}
.pdf-review-section{margin-bottom:20px}
.pdf-review-title{font-size:11px;font-weight:700;color:var(--text2);letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.pdf-review-row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px}
.pdf-review-row:last-child{border-bottom:none}
.pdf-review-field{color:var(--text2)}
.pdf-review-extracted{font-weight:700;font-family:'DM Mono',monospace;color:var(--accent)}
.pdf-review-current{font-family:'DM Mono',monospace;color:var(--text3)}
.pdf-review-toggle{display:flex;gap:6px}
.pdf-accept-btn{background:rgba(0,212,160,.15);color:var(--green);border:1px solid rgba(0,212,160,.3);border-radius:5px;padding:3px 10px;font-size:10px;font-weight:700}
.pdf-accept-btn.active{background:var(--green);color:var(--bg)}
.pdf-skip-btn{background:var(--surface2);color:var(--text3);border:1px solid var(--border2);border-radius:5px;padding:3px 10px;font-size:10px;font-weight:700}
.pdf-skip-btn.active{background:var(--border2);color:var(--text)}
.pdf-month-select{background:var(--surface2);border:1px solid var(--border2);border-radius:7px;padding:7px 11px;color:var(--text);font-size:12px;width:100%;margin-bottom:12px}
.pdf-footer{padding:14px 22px;border-top:1px solid var(--border);flex-shrink:0;display:flex;flex-direction:column;gap:8px}
.pdf-apply-btn{background:#1878a8;color:#fff;border:none;border-radius:8px;padding:11px;font-size:13px;font-weight:700;width:100%}
.pdf-apply-btn:disabled{opacity:.35;cursor:not-allowed}
.pdf-meta-note{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;text-align:center}

/* CSV IMPORTER */
.csv-section{background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:16px;margin-bottom:16px}
.csv-title{font-size:12px;font-weight:700;margin-bottom:6px}
.csv-hint{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:12px;line-height:1.6}
.csv-drop{border:2px dashed var(--border2);border-radius:8px;padding:24px;text-align:center;cursor:pointer;transition:all .15s}
.csv-drop:hover,.csv-drop.drag{border-color:var(--accent);background:rgba(0,212,160,.04)}
.csv-drop-icon{font-size:28px;margin-bottom:8px}
.csv-drop-text{font-size:13px;color:var(--text2);font-weight:600}
.csv-drop-sub{font-size:11px;color:var(--text3);margin-top:4px;font-family:'DM Mono',monospace}
.csv-preview{margin-top:12px}
.csv-preview-title{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px}
.csv-match-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px}
.csv-match-row:last-child{border-bottom:none}
.csv-match-name{font-weight:600;color:var(--text)}
.csv-match-status{font-size:10px;font-family:'DM Mono',monospace;font-weight:700}
.csv-match-status.matched{color:var(--green)}
.csv-match-status.new{color:var(--yellow)}
.csv-match-status.skip{color:var(--text3)}
.csv-apply-btn{background:#1878a8;color:#fff;border:none;border-radius:7px;padding:8px 20px;font-size:12px;font-weight:700;margin-top:12px;width:100%}

/* MANUFACTURER TAB */
.mfr-risk{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}
.mfr-risk.green{background:var(--green)}
.mfr-risk.yellow{background:var(--yellow)}
.mfr-risk.red{background:var(--red)}

/* OWNER TAGS */
.owner-tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:#e0f2fe;color:#0369a1;font-family:'DM Mono',monospace;margin-right:4px}

/* PIN SCREEN */
.pin-screen{position:fixed;inset:0;background:#1e3a5f;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:0}
.pin-brand{display:flex;align-items:center;gap:12px;margin-bottom:40px}
.pin-brand-mark{width:44px;height:44px;background:var(--accent);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:var(--bg)}
.pin-brand-name{font-size:20px;font-weight:800;letter-spacing:-.3px}
.pin-brand-sub{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:.8px;margin-top:2px}
.pin-label{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:24px}
.pin-dots{display:flex;gap:16px;margin-bottom:32px}
.pin-dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--border2);transition:all .15s}
.pin-dot.filled{background:var(--accent);border-color:var(--accent)}
.pin-dot.error{background:var(--red);border-color:var(--red)}
.pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:240px}
.pin-key{height:64px;background:var(--surface);border:1px solid var(--border2);border-radius:12px;color:var(--text);font-size:22px;font-weight:700;font-family:'Syne',sans-serif;transition:all .15s;display:flex;align-items:center;justify-content:center}
.pin-key:hover{background:var(--surface2);border-color:var(--accent);color:var(--accent)}
.pin-key:active{transform:scale(.95)}
.pin-key.del{font-size:16px;color:var(--text3)}
.pin-key.del:hover{color:var(--red);border-color:var(--red)}
.pin-key.zero{grid-column:2}
.pin-error{font-size:12px;color:var(--red);font-family:'DM Mono',monospace;height:20px;margin-top:16px;letter-spacing:.5px}
.pin-hint{font-size:10px;color:var(--text3);font-family:'DM Mono',monospace;margin-top:32px;letter-spacing:.5px}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.pin-dots.shake{animation:shake .35s ease}

.gap8{display:flex;flex-direction:column;gap:8px;min-width:0}
.gap12{display:flex;flex-direction:column;gap:12px;min-width:0}
.gap16{display:flex;flex-direction:column;gap:16px;min-width:0}
.mono{font-family:'DM Mono',monospace}
`;

// ─── TRAJECTORY ENGINE ───────────────────────────────────────────────────────
// Each customer carries a monthlySnapshots array: [{ month, gm, arPastDue, openIssues, trend }]
// Snapshots are written automatically when you save your monthly update.
// The engine reads the last 3 snapshots to determine health trajectory.

function getGMFloor(c, g) {
  // Try to infer service type from operatorScore or default to manufacturing floor
  return g.minGM_manufacturing;
}

function snapshotIsGood(snap, gmFloor) {
  return snap.gm >= gmFloor && snap.arPastDue === 0 && snap.openIssues <= 1;
}

function snapshotIsBad(snap, gmFloor) {
  return snap.gm < gmFloor || snap.arPastDue > 0 || snap.openIssues > 2;
}

function getTenureGraceMonths(c) {
  if (!c.tenureStartDate) return 0;
  const months = (new Date() - new Date(c.tenureStartDate)) / (1000 * 60 * 60 * 24 * 30);
  if (months >= 24) return 2;
  if (months >= 12) return 1;
  return 0;
}

function computeTrajectoryStatus(c, g) {
  const snapshots = c.monthlySnapshots || [];
  const gmFloor = getGMFloor(c, g);
  const grace = getTenureGraceMonths(c);

  // Not enough history — use current data only
  if (snapshots.length === 0) {
    const currentBad = c.gm < gmFloor || c.arPastDue > 0 || c.openIssues > 2;
    const currentWarn = c.gm < gmFloor + 2 || c.openIssues > 0;
    return {
      status: currentBad ? "red" : currentWarn ? "yellow" : "green",
      trajectory: "new",
      consecutiveBad: 0,
      consecutiveGood: 0,
      grace,
      label: "Insufficient history",
      detail: "No monthly snapshots yet — status based on current numbers only",
    };
  }

  const recent = [...snapshots].slice(-6); // last 6 months max
  const last3 = recent.slice(-3);

  // Count consecutive bad / good months from most recent backwards
  let consecutiveBad = 0;
  let consecutiveGood = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (snapshotIsBad(recent[i], gmFloor)) { consecutiveBad++; consecutiveGood = 0; }
    else break;
  }
  for (let i = recent.length - 1; i >= 0; i--) {
    if (snapshotIsGood(recent[i], gmFloor)) { consecutiveGood++; consecutiveBad = 0; }
    else break;
  }

  // Trajectory direction
  let trajectory = "stable";
  if (last3.length >= 2) {
    const gmSlope = last3[last3.length - 1].gm - last3[0].gm;
    if (gmSlope >= 1.5) trajectory = "improving";
    else if (gmSlope <= -1.5) trajectory = "deteriorating";
  }

  // Apply grace buffer — tenure earns extra months before escalating
  const effectiveBad = Math.max(0, consecutiveBad - grace);

  // Status logic with grace-buffered thresholds
  // Green → Yellow: 1 bad month (grace may delay)
  // Yellow → Red: 2 consecutive bad months (grace may delay)
  // Red recovery: 1 good month → Yellow, 2 consecutive good months → Green
  let status;
  const currentSnap = { gm: c.gm, arPastDue: c.arPastDue, openIssues: c.openIssues };
  const currentBad = snapshotIsBad(currentSnap, gmFloor);
  const currentGood = snapshotIsGood(currentSnap, gmFloor);

  if (effectiveBad === 0 && currentGood) {
    status = "green";
  } else if (effectiveBad <= 1 && consecutiveGood >= 2) {
    status = "green"; // recovered
  } else if (effectiveBad <= 1 || consecutiveGood === 1) {
    status = "yellow"; // one bad month or partial recovery
  } else {
    status = "red"; // 2+ consecutive bad months after grace
  }

  // Override: if currently good after being bad, show yellow not green (not fully recovered yet)
  if (status === "green" && consecutiveBad >= 1 && consecutiveGood < 2) status = "yellow";

  const statusLabels = {
    green: "Healthy",
    yellow: consecutiveBad >= 1 ? `Watch — ${consecutiveBad} bad month${consecutiveBad > 1 ? "s" : ""}` : "Recovering",
    red: `At Risk — ${consecutiveBad} consecutive bad months`,
  };

  const trajectoryArrow = trajectory === "improving" ? "▲" : trajectory === "deteriorating" ? "▼" : "→";

  return {
    status,
    trajectory,
    trajectoryArrow,
    consecutiveBad,
    consecutiveGood,
    grace,
    label: statusLabels[status],
    detail: `${snapshots.length} month${snapshots.length > 1 ? "s" : ""} of history · ${grace > 0 ? `${grace}-month tenure grace` : "no tenure grace yet"}`,
  };
}

// Write a snapshot for a customer based on current month's data
function writeSnapshot(customer, month, guardrails) {
  const existing = customer.monthlySnapshots || [];
  const alreadyWritten = existing.some(s => s.month === month);
  if (alreadyWritten) return customer;
  const gmFloor = guardrails ? guardrails.minGM_manufacturing : 22;
  const snap = {
    month,
    gm: customer.gm,
    arPastDue: customer.arPastDue,
    openIssues: customer.openIssues,
    revenue_mtd: customer.revenue_mtd,
    gp_mtd: customer.gp_mtd,
    annotation: null,
    // Compute and store health status at save time
    healthStatus: (() => {
      const bad = customer.gm < gmFloor || customer.arPastDue > 0 || customer.openIssues > 2;
      const warn = customer.gm < gmFloor + 2 || customer.openIssues > 0;
      return bad ? "red" : warn ? "yellow" : "green";
    })(),
  };
  // Keep all history — no cap, this is the permanent record
  return { ...customer, monthlySnapshots: [...existing, snap] };
}

// Write manufacturer snapshot
function writeMfrSnapshot(mfr, month) {
  const existing = mfr.monthlySnapshots || [];
  if (existing.some(s => s.month === month)) return mfr;
  const bad = mfr.onTimeRate < 80 || mfr.openNCRs > 1 || mfr.lateShipments > 1;
  const warn = mfr.onTimeRate < 90 || mfr.openNCRs > 0 || mfr.lateShipments > 0;
  const snap = {
    month,
    onTimeRate: mfr.onTimeRate,
    openNCRs: mfr.openNCRs,
    lateShipments: mfr.lateShipments,
    openIssues: mfr.openIssues,
    annotation: null,
    healthStatus: bad ? "red" : warn ? "yellow" : "green",
  };
  return { ...mfr, monthlySnapshots: [...existing, snap] };
}

// Call this when saving monthly data — writes current month snapshot for all customers and manufacturers
function writeMonthlySnapshots(data) {
  const month = new Date().toISOString().slice(0, 7);
  const g = data.settings.guardrails;
  return {
    ...data,
    customers: data.customers.map(c => writeSnapshot(c, month, g)),
    manufacturers: (data.manufacturers || []).map(m => writeMfrSnapshot(m, month)),
  };
}

// Add annotation to a specific snapshot month
function addAnnotation(entity, month, note, isManufacturer = false) {
  const snaps = entity.monthlySnapshots || [];
  return {
    ...entity,
    monthlySnapshots: snaps.map(s => s.month === month ? { ...s, annotation: note } : s),
  };
}


const Tile = ({ label, value, sub, color }) => (
  <div className="tile">
    <div className="tile-label">{label}</div>
    <div className={`tile-val ${color || ""}`}>{value}</div>
    {sub && <div className="tile-sub">{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span className={`pill ${color}`}><span className={`dot ${color}`} />{label}</span>
);

const Alert = ({ sev, module: mod, text }) => (
  <div className={`alert ${sev}`}>
    <span className={`abadge ${sev}`}>{mod}</span>
    <span style={{ fontSize: 12.5 }}>{text}</span>
  </div>
);

const Bar = ({ value, max, color }) => (
  <div className="track"><div className={`fill ${color}`} style={{ width: `${Math.min((value / Math.max(max, 1)) * 100, 100)}%` }} /></div>
);

const MRow = ({ label, value, valueColor }) => (
  <div className="mrow">
    <span className="mname">{label}</span>
    <span className={`mval ${valueColor || ""}`}>{value}</span>
  </div>
);

// ─── DERIVED ALERTS ──────────────────────────────────────────────────────────
function deriveAlerts(d) {
  const alerts = [];
  const g = d.settings.guardrails;
  const totalCash = d.cash.accounts.reduce((s, a) => s + a.balance, 0);
  const arPastDue = d.ar.aging.slice(2).reduce((s, r) => s + r.amount, 0);

  d.customers.forEach(c => {
    const traj = computeTrajectoryStatus(c, g);

    if (traj.status === "red") {
      alerts.push({ sev: "red", mod: "Margin", text: `${c.name} health RED — ${traj.label}${traj.grace > 0 ? ` (${traj.grace}mo tenure grace applied)` : ""}` });
    } else if (traj.status === "yellow" && traj.consecutiveBad >= 1) {
      alerts.push({ sev: "yellow", mod: "Margin", text: `${c.name} health YELLOW — ${traj.label}` });
    }
    if (c.arPastDue > 0) alerts.push({ sev: "red", mod: "Collections", text: `${c.name} past due A/R ${fmt(c.arPastDue)} — ${c.payDays}d avg pay cycle` });
    if (c.concentration >= g.maxCustomerConcentration) alerts.push({ sev: "red", mod: "Concentration", text: `${c.name} at ${pct(c.concentration)} revenue — exceeds ${pct(g.maxCustomerConcentration)} cap` });
    else if (c.concentration >= g.maxCustomerConcentration * 0.8) alerts.push({ sev: "yellow", mod: "Concentration", text: `${c.name} at ${pct(c.concentration)} — approaching ${pct(g.maxCustomerConcentration)} cap` });
    if (traj.status === "green" && traj.trajectory === "improving" && c.tier === "A") alerts.push({ sev: "green", mod: "Customer", text: `${c.name} trending up consistently — expansion candidate` });
  });

  if (totalCash < g.cashReserveTarget) alerts.push({ sev: "red", mod: "Cash", text: `Cash ${fmt(totalCash)} below reserve floor ${fmt(g.cashReserveTarget)}` });
  if (arPastDue > 30000) alerts.push({ sev: "red", mod: "A/R", text: `${fmt(arPastDue)} in A/R past 31 days` });

  const empe = d.financials.gp.ytd / d.settings.employees;
  if (empe < g.empeTarget * 0.85) alerts.push({ sev: "red", mod: "EMPE", text: `EMPE ${fmt(empe)} — ${fmt(g.empeTarget - empe)} below target` });

  d.issues.filter(i => i.daysOpen > 14 && i.exposure > 10000).forEach(i =>
    alerts.push({ sev: "yellow", mod: "Issues", text: `${i.entity} — ${i.category} open ${i.daysOpen}d, ${fmt(i.exposure)} at risk` })
  );

  return alerts.slice(0, 10);
}

// ─── MODULE: HOME ────────────────────────────────────────────────────────────
function HomeScreen({ d, onStartReview }) {
  const g = d.settings.guardrails;
  const totalCash = d.cash.accounts.reduce((s, a) => s + a.balance, 0);
  const empe = d.financials.gp.ytd / d.settings.employees;
  const alerts = deriveAlerts(d);
  const top5 = [...d.customers].sort((a, b) => b.gp_ytd - a.gp_ytd).slice(0, 5);
  const bottom5 = [...d.customers].sort((a, b) => a.gm - b.gm).slice(0, 5);
  const cashColor = totalCash >= g.cashReserveTarget * 2 ? "green" : totalCash >= g.cashReserveTarget ? "yellow" : "red";
  const marginColor = d.financials.gm.mtd >= g.minGM_manufacturing + 2 ? "green" : d.financials.gm.mtd >= g.minGM_manufacturing ? "yellow" : "red";
  const hasRedAR = d.customers.some(c => c.arPastDue > 0);
  const maxConc = Math.max(...d.customers.map(c => c.concentration));

  // Monthly review check
  const now = new Date();
  const reviewDue = d.customers.some(c => {
    if (!c.lastReviewDate) return true;
    const last = new Date(c.lastReviewDate);
    return (now.getFullYear() > last.getFullYear()) || (now.getMonth() > last.getMonth());
  });
  const neverReviewed = d.customers.filter(c => !c.lastReviewDate).length;
  const dueCount = d.customers.filter(c => {
    if (!c.lastReviewDate) return true;
    const last = new Date(c.lastReviewDate);
    return (now.getFullYear() > last.getFullYear()) || (now.getMonth() > last.getMonth());
  }).length;

  return (
    <div className="gap16">
      <div className="sh"><div className="sh-title">Command</div><div className="sh-sub">CEO Home · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div></div>

      {reviewDue && (
        <div className="review-banner">
          <div className="review-banner-left">
            <span className="review-banner-icon">📋</span>
            <div>
              <div className="review-banner-text">Monthly Customer Review Due</div>
              <div className="review-banner-sub">{dueCount} customer{dueCount > 1 ? "s" : ""} need scoring · takes ~5 minutes</div>
            </div>
          </div>
          <button className="review-banner-btn" onClick={onStartReview}>Start Review →</button>
        </div>
      )}

      <div className="card">
        <div className="card-title">Health Status</div>
        <div className="pill-row">
          <Pill label="Cash Health" color={cashColor} />
          <Pill label="Margin Health" color={marginColor} />
          <Pill label="Customer Concentration" color={maxConc >= g.maxCustomerConcentration ? "red" : maxConc >= g.maxCustomerConcentration * 0.8 ? "yellow" : "green"} />
          <Pill label="Collections Risk" color={hasRedAR ? "red" : "green"} />
          <Pill label="EMPE" color={empe >= g.empeTarget ? "green" : empe >= g.empeTarget * 0.85 ? "yellow" : "red"} />
        </div>
      </div>

      <div className="g4">
        <Tile label="Bank Cash" value={fmt(totalCash)} sub={`Reserve target: ${fmt(g.cashReserveTarget)}`} color={cashColor} />
        <Tile label="A/R Due This Week" value={fmt(d.ar.dueThisWeek)} sub={`Total open: ${fmt(d.ar.aging.reduce((s, r) => s + r.amount, 0))}`} color="yellow" />
        <Tile label="A/P Due This Week" value={fmt(d.ap.dueThisWeek)} sub={`Total A/P: ${fmt(d.ap.aging.reduce((s, r) => s + r.amount, 0))}`} />
        <Tile label="Revenue MTD" value={fmt(d.financials.revenue.mtd)} sub={`QTD: ${fmt(d.financials.revenue.qtd)}`} />
        <Tile label="GP$ MTD" value={fmt(d.financials.gp.mtd)} sub={`QTD: ${fmt(d.financials.gp.qtd)}`} color={marginColor} />
        <Tile label="GM% MTD" value={pct(d.financials.gm.mtd)} sub={`Target: ${pct(d.financials.gm.target)}`} color={marginColor} />
        <Tile label="Trailing 30d GM%" value={pct(d.financials.gm.mtd)} sub={`90d: ${pct(d.financials.gm.qtd)}`} color={marginColor} />
        <Tile label="EMPE" value={fmt(empe)} sub={`Target: ${fmt(g.empeTarget)}`} color={empe >= g.empeTarget ? "green" : "red"} />
      </div>

      <div className="card">
        <div className="card-title">Alerts ({alerts.length})</div>
        <div className="gap8">{alerts.map((a, i) => <Alert key={i} sev={a.sev} module={a.mod} text={a.text} />)}</div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-title">Top 5 by GP$ YTD</div>
          <div className="tbl-wrap">
            <table><thead><tr><th>Customer</th><th>GP$ YTD</th><th>GM%</th><th>Tier</th></tr></thead>
              <tbody>{top5.map(c => (
                <tr key={c.id}><td style={{ fontWeight: 600, color: "var(--text)" }}>{c.name}</td>
                  <td className="mono">{fmt(c.gp_ytd)}</td>
                  <td className="mono" style={{ color: c.gm >= 25 ? "var(--green)" : c.gm >= 18 ? "var(--yellow)" : "var(--red)" }}>{pct(c.gm)}</td>
                  <td><span className={`tag tag-${c.tier.toLowerCase()}`}>{c.tier}</span></td>
                </tr>))}</tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Bottom 5 by GM%</div>
          <div className="tbl-wrap">
            <table><thead><tr><th>Customer</th><th>GM%</th><th>Strategy</th><th>Issues</th></tr></thead>
              <tbody>{bottom5.map(c => (
                <tr key={c.id}><td style={{ fontWeight: 600, color: "var(--text)" }}>{c.name}</td>
                  <td className="mono" style={{ color: c.gm >= 25 ? "var(--green)" : c.gm >= 18 ? "var(--yellow)" : "var(--red)" }}>{pct(c.gm)}</td>
                  <td><span className="chip" style={{ background: STRATEGY_COLORS[c.strategy] + "22", color: STRATEGY_COLORS[c.strategy] }}>{c.strategy.toUpperCase()}</span></td>
                  <td className="mono" style={{ color: c.openIssues > 2 ? "var(--red)" : c.openIssues > 0 ? "var(--yellow)" : "var(--green)" }}>{c.openIssues}</td>
                </tr>))}</tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Diversification Gap Widget */}
      {(() => {
        const pipeline = d.pipeline || [];
        const totalRev = d.customers.reduce((s, c) => s + c.revenue_ytd, 0);
        const anchor = [...d.customers].sort((a, b) => b.revenue_ytd - a.revenue_ytd)[0];
        const anchorConc = totalRev > 0 ? (anchor?.revenue_ytd / totalRev) * 100 : 0;
        const cap = d.settings.guardrails.maxCustomerConcentration;
        const revenueNeeded = anchor ? Math.max(0, anchor.revenue_ytd / (cap / 100) - totalRev) : 0;
        const weightedPipeline = pipeline.reduce((s, p) => s + p.revenue * (p.probability / 100), 0);
        const coverage = revenueNeeded > 0 ? Math.min((weightedPipeline / revenueNeeded) * 100, 100) : 100;
        const anchorColor = anchorConc >= cap ? "var(--red)" : anchorConc >= cap * 0.8 ? "var(--yellow)" : "var(--green)";
        return (
          <div className="card" style={{ borderColor: anchorConc >= cap ? "rgba(255,71,87,.3)" : "var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>Diversification Gap — {anchor?.name}</div>
              <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>auto-anchor · largest customer</span>
            </div>
            <div className="g4">
              <div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 4 }}>Current Concentration</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: anchorColor }}>{pct(anchorConc)}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>cap: {pct(cap)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 4 }}>Revenue Gap to Cap</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: revenueNeeded > 0 ? "var(--yellow)" : "var(--green)" }}>{fmt(revenueNeeded)}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>non-{anchor?.name?.split(" ")[0]} needed</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 4 }}>Pipeline Coverage</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: coverage >= 80 ? "var(--green)" : coverage >= 40 ? "var(--yellow)" : "var(--red)" }}>{pct(coverage)}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>{fmt(weightedPipeline)} wtd pipeline</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 8 }}>Progress to Cap</div>
                <div style={{ height: 8, background: "var(--border2)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", left: `${Math.min(cap, 100)}%`, top: 0, bottom: 0, width: 2, background: "rgba(255,201,71,.6)" }} />
                  <div style={{ height: "100%", width: `${Math.min(anchorConc, 100)}%`, background: anchorColor, borderRadius: 4 }} />
                </div>
                <div style={{ height: 8, background: "var(--border2)", borderRadius: 4, overflow: "hidden", marginTop: 4 }}>
                  <div style={{ height: "100%", width: `${coverage}%`, background: coverage >= 80 ? "var(--green)" : "var(--yellow)", borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 3 }}>top: concentration · bottom: pipeline coverage</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── MODULE: FLASH FINANCIALS ─────────────────────────────────────────────────
function FlashFinancials({ d }) {
  const f = d.financials;
  const g = d.settings.guardrails;
  const empe = f.gp.ytd / d.settings.employees;
  const revPerHead = f.revenue.ytd / d.settings.employees;
  const overheadPct = (f.overheadRunRate * 12) / f.gp.ytd * 100;
  const budgetAttain = f.revenue.ytd / (f.revenue.budget * (3 / 12)) * 100;
  const top3conc = d.customers.slice(0, 3).reduce((s, c) => s + c.concentration, 0);
  const top5conc = d.customers.slice(0, 5).reduce((s, c) => s + c.concentration, 0);
  const hasBookkeeper = !!f.lastBookkeeperMonth;

  const BasisTag = ({ basis, confirmed }) => (
    <span className={`basis-tag ${confirmed ? "confirmed" : basis}`}>
      {confirmed ? "✓ CONFIRMED" : basis === "accrual" ? "ACCRUAL" : "CASH"}
    </span>
  );

  const diffColor = (accrual, cash) => {
    const d = accrual - cash;
    if (Math.abs(d) < accrual * 0.02) return "var(--text3)";
    return d > 0 ? "var(--green)" : "var(--red)";
  };

  const CompareRow = ({ label, accrual, cash, isCurrency = true, isPct = false }) => {
    const diff = accrual - cash;
    const fmt2 = (v) => isPct ? pct(v) : fmt(v);
    const diffStr = isPct ? `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}pts` : `${diff >= 0 ? "+" : ""}${fmt(Math.abs(diff))}`;
    return (
      <div className="basis-compare-row">
        <span className="basis-compare-label">{label}</span>
        <span className="basis-compare-val" style={{ color: "var(--text)" }}>{fmt2(accrual)}</span>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, padding: "8px 10px" }}>
          <span className="basis-compare-val" style={{ color: "var(--text3)", padding: 0 }}>{fmt2(cash)}</span>
          <span style={{ fontSize: 10, fontFamily: "DM Mono,monospace", color: diffColor(accrual, cash), minWidth: 50, textAlign: "right" }}>{diffStr}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="gap16">
      <div className="sh">
        <div className="sh-title">Flash Financials</div>
        <div className="sh-sub">
          Primary basis: Accrual
          <BasisTag basis="accrual" confirmed={hasBookkeeper} />
          {hasBookkeeper && <span style={{ marginLeft: 8, fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>Bookkeeper confirmed: {f.lastBookkeeperMonth}</span>}
        </div>
      </div>

      {/* Accrual vs Cash side-by-side */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Accrual vs Cash Comparison</div>
          <div style={{ display: "flex", gap: 12, fontSize: 10, fontFamily: "DM Mono,monospace" }}>
            <span style={{ color: "var(--text)" }}>● Accrual (primary)</span>
            <span style={{ color: "var(--text3)" }}>● Cash</span>
            <span style={{ color: "var(--text3)" }}>Δ Difference</span>
          </div>
        </div>
        <div className="basis-compare-header">
          <span className="basis-col-header">Metric</span>
          <span className="basis-col-header">Accrual <BasisTag basis="accrual" /></span>
          <span className="basis-col-header">Cash <BasisTag basis="cash" /> / Δ</span>
        </div>
        <CompareRow label="Revenue MTD" accrual={f.revenue.mtd} cash={f.cash_revenue?.mtd || f.revenue.mtd} />
        <CompareRow label="Revenue QTD" accrual={f.revenue.qtd} cash={f.cash_revenue?.qtd || f.revenue.qtd} />
        <CompareRow label="Revenue YTD" accrual={f.revenue.ytd} cash={f.cash_revenue?.ytd || f.revenue.ytd} />
        <CompareRow label="GP$ MTD" accrual={f.gp.mtd} cash={f.cash_gp?.mtd || f.gp.mtd} />
        <CompareRow label="GP$ YTD" accrual={f.gp.ytd} cash={f.cash_gp?.ytd || f.gp.ytd} />
        <CompareRow label="GM% MTD" accrual={f.gm.mtd} cash={f.cash_gm?.mtd || f.gm.mtd} isPct />
        <CompareRow label="Net Income Est." accrual={f.netIncomeEstimate} cash={f.netIncomeCash || f.netIncomeEstimate} />
        <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--surface2)", borderRadius: 6, fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>
          Differences reflect timing gaps between earned revenue (accrual) and cash received. A persistent positive gap signals collections lag.
        </div>
      </div>

      {/* Core P&L — Accrual primary */}
      <div className="g3">
        <div className="card">
          <div className="card-title">Revenue <BasisTag basis="accrual" confirmed={hasBookkeeper} /></div>
          {[["MTD", f.revenue.mtd], ["QTD", f.revenue.qtd], ["YTD", f.revenue.ytd], ["Budget YTD", f.revenue.budget * 3 / 12]].map(([l, v]) => <MRow key={l} label={l} value={fmt(v)} />)}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text3)", marginBottom: 5 }}>
              <span className="mono">Budget attainment</span><span className="mono">{pct(budgetAttain)}</span>
            </div>
            <Bar value={f.revenue.ytd} max={f.revenue.budget * 3 / 12} color={budgetAttain >= 95 ? "green" : budgetAttain >= 80 ? "yellow" : "red"} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Gross Profit <BasisTag basis="accrual" confirmed={hasBookkeeper} /></div>
          {[["GP$ MTD", fmt(f.gp.mtd)], ["GP$ QTD", fmt(f.gp.qtd)], ["GP$ YTD", fmt(f.gp.ytd)], ["GM% MTD", pct(f.gm.mtd)], ["GM% QTD", pct(f.gm.qtd)], ["GM% Target", pct(f.gm.target)]].map(([l, v]) => <MRow key={l} label={l} value={v} />)}
        </div>
        <div className="card">
          <div className="card-title">P&L Snapshot <BasisTag basis="accrual" confirmed={hasBookkeeper} /></div>
          {[["Net Income Est.", fmt(f.netIncomeEstimate)], ["Overhead / mo", fmt(f.overheadRunRate)], ["Payroll / mo", fmt(f.payrollRunRate)], ["Owner Comp YTD", fmt(f.ownerCompYTD)], ["Distributions YTD", fmt(f.distributionsYTD)], ["Overhead as % GP$", pct(overheadPct)]].map(([l, v]) => <MRow key={l} label={l} value={v} />)}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Operator Efficiency <BasisTag basis="accrual" confirmed={hasBookkeeper} /></div>
        <div className="g4">
          <Tile label="EMPE" value={fmt(empe)} sub={`Target: ${fmt(g.empeTarget)}`} color={empe >= g.empeTarget ? "green" : "red"} />
          <Tile label="Revenue / Employee" value={fmt(revPerHead)} sub={`Target: ${fmt(g.revenuePerHeadTarget)}`} color={revPerHead >= g.revenuePerHeadTarget ? "green" : "yellow"} />
          <Tile label="Headcount" value={d.settings.employees} sub="FT employees" />
          <Tile label="Overhead % of GP$" value={pct(overheadPct)} sub="Target <50%" color={overheadPct <= 50 ? "green" : "red"} />
        </div>
      </div>

      <div className="card">
        <div className="card-title">GP$ by Service Line <BasisTag basis="accrual" confirmed={hasBookkeeper} /></div>
        <div className="tbl-wrap">
          <table><thead><tr><th>Service Line</th><th>Revenue YTD</th><th>GP$ YTD</th><th>GM%</th><th>vs Floor</th><th>GP Mix</th></tr></thead>
            <tbody>{f.serviceLines.map(s => {
              const floor = s.name.includes("NPD") ? g.minGM_npd : s.name.includes("Raw") ? g.minGM_rawMaterial : g.minGM_manufacturing;
              const diff = s.gm - floor;
              const color = diff >= 2 ? "var(--green)" : diff >= 0 ? "var(--yellow)" : "var(--red)";
              return (
                <tr key={s.name}>
                  <td style={{ color: "var(--text)", fontWeight: 600 }}>{s.name}</td>
                  <td className="mono">{fmt(s.revenue)}</td><td className="mono">{fmt(s.gp)}</td>
                  <td className="mono" style={{ color }}>{pct(s.gm)}</td>
                  <td className="mono" style={{ color }}>{diff >= 0 ? "+" : ""}{diff.toFixed(1)}pts</td>
                  <td style={{ width: 120 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1 }}><Bar value={s.gp} max={f.gp.ytd} color="green" /></div>
                      <span className="mono" style={{ fontSize: 10, color: "var(--text3)", minWidth: 32 }}>{(s.gp / f.gp.ytd * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Customer Concentration</div>
        <div className="g3">
          <Tile label="Top 1 as % Revenue" value={pct(d.customers[0]?.concentration || 0)} color={d.customers[0]?.concentration >= g.maxCustomerConcentration ? "red" : "yellow"} />
          <Tile label="Top 3 as % Revenue" value={pct(top3conc)} color={top3conc >= 60 ? "red" : top3conc >= 45 ? "yellow" : "green"} />
          <Tile label="Top 5 as % Revenue" value={pct(top5conc)} color={top5conc >= 80 ? "red" : "green"} />
        </div>
      </div>
    </div>
  );
}

// ─── MODULE: CUSTOMERS ────────────────────────────────────────────────────────
function CustomerScoreboard({ d, onSave }) {
  const [sel, setSel] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const g = d.settings.guardrails;

  const StatusDot = ({ status }) => {
    const colors = { green: "var(--green)", yellow: "var(--yellow)", red: "var(--red)" };
    return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: colors[status] || "var(--text3)", marginRight: 5 }} />;
  };

  const TrajArrow = ({ traj }) => {
    const color = traj.trajectory === "improving" ? "var(--green)" : traj.trajectory === "deteriorating" ? "var(--red)" : "var(--text3)";
    return <span style={{ color, fontSize: 11, marginLeft: 4 }}>{traj.trajectoryArrow}</span>;
  };

  const GMSparkline = ({ snapshots, floor }) => {
    if (!snapshots || snapshots.length < 2) return <span style={{ fontSize: 10, color: "var(--text3)" }}>—</span>;
    const vals = snapshots.slice(-6).map(s => s.gm);
    const min = Math.min(...vals, floor - 3);
    const max = Math.max(...vals, floor + 3);
    const range = max - min || 1;
    const w = 80; const h = 24;
    const points = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
    const floorY = h - ((floor - min) / range) * h;
    return (
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <line x1={0} y1={floorY} x2={w} y2={floorY} stroke="var(--border2)" strokeWidth={1} strokeDasharray="2,2" />
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round" />
        {vals.map((v, i) => (
          <circle key={i} cx={(i / (vals.length - 1)) * w} cy={h - ((v - min) / range) * h} r={2}
            fill={v >= floor ? "var(--green)" : "var(--red)"} />
        ))}
      </svg>
    );
  };

  return (
    <div className="gap16">
      <div className="sh"><div className="sh-title">Customer Profitability</div><div className="sh-sub">Trajectory-aware health status · click any row to drill in</div></div>
      {snapshot && <CustomerSnapshot customer={snapshot} data={d} onClose={() => setSnapshot(null)} />}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Customer</th><th>Owners</th><th>Health</th><th>Rev YTD</th><th>GP$ YTD</th><th>GM%</th>
              <th>GM Trend</th><th>Open A/R</th><th>Past Due</th><th>Issues</th>
              <th>Tier</th><th>Strategy</th><th>Score</th>
            </tr></thead>
            <tbody>{d.customers.map(c => {
              const traj = computeTrajectoryStatus(c, g);
              return (
                <tr key={c.id} className="clickable" onClick={() => setSel(sel?.id === c.id ? null : c)}>
                  <td style={{ fontWeight: 600, color: "var(--text)" }}>{c.name}</td>
                  <td>{(c.owners || []).map(o => <span key={o} style={{ fontSize: 9, fontFamily: "DM Mono,monospace", background: "rgba(59,130,246,.15)", color: "var(--blue)", padding: "1px 6px", borderRadius: 3, marginRight: 3, fontWeight: 700 }}>{o}</span>)}</td>
                  <td>
                    <StatusDot status={traj.status} />
                    <span style={{ fontSize: 11, color: traj.status === "red" ? "var(--red)" : traj.status === "yellow" ? "var(--yellow)" : "var(--green)" }}>
                      {traj.label}
                    </span>
                    <TrajArrow traj={traj} />
                  </td>
                  <td className="mono">{fmt(c.revenue_ytd)}</td>
                  <td className="mono">{fmt(c.gp_ytd)}</td>
                  <td className="mono" style={{ color: c.gm >= 25 ? "var(--green)" : c.gm >= 18 ? "var(--yellow)" : "var(--red)" }}>{pct(c.gm)}</td>
                  <td><GMSparkline snapshots={c.monthlySnapshots} floor={g.minGM_manufacturing} /></td>
                  <td className="mono">{fmt(c.arOpen)}</td>
                  <td className="mono" style={{ color: c.arPastDue > 0 ? "var(--red)" : "var(--text3)" }}>{c.arPastDue > 0 ? fmt(c.arPastDue) : "—"}</td>
                  <td className="mono" style={{ color: c.openIssues > 2 ? "var(--red)" : c.openIssues > 0 ? "var(--yellow)" : "var(--green)" }}>{c.openIssues}</td>
                  <td><span className={`tag tag-${c.tier.toLowerCase()}`}>{c.tier}</span></td>
                  <td><span className="chip" style={{ background: STRATEGY_COLORS[c.strategy] + "22", color: STRATEGY_COLORS[c.strategy] }}>{c.strategy.toUpperCase()}</span></td>
                  <td style={{ fontSize: 11, color: "var(--text3)" }}>{OPERATOR_LABELS[c.operatorScore] || c.operatorScore}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
      {sel && (() => {
        const traj = computeTrajectoryStatus(sel, g);
        const snapshots = sel.monthlySnapshots || [];
        const tenureMonths = sel.tenureStartDate ? Math.floor((new Date() - new Date(sel.tenureStartDate)) / (1000 * 60 * 60 * 24 * 30)) : 0;
        return (
          <div className="card" style={{ borderColor: traj.status === "red" ? "rgba(255,71,87,.3)" : traj.status === "yellow" ? "rgba(255,201,71,.3)" : "rgba(0,212,160,.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{sel.name}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 2 }}>
                  {sel.manufacturers} mfr · {sel.skus} SKUs · {sel.payDays}d avg pay · {pct(sel.concentration)} concentration · {tenureMonths}mo tenure
                </div>
                {(sel.owners || []).length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {(sel.owners || []).map(o => (
                      <span key={o} style={{ fontSize: 10, fontFamily: "DM Mono,monospace", background: "rgba(59,130,246,.15)", color: "var(--blue)", padding: "2px 8px", borderRadius: 4, marginRight: 4, fontWeight: 700 }}>{o}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                <button className="snapshot-btn" onClick={() => setSnapshot(sel)}>📄 Snapshot PDF</button>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: traj.status === "red" ? "var(--red)" : traj.status === "yellow" ? "var(--yellow)" : "var(--green)" }}>
                    {traj.label} {traj.trajectoryArrow}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 2 }}>{traj.detail}</div>
                </div>
              </div>
            </div>

            {/* Trajectory context bar */}
            <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, fontFamily: "DM Mono,monospace" }}>
                <span style={{ color: "var(--text3)" }}>Consecutive bad months: </span>
                <span style={{ color: traj.consecutiveBad >= 2 ? "var(--red)" : traj.consecutiveBad === 1 ? "var(--yellow)" : "var(--green)", fontWeight: 700 }}>{traj.consecutiveBad}</span>
              </div>
              <div style={{ fontSize: 11, fontFamily: "DM Mono,monospace" }}>
                <span style={{ color: "var(--text3)" }}>Consecutive good months: </span>
                <span style={{ color: traj.consecutiveGood >= 2 ? "var(--green)" : "var(--text)", fontWeight: 700 }}>{traj.consecutiveGood}</span>
              </div>
              <div style={{ fontSize: 11, fontFamily: "DM Mono,monospace" }}>
                <span style={{ color: "var(--text3)" }}>Tenure grace buffer: </span>
                <span style={{ color: "var(--text)", fontWeight: 700 }}>{traj.grace} month{traj.grace !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ fontSize: 11, fontFamily: "DM Mono,monospace" }}>
                <span style={{ color: "var(--text3)" }}>Direction: </span>
                <span style={{ color: traj.trajectory === "improving" ? "var(--green)" : traj.trajectory === "deteriorating" ? "var(--red)" : "var(--text3)", fontWeight: 700 }}>{traj.trajectory} {traj.trajectoryArrow}</span>
              </div>
            </div>

            <div className="g4">
              <Tile label="Revenue MTD" value={fmt(sel.revenue_mtd)} />
              <Tile label="GP$ MTD" value={fmt(sel.gp_mtd)} color={sel.gm >= 25 ? "green" : sel.gm >= 18 ? "yellow" : "red"} />
              <Tile label="GM%" value={pct(sel.gm)} color={sel.gm >= 25 ? "green" : sel.gm >= 18 ? "yellow" : "red"} />
              <Tile label="Avg Order Size" value={fmt(sel.avgOrderSize)} />
              <Tile label="Open A/R" value={fmt(sel.arOpen)} />
              <Tile label="Past Due A/R" value={sel.arPastDue > 0 ? fmt(sel.arPastDue) : "$0"} color={sel.arPastDue > 0 ? "red" : "green"} />
              <Tile label="Open Issues" value={sel.openIssues} color={sel.openIssues > 2 ? "red" : sel.openIssues > 0 ? "yellow" : "green"} />
              <Tile label="Tenure" value={`${tenureMonths}mo`} sub={`${traj.grace}mo grace buffer`} color={tenureMonths >= 24 ? "green" : tenureMonths >= 12 ? "yellow" : "red"} />
            </div>

            {snapshots.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="card-title" style={{ marginBottom: 10 }}>Monthly GM% History (dashed = floor)</div>
                <div className="tbl-wrap">
                  <table>
                    <thead><tr><th>Month</th><th>GM%</th><th>vs Floor</th><th>Past Due A/R</th><th>Issues</th><th>Health</th></tr></thead>
                    <tbody>{[...snapshots].reverse().map((s, i) => {
                      const diff = s.gm - g.minGM_manufacturing;
                      const snapBad = snapshotIsBad(s, g.minGM_manufacturing);
                      const snapGood = snapshotIsGood(s, g.minGM_manufacturing);
                      const snapColor = snapGood ? "var(--green)" : snapBad ? "var(--red)" : "var(--yellow)";
                      return (
                        <tr key={i}>
                          <td className="mono" style={{ color: "var(--text2)" }}>{s.month}</td>
                          <td className="mono" style={{ color: s.gm >= g.minGM_manufacturing ? "var(--green)" : "var(--red)" }}>{pct(s.gm)}</td>
                          <td className="mono" style={{ color: diff >= 0 ? "var(--green)" : "var(--red)" }}>{diff >= 0 ? "+" : ""}{diff.toFixed(1)}pts</td>
                          <td className="mono" style={{ color: s.arPastDue > 0 ? "var(--red)" : "var(--text3)" }}>{s.arPastDue > 0 ? fmt(s.arPastDue) : "—"}</td>
                          <td className="mono" style={{ color: s.openIssues > 2 ? "var(--red)" : s.openIssues > 0 ? "var(--yellow)" : "var(--green)" }}>{s.openIssues}</td>
                          <td><span style={{ fontSize: 10, color: snapColor, fontFamily: "DM Mono,monospace", fontWeight: 700 }}>{snapGood ? "GOOD" : snapBad ? "BAD" : "WATCH"}</span></td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              </div>
            )}

            {sel.overrideNote && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,201,71,.07)", borderRadius: 8, border: "1px solid rgba(255,201,71,.2)", fontSize: 12 }}>
                <span style={{ color: "var(--yellow)", fontWeight: 700, marginRight: 8 }}>Override note:</span>
                <span style={{ color: "var(--text2)" }}>{sel.overrideNote}</span>
                {sel.overrideDate && <span style={{ color: "var(--text3)", marginLeft: 8, fontFamily: "DM Mono,monospace", fontSize: 10 }}>— {new Date(sel.overrideDate).toLocaleDateString()}</span>}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>Health Timeline — click any dot to annotate</div>
              <HealthTimeline
                entity={sel}
                onSave={(updatedCustomer) => {
                  const newData = { ...d, customers: d.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c) };
                  onSave(newData);
                  setSel(updatedCustomer);
                }}
              />
            </div>

            <div style={{ marginTop: 10, padding: "9px 13px", background: "var(--surface2)", borderRadius: 8, fontSize: 12 }}>
              <span style={{ color: "var(--text3)", marginRight: 8 }}>Operator Score:</span>
              <span style={{ fontWeight: 700 }}>{OPERATOR_LABELS[sel.operatorScore] || sel.operatorScore}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── MODULE: CASH ─────────────────────────────────────────────────────────────
function CashCommand({ d }) {
  const g = d.settings.guardrails;
  const totalCash = d.cash.accounts.reduce((s, a) => s + a.balance, 0);
  const totalAR = d.ar.aging.reduce((s, r) => s + r.amount, 0);
  const totalAP = d.ap.aging.reduce((s, r) => s + r.amount, 0);
  const safeToDistribute = Math.max(0, totalCash - g.cashReserveTarget - d.ap.dueThisWeek - 20000);
  const maxFlow = Math.max(...d.cashForecast.map(w => Math.max(w.inflows, w.outflows)));
  let runningBal = totalCash;

  return (
    <div className="gap16">
      <div className="sh"><div className="sh-title">Cash Command</div><div className="sh-sub">13-week forecast · aging · distribution availability</div></div>
      <div className="g4">
        <Tile label="Total Cash" value={fmt(totalCash)} color={totalCash >= g.cashReserveTarget ? "green" : "red"} />
        <Tile label="Reserve Floor" value={fmt(g.cashReserveTarget)} sub={totalCash >= g.cashReserveTarget ? "Met" : "Below target"} color={totalCash >= g.cashReserveTarget ? "green" : "red"} />
        <Tile label="Safe to Distribute" value={fmt(safeToDistribute)} sub="After reserve + A/P + buffer" color={safeToDistribute > 0 ? "green" : "red"} />
        <Tile label="Oh-No Fund" value={fmt(d.cash.ohNoProgress)} sub={`Target: ${fmt(g.ohNoFundTarget)}`} color={d.cash.ohNoProgress >= g.ohNoFundTarget ? "green" : "yellow"} />
      </div>
      <div className="card">
        <div className="card-title">Cash by Account</div>
        <div className="gap12">{d.cash.accounts.map(a => (
          <div key={a.name} className="mrow">
            <span className="mname">{a.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, marginLeft: 16 }}>
              <div style={{ flex: 1 }}><Bar value={a.balance} max={totalCash} color="green" /></div>
              <span className="mval mono">{fmt(a.balance)}</span>
            </div>
          </div>
        ))}</div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-title">A/R Aging</div>
          <div className="gap12">{d.ar.aging.map((r, i) => (
            <div key={r.bucket} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text2)", width: 80 }}>{r.bucket}</span>
              <div style={{ flex: 1 }}><Bar value={r.amount} max={totalAR} color={i === 0 ? "green" : i <= 2 ? "yellow" : "red"} /></div>
              <span className="mval mono" style={{ fontSize: 12 }}>{fmt(r.amount)}</span>
            </div>
          ))}
            <MRow label="Total A/R" value={fmt(totalAR)} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">A/P Aging</div>
          <div className="gap12">{d.ap.aging.map((r, i) => (
            <div key={r.bucket} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text2)", width: 80 }}>{r.bucket}</span>
              <div style={{ flex: 1 }}><Bar value={r.amount} max={totalAP} color={i === 0 ? "green" : i === 1 ? "yellow" : "red"} /></div>
              <span className="mval mono" style={{ fontSize: 12 }}>{fmt(r.amount)}</span>
            </div>
          ))}
            <MRow label="Total A/P" value={fmt(totalAP)} />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">13-Week Cash Forecast</div>
        <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: "var(--green)", fontFamily: "DM Mono,monospace" }}>■ Inflows</span>
          <span style={{ fontSize: 10, color: "var(--red)", fontFamily: "DM Mono,monospace" }}>■ Outflows</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>Reserve floor: {fmt(g.cashReserveTarget)}</span>
        </div>
        <div className="gap8">{d.cashForecast.map(w => {
          runningBal = runningBal + w.inflows - w.outflows;
          const belowFloor = runningBal < g.cashReserveTarget;
          return (
            <div key={w.week} className="fc-row">
              <span className="fc-label">{w.week}</span>
              <div className="fc-bars">
                <div className="fc-bar fc-in" style={{ width: `${(w.inflows / maxFlow) * 180}px` }} />
                <div className="fc-bar fc-out" style={{ width: `${(w.outflows / maxFlow) * 180}px` }} />
              </div>
              <span className="fc-net" style={{ color: w.inflows - w.outflows >= 0 ? "var(--green)" : "var(--red)" }}>{w.inflows - w.outflows >= 0 ? "+" : ""}{fmt(Math.abs(w.inflows - w.outflows))}</span>
              <span className="fc-bal" style={{ color: belowFloor ? "var(--red)" : "var(--text3)" }}>{fmt(runningBal)}</span>
            </div>
          );
        })}</div>
      </div>
    </div>
  );
}

// ─── MODULE: GUARDRAILS ───────────────────────────────────────────────────────
function GuardrailsTab({ d }) {
  const g = d.settings.guardrails;
  const f = d.financials;
  const empe = f.gp.ytd / d.settings.employees;
  const revPerHead = f.revenue.ytd / d.settings.employees;
  const totalCash = d.cash.accounts.reduce((s, a) => s + a.balance, 0);

  const rules = [
    { name: "GM% Floor — Manufacturing Mgmt", detail: `Floor ${pct(g.minGM_manufacturing)} · Actual ${pct(f.serviceLines[0].gm)}`, pass: f.serviceLines[0].gm >= g.minGM_manufacturing, warn: f.serviceLines[0].gm >= g.minGM_manufacturing * 0.95 },
    { name: "GM% Floor — Raw Material Supply", detail: `Floor ${pct(g.minGM_rawMaterial)} · Actual ${pct(f.serviceLines[1].gm)}`, pass: f.serviceLines[1].gm >= g.minGM_rawMaterial, warn: false },
    { name: "GM% Floor — NPD / Projects", detail: `Floor ${pct(g.minGM_npd)} · Actual ${pct(f.serviceLines[2].gm)}`, pass: f.serviceLines[2].gm >= g.minGM_npd, warn: false },
    { name: "EMPE Target", detail: `Target ${fmt(g.empeTarget)} · Actual ${fmt(empe)}`, pass: empe >= g.empeTarget, warn: empe >= g.empeTarget * 0.9 },
    { name: "Revenue per Headcount", detail: `Target ${fmt(g.revenuePerHeadTarget)} · Actual ${fmt(revPerHead)}`, pass: revPerHead >= g.revenuePerHeadTarget, warn: revPerHead >= g.revenuePerHeadTarget * 0.9 },
    { name: "Cash Reserve Floor", detail: `Floor ${fmt(g.cashReserveTarget)} · Actual ${fmt(totalCash)}`, pass: totalCash >= g.cashReserveTarget, warn: totalCash >= g.cashReserveTarget * 0.85 },
    { name: "Max Customer Concentration", detail: `Cap ${pct(g.maxCustomerConcentration)} · Top account ${pct(d.customers[0]?.concentration || 0)}`, pass: (d.customers[0]?.concentration || 0) < g.maxCustomerConcentration, warn: (d.customers[0]?.concentration || 0) >= g.maxCustomerConcentration * 0.8 },
  ];

  const exceptions = d.customers.filter(c => c.gm < g.minGM_manufacturing).map(c => ({
    name: c.name, issue: `GM% ${pct(c.gm)} below floor — strategy: ${c.strategy}`, sev: c.gm < g.minGM_manufacturing - 5 ? "red" : "yellow", duration: c.trend,
  }));

  return (
    <div className="gap16">
      <div className="sh"><div className="sh-title">Guardrails</div><div className="sh-sub">Nutriience OS as operating discipline</div></div>
      <div className="card">
        <div className="card-title">Operating Rules</div>
        <div className="gap8">{rules.map((r, i) => {
          const s = r.pass ? "pass" : r.warn ? "warn" : "fail";
          return (
            <div key={i} className="grail">
              <div style={{ flex: 1 }}><div className="grail-name">{r.name}</div><div className="grail-detail">{r.detail}</div></div>
              <div className={`grail-status ${s}`}><span>{r.pass ? "✓" : r.warn ? "!" : "✗"}</span><span>{r.pass ? "PASS" : r.warn ? "WATCH" : "BREACH"}</span></div>
            </div>
          );
        })}</div>
      </div>
      {exceptions.length > 0 && (
        <div className="card">
          <div className="card-title">Active Exceptions</div>
          <div className="gap8">{exceptions.map((e, i) => (
            <div key={i} className={`alert ${e.sev}`}>
              <div><div style={{ fontWeight: 600, marginBottom: 2 }}>{e.name}</div><div style={{ fontSize: 11, color: "var(--text3)" }}>{e.issue}</div></div>
            </div>
          ))}</div>
        </div>
      )}
      <div className="card">
        <div className="card-title">Approval Thresholds</div>
        <div className="g2">
          <MRow label="Distribution approval threshold" value={fmtFull(g.distributionApprovalThreshold)} />
          <MRow label="Margin exception approval" value={`${g.marginExceptionThreshold} pts below floor`} />
          <MRow label="Min GP$ per account / year" value={fmtFull(g.minGPPerAccount)} />
          <MRow label="NPD rule" value="Tied to account growth only" />
        </div>
      </div>
    </div>
  );
}

// ─── MODULE: DEAL EVALUATOR ───────────────────────────────────────────────────
function DealEvaluator({ d }) {
  const g = d.settings.guardrails;
  const [form, setForm] = useState({ revenue: "", gm: "", serviceMix: "manufacturing", skus: "", manufacturers: "", meetingLoad: "low", paymentTerms: "net30", strategicUpside: "medium", npdTie: "no" });
  const [result, setResult] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const evaluate = () => {
    const rev = num(form.revenue); const gm = num(form.gm);
    const skus = num(form.skus); const mfrs = num(form.manufacturers);
    const gpDollars = rev * (gm / 100);
    const floor = form.serviceMix === "npd" ? g.minGM_npd : form.serviceMix === "raw" ? g.minGM_rawMaterial : g.minGM_manufacturing;
    const timeBurden = skus * 2 + mfrs * 4 + (form.meetingLoad === "high" ? 20 : form.meetingLoad === "medium" ? 10 : 5);
    const flags = []; let score = 0;

    if (gm >= 25) score += 30; else if (gm >= floor) score += 15;
    else { score -= 20; flags.push({ icon: "🔴", t: `GM% ${gm}% below ${floor}% floor for ${form.serviceMix}` }); }
    if (gpDollars >= 80000) score += 25; else if (gpDollars >= g.minGPPerAccount) score += 15;
    else { score -= 10; flags.push({ icon: "🟡", t: `GP$ ${fmt(gpDollars)} below minimum account threshold (${fmt(g.minGPPerAccount)})` }); }
    if (skus > 20) { score -= 15; flags.push({ icon: "🟡", t: `${skus} SKUs creates operational complexity` }); }
    if (mfrs > 3) { score -= 10; flags.push({ icon: "🟡", t: `${mfrs} manufacturers per account increases coordination burden` }); }
    if (form.paymentTerms === "net60" || form.paymentTerms === "net90") { score -= 15; flags.push({ icon: "🔴", t: `${form.paymentTerms.toUpperCase()} payment terms create cash drag` }); }
    if (form.meetingLoad === "high") { score -= 10; flags.push({ icon: "🟡", t: "High meeting load dilutes EMPE" }); }
    if (form.strategicUpside === "high") score += 15;
    if (form.npdTie === "yes") score += 10;

    const tier = gpDollars >= 120000 ? "A" : gpDollars >= 60000 ? "B" : "C";
    const verdict = score >= 40 ? "take" : score >= 20 ? "renegotiate" : "decline";
    const recommendedFloor = Math.max(floor, gm < floor ? floor + 3 : gm);
    setResult({ gpDollars, timeBurden, tier, verdict, flags, score, recommendedFloor, gm, floor });
  };

  const Field = ({ label, name, type = "number", placeholder }) => (
    <div className="field"><label className="flabel">{label}</label>
      <input className="finput" type={type} value={form[name]} onChange={e => set(name, e.target.value)} placeholder={placeholder} />
    </div>
  );
  const Select = ({ label, name, options }) => (
    <div className="field"><label className="flabel">{label}</label>
      <select className="fselect" value={form[name]} onChange={e => set(name, e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div className="gap16">
      <div className="sh"><div className="sh-title">Deal Evaluator</div><div className="sh-sub">Score any new account or program before committing</div></div>
      <div className="card">
        <div className="card-title">Deal Parameters</div>
        <div className="fg2">
          <Field label="Estimated Annual Revenue" name="revenue" placeholder="e.g. 250000" />
          <Field label="Estimated GM%" name="gm" placeholder="e.g. 24" />
          <Select label="Primary Service Type" name="serviceMix" options={[["manufacturing", "Manufacturing Management"], ["raw", "Raw Material Supply"], ["npd", "NPD / Projects"]]} />
          <Field label="Number of SKUs" name="skus" placeholder="e.g. 8" />
          <Field label="Number of Manufacturers" name="manufacturers" placeholder="e.g. 2" />
          <Select label="Meeting / Support Load" name="meetingLoad" options={[["low", "Low"], ["medium", "Medium"], ["high", "High"]]} />
          <Select label="Payment Terms" name="paymentTerms" options={[["net15", "Net 15"], ["net30", "Net 30"], ["net45", "Net 45"], ["net60", "Net 60"], ["net90", "Net 90"]]} />
          <Select label="Strategic Upside" name="strategicUpside" options={[["low", "Low"], ["medium", "Medium"], ["high", "High — anchor / platform account"]]} />
          <Select label="NPD Tie-in?" name="npdTie" options={[["no", "No"], ["yes", "Yes — tied to account growth"]]} />
        </div>
        <button className="eval-btn" onClick={evaluate}>Evaluate Deal</button>
      </div>
      {result && (
        <div className={`verdict ${result.verdict}`}>
          <div className={`verdict-label ${result.verdict}`}>{result.verdict === "take" ? "TAKE IT" : result.verdict === "renegotiate" ? "RENEGOTIATE" : "DECLINE"}</div>
          <div className="g2">
            <div>
              <div className="card-title" style={{ marginBottom: 10 }}>Estimated Output</div>
              {[["Estimated GP$", fmt(result.gpDollars)], ["Time Burden Score", `${result.timeBurden} pts`], ["Projected Account Tier", result.tier], ["Fits Nutriience Model?", result.verdict === "take" ? "Yes" : result.verdict === "renegotiate" ? "With conditions" : "No"], ["Recommended Margin Floor", `${result.recommendedFloor}% minimum`]].map(([l, v]) => <MRow key={l} label={l} value={v} />)}
            </div>
            <div>
              <div className="card-title" style={{ marginBottom: 10 }}>Flags</div>
              {result.flags.length === 0 ? <div style={{ color: "var(--green)", fontSize: 13 }}>No flags — clean deal.</div>
                : result.flags.map((f, i) => <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 12.5, borderBottom: "1px solid var(--border)", color: "var(--text2)" }}><span>{f.icon}</span><span>{f.t}</span></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODULE: MARGIN LEAK ──────────────────────────────────────────────────────
function MarginLeak({ d }) {
  const totalLeak = d.marginLeaks.reduce((s, l) => s + l.impactMonthly, 0);
  const totalYearly = totalLeak * 12;
  const sevColor = { high: "var(--red)", medium: "var(--yellow)", low: "var(--text3)" };

  return (
    <div className="gap16">
      <div className="sh"><div className="sh-title">Margin Leak Detector</div><div className="sh-sub">Why is GM% lower than it should be</div></div>
      <div className="g3">
        <Tile label="Total Monthly Leak Est." value={fmt(totalLeak)} color="red" />
        <Tile label="Annual Leak Est." value={fmt(totalYearly)} color="red" />
        <Tile label="Active Leaks" value={d.marginLeaks.length} sub={`${d.marginLeaks.filter(l => l.severity === "high").length} high severity`} color="yellow" />
      </div>
      <div className="card">
        <div className="card-title">Leaks by Impact</div>
        <div className="gap8">{[...d.marginLeaks].sort((a, b) => b.impactMonthly - a.impactMonthly).map(l => (
          <div key={l.id} className="leak-row">
            <div className="leak-left">
              <div className="leak-cat">{l.category}</div>
              <div className="leak-name">{l.name}</div>
              <div className="leak-type">{l.type}</div>
            </div>
            <div className="leak-right">
              <div className="leak-impact" style={{ color: sevColor[l.severity] }}>{fmt(l.impactMonthly)}<span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 400 }}>/mo</span></div>
              <div className="leak-action">{l.action}</div>
            </div>
          </div>
        ))}</div>
      </div>
      <div className="card">
        <div className="card-title">Leak by Category</div>
        {["Customer", "Service Line", "Complexity", "Collections", "Rush / Rework", "Small Orders"].map(cat => {
          const catLeaks = d.marginLeaks.filter(l => l.category === cat);
          if (!catLeaks.length) return null;
          const catTotal = catLeaks.reduce((s, l) => s + l.impactMonthly, 0);
          return (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>{cat}</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--yellow)" }}>{fmt(catTotal)}/mo</span>
              </div>
              <Bar value={catTotal} max={totalLeak} color="yellow" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── COMMISSION HELPERS ───────────────────────────────────────────────────────
function getCurrentQuarter() {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
}

function getQuarterLabel(q) {
  return { 1: "Q1 (Jan–Mar)", 2: "Q2 (Apr–Jun)", 3: "Q3 (Jul–Sep)", 4: "Q4 (Oct–Dec)" }[q];
}

function calcPersonCommission(personName, customers, profile) {
  const rate = (profile.rate || 0) / 100;
  const drawAnnual = profile.drawAnnual || 0;
  const drawThisQuarter = drawAnnual / 4;

  // Only accounts where this person is the sole owner
  const ownedAccounts = customers.filter(c =>
    c.owners && c.owners.length === 1 && c.owners[0] === personName
  );

  const totalGP = ownedAccounts.reduce((s, c) => s + (c.gp_qtd || 0), 0);
  const commissionEarned = totalGP * rate;
  const netAboveDraw = commissionEarned - drawThisQuarter;
  const drawDeficit = Math.max(0, drawThisQuarter - commissionEarned);
  const commissionAboveDraw = Math.max(0, netAboveDraw);

  let status = "even";
  if (drawThisQuarter === 0) {
    status = "reference"; // no draw, reference only
  } else if (commissionEarned >= drawThisQuarter) {
    status = "ahead";
  } else if (commissionEarned >= drawThisQuarter * 0.85) {
    status = "even";
  } else {
    status = "behind";
  }

  return { ownedAccounts, totalGP, commissionEarned, drawThisQuarter, netAboveDraw, drawDeficit, commissionAboveDraw, status, rate, profile };
}

// ─── MODULE: DISTRIBUTION ─────────────────────────────────────────────────────
function DistributionSnapshot({ d }) {
  const g = d.settings.guardrails;
  const f = d.financials;
  const totalCash = d.cash.accounts.reduce((s, a) => s + a.balance, 0);
  const safeToDistribute = Math.max(0, totalCash - g.cashReserveTarget - d.ap.dueThisWeek - 20000);
  const taxReserveGap = f.taxReserveTarget - f.taxReserveActual;
  const currentQ = getCurrentQuarter();
  const profiles = d.settings.commissionProfiles || [];
  const statusColors = { ahead: "var(--green)", even: "var(--yellow)", behind: "var(--red)", reference: "var(--blue)" };
  const statusLabels = { ahead: "ABOVE DRAW", even: "NEAR BREAKEVEN", behind: "BELOW DRAW", reference: "REFERENCE ONLY" };

  const PersonCommCard = ({ profile }) => {
    const result = calcPersonCommission(profile.name, d.customers, profile);
    const isReference = profile.compType === "Reference Only" || profile.drawAnnual === 0;
    const statusLine = isReference
      ? `${fmt(result.commissionEarned)} estimated at ${profile.rate}% of GP$ — shown for reference, no draw structure`
      : result.status === "ahead"
        ? `Commission ${fmt(result.commissionEarned)} exceeds draw ${fmt(result.drawThisQuarter)} — ${fmt(result.commissionAboveDraw)} owed above draw`
        : result.status === "even"
          ? `Commission tracking close to draw — ${fmt(Math.abs(result.netAboveDraw))} ${result.netAboveDraw >= 0 ? "above" : "below"} breakeven`
          : `Commission ${fmt(result.commissionEarned)} is ${fmt(result.drawDeficit)} below draw — carry-forward at reconciliation`;

    return (
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 4 }}>
              {profile.name} — {isReference ? "GP$ Tracker (Reference)" : "Commission Tracker"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>
              {getQuarterLabel(currentQ)} · {profile.rate}% of GP$ on owned accounts
              {!isReference && ` · $${(profile.drawAnnual / 1000).toFixed(0)}K draw · ${profile.drawPeriod}`}
              {isReference && " · directional reference only"}
            </div>
          </div>
          <span style={{ fontSize: 9, fontFamily: "DM Mono,monospace", fontWeight: 700, padding: "3px 8px", borderRadius: 4,
            background: result.status === "ahead" ? "rgba(0,212,160,.15)" : result.status === "behind" ? "rgba(255,71,87,.15)" : result.status === "reference" ? "rgba(59,130,246,.15)" : "rgba(255,201,71,.15)",
            color: statusColors[result.status] }}>
            {statusLabels[result.status]}
          </span>
        </div>

        <div className={isReference ? "g3" : "g4"} style={{ marginBottom: 16 }}>
          <div className="comm-card">
            <div className="comm-label">GP$ from {profile.name}'s Accounts QTD</div>
            <div className="comm-big" style={{ color: "var(--text)" }}>{fmt(result.totalGP)}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 4 }}>
              {result.ownedAccounts.length} owned account{result.ownedAccounts.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="comm-card">
            <div className="comm-label">{isReference ? `GP$ x ${profile.rate}% Reference` : `Commission Earned QTD (${profile.rate}%)`}</div>
            <div className="comm-big" style={{ color: isReference ? "var(--blue)" : statusColors[result.status] }}>{fmt(result.commissionEarned)}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 4 }}>{profile.rate}% x {fmt(result.totalGP)}</div>
          </div>
          {!isReference && <>
            <div className="comm-card">
              <div className="comm-label">Draw This Quarter</div>
              <div className="comm-big" style={{ color: "var(--text)" }}>{fmt(result.drawThisQuarter)}</div>
              <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 4 }}>${(profile.drawAnnual / 1000).toFixed(0)}K annual / 4</div>
            </div>
            <div className="comm-card">
              <div className="comm-label">{result.netAboveDraw >= 0 ? "Commission Above Draw" : "Draw Deficit"}</div>
              <div className="comm-big" style={{ color: result.netAboveDraw >= 0 ? "var(--green)" : "var(--red)" }}>
                {result.netAboveDraw >= 0 ? fmt(result.commissionAboveDraw) : fmt(result.drawDeficit)}
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 4 }}>
                {result.netAboveDraw >= 0 ? "Owed at reconciliation" : "Carry-forward at reconciliation"}
              </div>
            </div>
          </>}
        </div>

        {!isReference && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 5 }}>
              <span>Commission progress vs draw</span>
              <span>{pct(Math.min(result.commissionEarned / result.drawThisQuarter * 100, 100))} of draw earned back</span>
            </div>
            <div style={{ height: 8, background: "var(--border2)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(result.commissionEarned / result.drawThisQuarter * 100, 130)}%`, background: statusColors[result.status], borderRadius: 4, transition: "width .4s" }} />
            </div>
          </div>
        )}

        <div className={`comm-status-bar ${result.status === "reference" ? "even" : result.status}`}>
          <span>{result.status === "ahead" ? "checkmark" : result.status === "behind" ? "warn" : "approx"}</span>
          <span>{statusLine}</span>
        </div>

        {result.ownedAccounts.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Account Breakdown</div>
            <div className="tbl-wrap">
              <table>
                <thead><tr>
                  <th>Customer</th><th>GP$ QTD</th><th>GM%</th>
                  <th>{isReference ? `GP$ x ${profile.rate}% (Ref)` : "Commission Est."}</th>
                  <th>Health</th><th>Trend</th>
                </tr></thead>
                <tbody>
                  {result.ownedAccounts.map(c => {
                    const commEst = (c.gp_qtd || 0) * (profile.rate / 100);
                    const traj = computeTrajectoryStatus(c, d.settings.guardrails);
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600, color: "var(--text)" }}>{c.name}</td>
                        <td className="mono">{fmt(c.gp_qtd)}</td>
                        <td className="mono" style={{ color: c.gm >= 25 ? "var(--green)" : c.gm >= 18 ? "var(--yellow)" : "var(--red)" }}>{pct(c.gm)}</td>
                        <td className="mono" style={{ color: isReference ? "var(--blue)" : "var(--accent)" }}>{fmt(commEst)}</td>
                        <td><span style={{ fontSize: 11, color: traj.status === "red" ? "var(--red)" : traj.status === "yellow" ? "var(--yellow)" : "var(--green)" }}>{traj.label}</span></td>
                        <td style={{ color: traj.trajectory === "improving" ? "var(--green)" : traj.trajectory === "deteriorating" ? "var(--red)" : "var(--text3)", fontSize: 13 }}>{traj.trajectoryArrow}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "1px solid var(--border2)" }}>
                    <td style={{ fontWeight: 700, color: "var(--text)" }}>Total</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{fmt(result.totalGP)}</td>
                    <td />
                    <td className="mono" style={{ fontWeight: 700, color: isReference ? "var(--blue)" : "var(--accent)" }}>{fmt(result.commissionEarned)}</td>
                    <td /><td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result.ownedAccounts.length === 0 && (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>
            No accounts assigned solely to {profile.name} yet. Assign accounts in the Customer tab.
          </div>
        )}

        <div className="comm-estimate-note">
          {isReference
            ? `Reference only · ${profile.rate}% applied to ${profile.name}'s QTD GP$ for management visibility · not a compensation commitment`
            : `Estimate only · Based on QTD GP$ from ${profile.name}'s owned accounts · Confirmed by bookkeeper at quarter close · Draw reconciled ${profile.drawPeriod}`}
        </div>
      </div>
    );
  };

  return (
    <div className="gap16">
      <div className="sh">
        <div className="sh-title">Distribution and Compensation</div>
        <div className="sh-sub">Owner economics · tax reserves · team compensation tracking</div>
      </div>
      <div className="g3">
        <div className="dist-meter">
          <div className="dist-val" style={{ color: safeToDistribute > 0 ? "var(--green)" : "var(--red)" }}>{fmt(safeToDistribute)}</div>
          <div className="dist-label">Safe to Distribute</div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, fontFamily: "DM Mono,monospace" }}>After reserve + A/P due + $20K buffer</div>
        </div>
        <div className="dist-meter">
          <div className="dist-val" style={{ color: f.taxReserveActual >= f.taxReserveTarget ? "var(--green)" : "var(--yellow)" }}>{fmt(f.taxReserveActual)}</div>
          <div className="dist-label">Tax Reserve Actual</div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, fontFamily: "DM Mono,monospace" }}>Target: {fmt(f.taxReserveTarget)} · Gap: {fmt(taxReserveGap)}</div>
        </div>
        <div className="dist-meter">
          <div className="dist-val">{fmt(d.cash.ohNoProgress)}</div>
          <div className="dist-label">Oh-No Fund</div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, fontFamily: "DM Mono,monospace" }}>Target: {fmt(g.ohNoFundTarget)} · {pct(d.cash.ohNoProgress / g.ohNoFundTarget * 100)} funded</div>
        </div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-title">Owner Compensation YTD</div>
          {[["Salary / Payroll", fmt(f.ownerCompYTD)], ["Distributions Taken", fmt(f.distributionsYTD)], ["Total Owner Draw", fmt(f.ownerCompYTD + f.distributionsYTD)], ["Payroll Tax Burden Est.", fmt(f.ownerCompYTD * 0.0765)], ["Health Ins. Through Payroll", "See payroll records"]].map(([l, v]) => <MRow key={l} label={l} value={v} />)}
        </div>
        <div className="card">
          <div className="card-title">Reserve Status</div>
          {[["Cash Reserve Actual", fmt(totalCash)], ["Cash Reserve Target", fmt(g.cashReserveTarget)], ["Reserve Coverage", `${(totalCash / g.cashReserveTarget * 100).toFixed(0)}%`], ["Tax Reserve Actual", fmt(f.taxReserveActual)], ["Tax Reserve Target", fmt(f.taxReserveTarget)], ["Tax Reserve Gap", fmt(taxReserveGap)]].map(([l, v]) => <MRow key={l} label={l} value={v} />)}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text3)", marginBottom: 5 }}>
              <span className="mono">Tax reserve funded</span><span className="mono">{pct(f.taxReserveActual / f.taxReserveTarget * 100)}</span>
            </div>
            <Bar value={f.taxReserveActual} max={f.taxReserveTarget} color={f.taxReserveActual >= f.taxReserveTarget ? "green" : "yellow"} />
          </div>
        </div>
      </div>
      {profiles.filter(p => p.active).map(profile => <PersonCommCard key={profile.name} profile={profile} />)}
      {profiles.length === 0 && (
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>
            No commission profiles configured. Add them in Update Data under Commission Profiles.
          </div>
        </div>
      )}
      {f.reimbursementQueue > 0 && (
        <div className="card">
          <div className="card-title">Pending Items</div>
          <MRow label="Reimbursement Queue (Accountable Plan)" value={fmtFull(f.reimbursementQueue)} />
          <MRow label="Personal Loans to Company" value={fmtFull(f.personalLoansToCompany)} />
        </div>
      )}
    </div>
  );
}

// ─── MODULE: ISSUE TRACKER ────────────────────────────────────────────────────
function IssueTracker({ d, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newIssue, setNewIssue] = useState({ entity: "", type: "customer", category: "Collections", description: "", owner: "", exposure: "" });
  const totalExposure = d.issues.reduce((s, i) => s + i.exposure, 0);
  const openCount = d.issues.filter(i => i.status !== "resolved").length;

  const addIssue = () => {
    if (!newIssue.entity || !newIssue.description) return;
    const issue = { ...newIssue, id: Date.now(), daysOpen: 0, exposure: num(newIssue.exposure), status: "open" };
    onUpdate({ ...d, issues: [...d.issues, issue] });
    setNewIssue({ entity: "", type: "customer", category: "Collections", description: "", owner: "", exposure: "" });
    setShowAdd(false);
  };

  const resolve = (id) => onUpdate({ ...d, issues: d.issues.map(i => i.id === id ? { ...i, status: "resolved" } : i) });

  const statusColor = { open: "yellow", escalated: "red", resolved: "green" };
  const catColor = { NCR: "var(--red)", Collections: "var(--yellow)", "Late Shipment": "var(--yellow)", Dispute: "var(--red)", Quality: "var(--yellow)", Other: "var(--text3)" };

  return (
    <div className="gap16">
      <div className="sh"><div className="sh-title">Issue Tracker</div><div className="sh-sub">Customer and vendor issues with financial exposure</div></div>
      <div className="g3">
        <Tile label="Open Issues" value={openCount} color={openCount > 3 ? "red" : openCount > 1 ? "yellow" : "green"} />
        <Tile label="Total Exposure" value={fmt(totalExposure)} color={totalExposure > 50000 ? "red" : "yellow"} />
        <Tile label="Escalated" value={d.issues.filter(i => i.status === "escalated").length} color="red" />
      </div>
      <div className="card">
        <div className="card-title">Active Issues</div>
        {d.issues.filter(i => i.status !== "resolved").map(issue => (
          <div key={issue.id} className="issue-card">
            <div className="issue-header">
              <div>
                <div className="issue-entity">{issue.entity}</div>
                <span style={{ fontSize: 10, color: catColor[issue.category] || "var(--text3)", fontFamily: "DM Mono,monospace", fontWeight: 700 }}>{issue.category}</span>
                {" · "}
                <span className={`abadge ${statusColor[issue.status]}`}>{issue.status.toUpperCase()}</span>
              </div>
              <button onClick={() => resolve(issue.id)} style={{ background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--text3)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600 }}>Resolve</button>
            </div>
            <div className="issue-desc">{issue.description}</div>
            <div className="issue-meta">
              <span className="issue-meta-item">Owner: {issue.owner}</span>
              <span className="issue-meta-item">Open: {issue.daysOpen}d</span>
              <span className="issue-meta-item" style={{ color: issue.exposure > 20000 ? "var(--red)" : "var(--yellow)" }}>Exposure: {fmt(issue.exposure)}</span>
              <span className="issue-meta-item">Type: {issue.type}</span>
            </div>
          </div>
        ))}
        {d.issues.some(i => i.status === "resolved") && (
          <div style={{ marginTop: 12 }}>
            <div className="card-title">Resolved</div>
            {d.issues.filter(i => i.status === "resolved").map(issue => (
              <div key={issue.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", opacity: 0.5, fontSize: 12 }}>
                <span style={{ color: "var(--text2)" }}>{issue.entity}</span> — <span style={{ color: "var(--text3)" }}>{issue.description}</span>
              </div>
            ))}
          </div>
        )}
        {!showAdd ? (
          <button className="add-btn" onClick={() => setShowAdd(true)}>+ Add Issue</button>
        ) : (
          <div style={{ marginTop: 12, padding: 16, background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border2)" }}>
            <div className="fg2">
              <div className="field"><label className="flabel">Entity (customer/vendor)</label><input className="finput" value={newIssue.entity} onChange={e => setNewIssue(n => ({ ...n, entity: e.target.value }))} /></div>
              <div className="field"><label className="flabel">Type</label><select className="fselect" value={newIssue.type} onChange={e => setNewIssue(n => ({ ...n, type: e.target.value }))}><option value="customer">Customer</option><option value="vendor">Vendor</option></select></div>
              <div className="field"><label className="flabel">Category</label><select className="fselect" value={newIssue.category} onChange={e => setNewIssue(n => ({ ...n, category: e.target.value }))}>{["Collections", "NCR", "Late Shipment", "Dispute", "Quality", "Other"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="field"><label className="flabel">Owner</label><input className="finput" value={newIssue.owner} onChange={e => setNewIssue(n => ({ ...n, owner: e.target.value }))} /></div>
              <div className="field"><label className="flabel">Exposure ($)</label><input className="finput" type="number" value={newIssue.exposure} onChange={e => setNewIssue(n => ({ ...n, exposure: e.target.value }))} /></div>
            </div>
            <div className="field"><label className="flabel">Description</label><textarea className="ftextarea" value={newIssue.description} onChange={e => setNewIssue(n => ({ ...n, description: e.target.value }))} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="eval-btn" style={{ marginTop: 0 }} onClick={addIssue}>Add Issue</button>
              <button onClick={() => setShowAdd(false)} style={{ background: "transparent", border: "1px solid var(--border2)", color: "var(--text3)", borderRadius: 8, padding: "8px 16px", fontSize: 12 }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MODULE: WHAT CHANGED ─────────────────────────────────────────────────────
function WhatChanged({ d }) {
  const g = d.settings.guardrails;
  const totalCash = d.cash.accounts.reduce((s, a) => s + a.balance, 0);
  const empe = d.financials.gp.ytd / d.settings.employees;
  const arPastDue = d.ar.aging.slice(2).reduce((s, r) => s + r.amount, 0);
  const totalLeak = d.marginLeaks.reduce((s, l) => s + l.impactMonthly, 0);

  const staleOverrides = d.customers.filter(c => {
    if (!c.overrideDate) return false;
    const days = (new Date() - new Date(c.overrideDate)) / (1000 * 60 * 60 * 24);
    return days > 90;
  });

  const changes = [
    ...staleOverrides.map(c => {
      const days = Math.floor((new Date() - new Date(c.overrideDate)) / (1000 * 60 * 60 * 24));
      return { icon: "🔒", color: "var(--red-bg)", text: `${c.name} has been on a manual override for ${days} days — app recommended ${c.appRecommendation?.strategy?.toUpperCase()}, you chose ${c.strategy.toUpperCase()}. Review due.`, tag: "Override" };
    }),
    ...d.customers.filter(c => c.gm < g.minGM_manufacturing - 3).map(c => ({ icon: "📉", color: "var(--red-bg)", text: `${c.name} GM% at ${pct(c.gm)} — ${(g.minGM_manufacturing - c.gm).toFixed(1)} pts below floor`, tag: "Margin" })),
    ...d.customers.filter(c => c.arPastDue > 0).map(c => ({ icon: "⏰", color: "var(--yellow-bg)", text: `${c.name} past due A/R ${fmt(c.arPastDue)} — ${c.payDays}d avg pay cycle`, tag: "Collections" })),
    ...d.customers.filter(c => c.concentration >= g.maxCustomerConcentration * 0.8).map(c => ({ icon: "⚠️", color: "var(--yellow-bg)", text: `${c.name} at ${pct(c.concentration)} revenue concentration — watch cap`, tag: "Concentration" })),
    ...d.customers.filter(c => c.trend === "improving" && c.tier === "A").map(c => ({ icon: "📈", color: "var(--green-bg)", text: `${c.name} trending up — expansion candidate`, tag: "Customer" })),
    { icon: "💰", color: totalCash >= g.cashReserveTarget ? "var(--green-bg)" : "var(--red-bg)", text: `Cash ${fmt(totalCash)} — reserve ${totalCash >= g.cashReserveTarget ? "met" : "BELOW target"}`, tag: "Cash" },
    { icon: "📊", color: d.financials.gm.mtd >= g.minGM_manufacturing ? "var(--green-bg)" : "var(--red-bg)", text: `GM% MTD ${pct(d.financials.gm.mtd)} — ${d.financials.gm.mtd >= g.minGM_manufacturing ? "above" : "below"} ${pct(g.minGM_manufacturing)} floor`, tag: "Margin" },
    { icon: "🔍", color: "var(--yellow-bg)", text: `Estimated margin leakage: ${fmt(totalLeak)}/mo (${fmt(totalLeak * 12)}/yr)`, tag: "Leaks" },
    empe < g.empeTarget ? { icon: "👥", color: "var(--red-bg)", text: `EMPE ${fmt(empe)} — ${fmt(g.empeTarget - empe)} below target`, tag: "EMPE" } : { icon: "👥", color: "var(--green-bg)", text: `EMPE ${fmt(empe)} — on target`, tag: "EMPE" },
    arPastDue > 20000 ? { icon: "🧾", color: "var(--red-bg)", text: `A/R past 31 days: ${fmt(arPastDue)} — requires follow-up`, tag: "A/R" } : null,
    ...d.issues.filter(i => i.daysOpen > 14 && i.status !== "resolved").map(i => ({ icon: "🚨", color: "var(--red-bg)", text: `${i.entity} — ${i.category} open ${i.daysOpen} days, ${fmt(i.exposure)} exposure`, tag: "Issues" })),
  ].filter(Boolean);

  return (
    <div className="gap16">
      <div className="sh"><div className="sh-title">What Changed</div><div className="sh-sub">Change detection feed — what actually moved</div></div>
      <div className="card">
        <div className="card-title">Live Signals ({changes.length})</div>
        {changes.map((c, i) => (
          <div key={i} className="change-item">
            <div className="change-icon" style={{ background: c.color }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12.5, color: "var(--text2)" }}>{c.text}</span>
            </div>
            <span className="abadge yellow" style={{ fontSize: 9, alignSelf: "center" }}>{c.tag}</span>
          </div>
        ))}
      </div>
      {d.changelog?.length > 0 && (
        <div className="card">
          <div className="card-title">Data Update Log</div>
          {[...d.changelog].reverse().slice(0, 5).map((entry, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 4 }}>{new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
              {entry.changes.map((ch, j) => <div key={j} style={{ fontSize: 12, color: "var(--text2)", marginBottom: 2 }}>· {ch}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────
function AdminPanel({ d, onSave, onClose }) {
  const [tab, setTab] = useState("financials");
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(d)));
  const [saved, setSaved] = useState(false);
  const set = (path, value) => {
    const keys = path.split(".");
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = () => {
    const changes = [`Data updated on ${new Date().toLocaleDateString()}`];
    const newDraft = { ...draft, meta: { lastUpdated: new Date().toISOString(), updatedBy: "Owner" }, changelog: [...(draft.changelog || []), { date: new Date().toISOString(), changes }] };
    onSave(newDraft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const F = ({ label, path, type = "number" }) => {
    const currentVal = path.split(".").reduce((o, k) => o?.[k], draft) ?? "";
    return (
      <div className="field"><label className="flabel">{label}</label>
        <input className="finput" type={type} defaultValue={currentVal}
          onBlur={e => set(path, type === "number" ? num(e.target.value) : e.target.value)}
          key={path}
        />
      </div>
    );
  };

  const adminTabs = ["financials", "cash / ar", "customers", "guardrails", "forecast", "issues / leaks"];

  return (
    <div className="admin-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-title">Update Data</div>
          <button className="admin-close" onClick={onClose}>✕</button>
        </div>
        <div className="admin-save">
          <button className="save-btn" onClick={handleSave}>{saved ? "✓ Saved" : "Save All Changes"}</button>
        </div>
        <div className="admin-nav">{adminTabs.map(t => <button key={t} className={`admin-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}</div>
        <div className="admin-body">

          {tab === "financials" && (
            <div>
              <div className="fsection">Revenue</div>
              <div className="fg2">
                <F label="Revenue MTD" path="financials.revenue.mtd" />
                <F label="Revenue QTD" path="financials.revenue.qtd" />
                <F label="Revenue YTD" path="financials.revenue.ytd" />
                <F label="Revenue Budget (Annual)" path="financials.revenue.budget" />
              </div>
              <div className="fsection">Gross Profit</div>
              <div className="fg2">
                <F label="GP$ MTD" path="financials.gp.mtd" />
                <F label="GP$ QTD" path="financials.gp.qtd" />
                <F label="GP$ YTD" path="financials.gp.ytd" />
                <F label="GM% MTD" path="financials.gm.mtd" />
                <F label="GM% QTD" path="financials.gm.qtd" />
                <F label="GM% YTD" path="financials.gm.ytd" />
                <F label="GM% Target" path="financials.gm.target" />
              </div>
              <div className="fsection">P&L & Compensation</div>
              <div className="fg2">
                <F label="Net Income Estimate" path="financials.netIncomeEstimate" />
                <F label="Overhead Run Rate (monthly)" path="financials.overheadRunRate" />
                <F label="Payroll Run Rate (monthly)" path="financials.payrollRunRate" />
                <F label="Owner Comp YTD" path="financials.ownerCompYTD" />
                <F label="Distributions YTD" path="financials.distributionsYTD" />
                <F label="Tax Reserve Target" path="financials.taxReserveTarget" />
                <F label="Tax Reserve Actual" path="financials.taxReserveActual" />
                <F label="Reimbursement Queue" path="financials.reimbursementQueue" />
                <F label="Personal Loans to Company" path="financials.personalLoansToCompany" />
              </div>
              <div className="fsection">Service Lines</div>
              {draft.financials.serviceLines.map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: "var(--accent)", fontFamily: "DM Mono,monospace", margin: "10px 0 6px" }}>{s.name}</div>
                  <div className="fg2">
                    <F label="Revenue YTD" path={`financials.serviceLines.${i}.revenue`} />
                    <F label="GP$ YTD" path={`financials.serviceLines.${i}.gp`} />
                    <F label="GM%" path={`financials.serviceLines.${i}.gm`} />
                  </div>
                </div>
              ))}
              <div className="fsection">Company</div>
              <div className="fg2">
                <F label="Total Employees" path="settings.employees" />
              </div>
              <div className="fsection">Team Roster</div>
              <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 10 }}>These names appear as owner options on each customer.</div>
              {(draft.settings.team || []).map((member, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input className="finput" type="text" value={member}
                    onChange={e => setDraft(p => { const t = [...(p.settings.team || [])]; t[i] = e.target.value; return { ...p, settings: { ...p.settings, team: t } }; })}
                    style={{ flex: 1 }} />
                  <button className="remove-btn" onClick={() => setDraft(p => ({ ...p, settings: { ...p.settings, team: (p.settings.team || []).filter((_, j) => j !== i) } }))}>✕</button>
                </div>
              ))}
              <button className="add-btn" onClick={() => setDraft(p => ({ ...p, settings: { ...p.settings, team: [...(p.settings.team || []), ""] } }))}>+ Add Team Member</button>

              <div className="fsection">Commission Profiles</div>
              <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 10 }}>Configure commission rates and draw structures per person. Changes apply immediately to the Distribution tab.</div>
              {(draft.settings.commissionProfiles || []).map((profile, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 14, background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{profile.name || "New Profile"}</div>
                    <button className="remove-btn" onClick={() => setDraft(p => ({ ...p, settings: { ...p.settings, commissionProfiles: (p.settings.commissionProfiles || []).filter((_, j) => j !== i) } }))}>✕</button>
                  </div>
                  <div className="fg2">
                    <div className="field"><label className="flabel">Name</label>
                      <input className="finput" type="text" value={profile.name}
                        onChange={e => setDraft(p => { const cp = [...(p.settings.commissionProfiles || [])]; cp[i] = { ...cp[i], name: e.target.value }; return { ...p, settings: { ...p.settings, commissionProfiles: cp } }; })} />
                    </div>
                    <div className="field"><label className="flabel">Commission Rate (%)</label>
                      <input className="finput" type="number" value={profile.rate}
                        onChange={e => setDraft(p => { const cp = [...(p.settings.commissionProfiles || [])]; cp[i] = { ...cp[i], rate: num(e.target.value) }; return { ...p, settings: { ...p.settings, commissionProfiles: cp } }; })} />
                    </div>
                    <div className="field"><label className="flabel">Annual Draw ($)</label>
                      <input className="finput" type="number" value={profile.drawAnnual}
                        onChange={e => setDraft(p => { const cp = [...(p.settings.commissionProfiles || [])]; cp[i] = { ...cp[i], drawAnnual: num(e.target.value) }; return { ...p, settings: { ...p.settings, commissionProfiles: cp } }; })} />
                    </div>
                    <div className="field"><label className="flabel">Comp Type</label>
                      <select className="fselect" value={profile.compType}
                        onChange={e => setDraft(p => { const cp = [...(p.settings.commissionProfiles || [])]; cp[i] = { ...cp[i], compType: e.target.value }; return { ...p, settings: { ...p.settings, commissionProfiles: cp } }; })}>
                        <option value="Commission">Commission</option>
                        <option value="Reference Only">Reference Only</option>
                        <option value="Profit Share">Profit Share</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button className="add-btn" onClick={() => setDraft(p => ({ ...p, settings: { ...p.settings, commissionProfiles: [...(p.settings.commissionProfiles || []), { name: "", rate: 18, drawAnnual: 0, drawPeriod: "quarterly", compType: "Reference Only", active: true }] } }))}>+ Add Commission Profile</button>
            </div>
          )}

          {tab === "cash / ar" && (
            <div>
              <div className="fsection">Bank Accounts</div>
              {draft.cash.accounts.map((a, i) => (
                <div key={i} className="fg2" style={{ marginBottom: 10 }}>
                  <F label={`${a.name} — Name`} path={`cash.accounts.${i}.name`} type="text" />
                  <F label={`${a.name} — Balance`} path={`cash.accounts.${i}.balance`} />
                </div>
              ))}
              <F label="Oh-No Fund Progress" path="cash.ohNoProgress" />
              <div className="fsection">A/R</div>
              <F label="A/R Due This Week" path="ar.dueThisWeek" />
              {draft.ar.aging.map((r, i) => <F key={i} label={`A/R — ${r.bucket}`} path={`ar.aging.${i}.amount`} />)}
              <div className="fsection">A/P</div>
              <F label="A/P Due This Week" path="ap.dueThisWeek" />
              {draft.ap.aging.map((r, i) => <F key={i} label={`A/P — ${r.bucket}`} path={`ap.aging.${i}.amount`} />)}
            </div>
          )}

          {tab === "customers" && (
            <div>
              <div className="parse-hint" style={{ marginBottom: 12, padding: "10px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border2)" }}>
                Update each customer's numbers below. Add new customers at the bottom.
              </div>
              {draft.customers.map((c, i) => (
                <div key={c.id} style={{ marginBottom: 16, padding: 14, background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                    <button className="remove-btn" onClick={() => setDraft(p => ({ ...p, customers: p.customers.filter((_, j) => j !== i) }))}>✕</button>
                  </div>
                  <div className="fg2">
                    <div className="field"><label className="flabel">Name</label><input className="finput" type="text" defaultValue={c.name} onBlur={e => set(`customers.${i}.name`, e.target.value)} /></div>
                    <div className="field"><label className="flabel">Revenue MTD</label><input className="finput" type="number" defaultValue={c.revenue_mtd} onBlur={e => set(`customers.${i}.revenue_mtd`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">Revenue YTD</label><input className="finput" type="number" defaultValue={c.revenue_ytd} onBlur={e => set(`customers.${i}.revenue_ytd`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">GP$ MTD</label><input className="finput" type="number" defaultValue={c.gp_mtd} onBlur={e => set(`customers.${i}.gp_mtd`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">GP$ YTD</label><input className="finput" type="number" defaultValue={c.gp_ytd} onBlur={e => set(`customers.${i}.gp_ytd`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">GP$ QTD</label><input className="finput" type="number" defaultValue={c.gp_qtd} onBlur={e => set(`customers.${i}.gp_qtd`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">GM%</label><input className="finput" type="number" defaultValue={c.gm} onBlur={e => set(`customers.${i}.gm`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">Open A/R</label><input className="finput" type="number" defaultValue={c.arOpen} onBlur={e => set(`customers.${i}.arOpen`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">Past Due A/R</label><input className="finput" type="number" defaultValue={c.arPastDue} onBlur={e => set(`customers.${i}.arPastDue`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">Avg Order Size</label><input className="finput" type="number" defaultValue={c.avgOrderSize} onBlur={e => set(`customers.${i}.avgOrderSize`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">SKUs</label><input className="finput" type="number" defaultValue={c.skus} onBlur={e => set(`customers.${i}.skus`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">Manufacturers</label><input className="finput" type="number" defaultValue={c.manufacturers} onBlur={e => set(`customers.${i}.manufacturers`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">Open Issues</label><input className="finput" type="number" defaultValue={c.openIssues} onBlur={e => set(`customers.${i}.openIssues`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">Pay Days (avg)</label><input className="finput" type="number" defaultValue={c.payDays} onBlur={e => set(`customers.${i}.payDays`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">Concentration %</label><input className="finput" type="number" defaultValue={c.concentration} onBlur={e => set(`customers.${i}.concentration`, num(e.target.value))} /></div>
                    <div className="field"><label className="flabel">Tenure Start Date</label><input className="finput" type="date" defaultValue={c.tenureStartDate} onBlur={e => set(`customers.${i}.tenureStartDate`, e.target.value)} /></div>
                  </div>
                  <div className="fg2" style={{ marginTop: 8 }}>
                    <div className="field"><label className="flabel">Tier</label>
                      <select className="fselect" value={c.tier} onChange={e => set(`customers.${i}.tier`, e.target.value)}><option>A</option><option>B</option><option>C</option></select>
                    </div>
                    <div className="field"><label className="flabel">Strategy</label>
                      <select className="fselect" value={c.strategy} onChange={e => set(`customers.${i}.strategy`, e.target.value)}>{["defend", "grow", "fix", "exit"].map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <div className="field"><label className="flabel">Trend</label>
                      <select className="fselect" value={c.trend} onChange={e => set(`customers.${i}.trend`, e.target.value)}>{["improving", "stable", "deteriorating"].map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <div className="field"><label className="flabel">Operator Score</label>
                      <select className="fselect" value={c.operatorScore} onChange={e => set(`customers.${i}.operatorScore`, e.target.value)}>{Object.keys(OPERATOR_LABELS).map(k => <option key={k} value={k}>{OPERATOR_LABELS[k]}</option>)}</select>
                    </div>
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <label className="flabel">Owners (select all that apply)</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                      {(draft.settings.team || []).map(member => {
                        const isOwner = (c.owners || []).includes(member);
                        return (
                          <button key={member} onClick={() => {
                            const current = c.owners || [];
                            const next = isOwner ? current.filter(o => o !== member) : [...current, member];
                            set(`customers.${i}.owners`, next);
                          }} style={{
                            padding: "4px 12px", borderRadius: 5, border: "1px solid", fontSize: 11, fontWeight: 700,
                            fontFamily: "DM Mono,monospace", cursor: "pointer", transition: "all .15s",
                            background: isOwner ? "rgba(59,130,246,.15)" : "var(--surface)",
                            borderColor: isOwner ? "var(--blue)" : "var(--border2)",
                            color: isOwner ? "var(--blue)" : "var(--text3)",
                          }}>{member}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <button className="add-btn" onClick={() => setDraft(p => ({ ...p, customers: [...p.customers, { id: Date.now(), name: "New Customer", owners: [], tier: "B", strategy: "defend", revenue_mtd: 0, revenue_qtd: 0, revenue_ytd: 0, gp_mtd: 0, gp_qtd: 0, gp_ytd: 0, gm: 0, arOpen: 0, arPastDue: 0, avgOrderSize: 0, skus: 0, manufacturers: 1, openIssues: 0, trend: "stable", payDays: 30, operatorScore: "good_margin_low_pain", concentration: 0, tenureStartDate: new Date().toISOString().slice(0, 10), monthlySnapshots: [] }] }))}>+ Add Customer</button>
            </div>
          )}

          {tab === "guardrails" && (
            <div>
              <div className="fsection">GM% Floors by Service</div>
              <div className="fg2">
                <F label="Min GM% — Manufacturing" path="settings.guardrails.minGM_manufacturing" />
                <F label="Min GM% — Raw Material" path="settings.guardrails.minGM_rawMaterial" />
                <F label="Min GM% — NPD" path="settings.guardrails.minGM_npd" />
              </div>
              <div className="fsection">Account Economics</div>
              <div className="fg2">
                <F label="Min GP$ Per Account (annual)" path="settings.guardrails.minGPPerAccount" />
                <F label="Max Customer Concentration %" path="settings.guardrails.maxCustomerConcentration" />
              </div>
              <div className="fsection">Efficiency Targets</div>
              <div className="fg2">
                <F label="EMPE Target" path="settings.guardrails.empeTarget" />
                <F label="Revenue per Headcount Target" path="settings.guardrails.revenuePerHeadTarget" />
              </div>
              <div className="fsection">Cash Policy</div>
              <div className="fg2">
                <F label="Cash Reserve Target" path="settings.guardrails.cashReserveTarget" />
                <F label="Oh-No Fund Target" path="settings.guardrails.ohNoFundTarget" />
              </div>
              <div className="fsection">Approval Thresholds</div>
              <div className="fg2">
                <F label="Distribution Approval Threshold" path="settings.guardrails.distributionApprovalThreshold" />
                <F label="Margin Exception Threshold (pts)" path="settings.guardrails.marginExceptionThreshold" />
              </div>
            </div>
          )}

          {tab === "forecast" && (
            <div>
              <div className="parse-hint" style={{ marginBottom: 12 }}>Enter expected inflows and outflows for each week of the 13-week forecast.</div>
              {draft.cashForecast.map((w, i) => (
                <div key={i} className="fg2" style={{ marginBottom: 8 }}>
                  <F label={`${w.week} — Inflows`} path={`cashForecast.${i}.inflows`} />
                  <F label={`${w.week} — Outflows`} path={`cashForecast.${i}.outflows`} />
                </div>
              ))}
            </div>
          )}

          {tab === "issues / leaks" && (
            <div>
              <div className="fsection">Margin Leaks</div>
              {draft.marginLeaks.map((l, i) => (
                <div key={l.id} style={{ marginBottom: 12, padding: 12, background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{l.name}</span>
                    <button className="remove-btn" onClick={() => setDraft(p => ({ ...p, marginLeaks: p.marginLeaks.filter((_, j) => j !== i) }))}>✕</button>
                  </div>
                  <div className="fg2">
                    <F label="Monthly Impact $" path={`marginLeaks.${i}.impactMonthly`} />
                    <div className="field"><label className="flabel">Severity</label>
                      <select className="fselect" value={l.severity} onChange={e => set(`marginLeaks.${i}.severity`, e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
                    </div>
                  </div>
                </div>
              ))}
              <button className="add-btn" onClick={() => setDraft(p => ({ ...p, marginLeaks: [...p.marginLeaks, { id: Date.now(), category: "Customer", name: "New Leak", type: "Description", impactMonthly: 0, severity: "medium", action: "Action needed" }] }))}>+ Add Leak</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── SCORING LOGIC ───────────────────────────────────────────────────────────
function scoreCustomer(answers) {
  const { gmAboveFloor, paymentBehavior, opsBurden, revTrend, wantMore, strategicReason } = answers;
  const reasons = [];
  let tierScore = 0; // higher = better

  // GM floor
  if (gmAboveFloor === "yes") { tierScore += 3; reasons.push("GM above floor"); }
  else if (gmAboveFloor === "borderline") { tierScore += 1; reasons.push("GM borderline vs floor"); }
  else { tierScore -= 2; reasons.push("GM below floor"); }

  // Payment
  if (paymentBehavior === "yes") { tierScore += 2; reasons.push("pays on time"); }
  else if (paymentBehavior === "slow") { tierScore -= 1; reasons.push("slow payer"); }
  else { tierScore -= 3; reasons.push("chronic payment problem"); }

  // Ops burden
  if (opsBurden === "yes") { tierScore += 2; reasons.push("burden proportionate"); }
  else if (opsBurden === "slightly") { tierScore -= 1; reasons.push("slightly high burden"); }
  else { tierScore -= 2; reasons.push("disproportionate ops burden"); }

  // Revenue trend
  if (revTrend === "growing") { tierScore += 1; reasons.push("revenue growing"); }
  else if (revTrend === "shrinking") { tierScore -= 1; reasons.push("revenue shrinking"); }

  // Determine tier
  let tier = tierScore >= 6 ? "A" : tierScore >= 2 ? "B" : "C";

  // Determine strategy
  let strategy;
  if (wantMore === "yes" && tierScore >= 4) strategy = "grow";
  else if (wantMore === "yes" && tierScore >= 2) strategy = "defend";
  else if (wantMore === "maybe" || (strategicReason === "yes" && tierScore < 2)) strategy = gmAboveFloor === "no" ? "fix" : "defend";
  else if (wantMore === "no" && strategicReason === "no") strategy = "exit";
  else if (wantMore === "no" && strategicReason === "yes") { strategy = "defend"; reasons.push("strategic hold override"); }
  else strategy = "fix";

  // Determine operator score
  let operatorScore;
  if (tierScore >= 6 && wantMore === "yes") operatorScore = "expansion_candidate";
  else if (tierScore >= 5) operatorScore = "good_margin_low_pain";
  else if (paymentBehavior === "chronic") operatorScore = "slow_payer";
  else if (opsBurden === "disproportionate") operatorScore = "good_margin_operational_pain";
  else if (gmAboveFloor === "no") operatorScore = "high_revenue_low_margin";
  else if (opsBurden === "slightly") operatorScore = "high_support_burden";
  else operatorScore = "good_margin_low_pain";

  // Trend
  const trend = revTrend === "growing" ? "improving" : revTrend === "shrinking" ? "deteriorating" : "stable";

  return { tier, strategy, operatorScore, trend, reasoning: reasons.join(" · ") };
}

// ─── SCORING WORKFLOW ────────────────────────────────────────────────────────
const SCORE_QUESTIONS = [
  {
    key: "gmAboveFloor",
    question: "Has GM% been above your floor for the last 3 months?",
    hint: "Check against your guardrail minimum for this account's service type",
    options: [
      { value: "yes", label: "Yes — consistently above floor" },
      { value: "borderline", label: "Borderline — sometimes above, sometimes below" },
      { value: "no", label: "No — been below floor for 3+ months" },
    ],
  },
  {
    key: "paymentBehavior",
    question: "Is this customer paying within terms?",
    hint: "Look at their avg pay days vs agreed terms",
    options: [
      { value: "yes", label: "Yes — pays on or before terms" },
      { value: "slow", label: "Slow — occasional, gets there eventually" },
      { value: "chronic", label: "Chronic problem — requires chasing every cycle" },
    ],
  },
  {
    key: "opsBurden",
    question: "Is the operational burden proportionate to the GP$ this account generates?",
    hint: "Think about Mari's time, your time, manufacturer coordination, issue volume",
    options: [
      { value: "yes", label: "Yes — burden is proportionate to what they generate" },
      { value: "slightly", label: "Slightly high — more than it should be but manageable" },
      { value: "disproportionate", label: "Disproportionate — they consume more than they contribute" },
    ],
  },
  {
    key: "revTrend",
    question: "Is revenue from this customer trending?",
    hint: "Compare last 3 months to prior 3 months",
    options: [
      { value: "growing", label: "Growing — revenue is increasing" },
      { value: "flat", label: "Flat — roughly the same" },
      { value: "shrinking", label: "Shrinking — revenue is declining" },
    ],
  },
  {
    key: "wantMore",
    question: "Do you want more business like this account?",
    hint: "Gut check — if ten more customers looked exactly like this one, would that be good or bad?",
    options: [
      { value: "yes", label: "Yes — this is the kind of account we want more of" },
      { value: "maybe", label: "Maybe — if the economics improved" },
      { value: "no", label: "No — this profile creates problems at scale" },
    ],
  },
  {
    key: "strategicReason",
    question: "Is there a strategic reason to keep this account beyond current economics?",
    hint: "e.g. anchor customer, reference brand, category entry point, relationship asset",
    options: [
      { value: "yes", label: "Yes — strategic value beyond current P&L" },
      { value: "no", label: "No — economics should drive this decision entirely" },
    ],
  },
];

function ScoringWorkflow({ d, onSave, onClose }) {
  const [customerIdx, setCustomerIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [overrideTier, setOverrideTier] = useState(null);
  const [overrideStrategy, setOverrideStrategy] = useState(null);
  const [overrideNote, setOverrideNote] = useState("");
  const [completed, setCompleted] = useState([]);
  const [done, setDone] = useState(false);

  const customers = d.customers;
  const customer = customers[customerIdx];
  const question = SCORE_QUESTIONS[questionIdx];
  const isLastQuestion = questionIdx === SCORE_QUESTIONS.length - 1;
  const isLastCustomer = customerIdx === customers.length - 1;

  const handleAnswer = (value) => setAnswers(a => ({ ...a, [question.key]: value }));

  const handleNext = () => {
    if (!isLastQuestion) {
      setQuestionIdx(q => q + 1);
    } else {
      const rec = scoreCustomer(answers);
      setRecommendation(rec);
      setOverrideTier(null);
      setOverrideStrategy(null);
      setOverrideNote("");
    }
  };

  const handleConfirm = () => {
    const finalTier = overrideTier || recommendation.tier;
    const finalStrategy = overrideStrategy || recommendation.strategy;
    const isOverride = overrideTier || overrideStrategy;
    if (isOverride && !overrideNote.trim()) return;

    const updatedCustomer = {
      ...customer,
      tier: finalTier,
      strategy: finalStrategy,
      operatorScore: recommendation.operatorScore,
      trend: recommendation.trend,
      lastReviewDate: new Date().toISOString(),
      overrideNote: isOverride ? overrideNote.trim() : null,
      overrideDate: isOverride ? new Date().toISOString() : null,
      appRecommendation: { tier: recommendation.tier, strategy: recommendation.strategy },
    };

    setCompleted(c => [...c, { name: customer.name, tier: finalTier, strategy: finalStrategy, wasOverride: !!isOverride, note: overrideNote }]);

    const updatedCustomers = customers.map((c, i) => i === customerIdx ? updatedCustomer : c);
    const newData = { ...d, customers: updatedCustomers, changelog: [...(d.changelog || []), { date: new Date().toISOString(), changes: [`Monthly review: ${customer.name} scored — Tier ${finalTier}, Strategy: ${finalStrategy}${isOverride ? " (override)" : ""}`] }] };

    onSave(newData);

    if (!isLastCustomer) {
      setCustomerIdx(idx => idx + 1);
      setQuestionIdx(0);
      setAnswers({});
      setRecommendation(null);
    } else {
      setDone(true);
    }
  };

  const isOverriding = overrideTier || overrideStrategy;
  const noteRequired = isOverriding && !overrideNote.trim();

  if (done) return (
    <div className="gap16">
      <div className="score-complete">
        <div className="score-complete-icon">✓</div>
        <div className="score-complete-title">Review Complete</div>
        <div className="score-complete-sub">All {customers.length} customers scored · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
      </div>
      <div className="card score-summary-table">
        <div className="card-title">Review Summary</div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Tier</th><th>Strategy</th><th>Override?</th></tr></thead>
            <tbody>{completed.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: "var(--text)" }}>{c.name}</td>
                <td><span className={`tag tag-${c.tier.toLowerCase()}`}>{c.tier}</span></td>
                <td><span className="chip" style={{ background: STRATEGY_COLORS[c.strategy] + "22", color: STRATEGY_COLORS[c.strategy] }}>{c.strategy.toUpperCase()}</span></td>
                <td>{c.wasOverride ? <span className="override-note-badge">OVERRIDE</span> : <span style={{ color: "var(--text3)", fontSize: 11 }}>Confirmed</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <button className="eval-btn" style={{ marginTop: 0 }} onClick={onClose}>Back to Command</button>
    </div>
  );

  if (recommendation) return (
    <div className="gap16">
      <div className="sh">
        <div className="sh-title">Review: {customer.name}</div>
        <div className="sh-sub">Customer {customerIdx + 1} of {customers.length} · Confirm or override recommendation</div>
      </div>
      <div className="score-progress">
        {customers.map((_, i) => <div key={i} className={`score-progress-step ${i < customerIdx ? "done" : i === customerIdx ? "active" : ""}`} />)}
      </div>
      <div className="card">
        <div className="score-recommendation">
          <div className="score-rec-label">App Recommendation</div>
          {[
            ["Tier", <span className={`tag tag-${recommendation.tier.toLowerCase()}`}>{recommendation.tier}</span>],
            ["Strategy", <span className="chip" style={{ background: STRATEGY_COLORS[recommendation.strategy] + "22", color: STRATEGY_COLORS[recommendation.strategy] }}>{recommendation.strategy.toUpperCase()}</span>],
            ["Operator Score", OPERATOR_LABELS[recommendation.operatorScore]],
            ["Trend", recommendation.trend],
          ].map(([field, val]) => (
            <div key={field} className="score-rec-row">
              <span className="score-rec-field">{field}</span>
              <span className="score-rec-val">{val}</span>
            </div>
          ))}
          <div className="score-rec-reasoning">Reasoning: {recommendation.reasoning}</div>
        </div>

        <div className="score-override-section">
          <div className="score-override-label">Override Tier (optional)</div>
          <div className="score-override-grid">
            {["A", "B", "C"].map(t => (
              <button key={t} className={`score-override-btn ${overrideTier === t ? "active" : ""}`} onClick={() => setOverrideTier(overrideTier === t ? null : t)}>
                Tier {t}
              </button>
            ))}
          </div>
          <div className="score-override-label">Override Strategy (optional)</div>
          <div className="score-override-grid">
            {["defend", "grow", "fix", "exit"].map(s => (
              <button key={s} className={`score-override-btn ${overrideStrategy === s ? "active" : ""}`} onClick={() => setOverrideStrategy(overrideStrategy === s ? null : s)}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {isOverriding && (
          <div className="field" style={{ marginBottom: 16 }}>
            <div className="score-note-required">Override note required — why are you overriding the recommendation?</div>
            <textarea className="ftextarea" placeholder="e.g. Strategic hold — Alpine relationship, reviewing in Q3..." value={overrideNote} onChange={e => setOverrideNote(e.target.value)} style={{ minHeight: 60 }} />
          </div>
        )}

        <div className="score-nav">
          <button className="score-next" onClick={handleConfirm} disabled={noteRequired}>
            {isLastCustomer ? "Complete Review" : `Confirm & Next →`}
          </button>
          <button className="score-back" onClick={() => { setRecommendation(null); setQuestionIdx(SCORE_QUESTIONS.length - 1); }}>← Back</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="gap16">
      <div className="sh">
        <div className="sh-title">Review: {customer.name}</div>
        <div className="sh-sub">Customer {customerIdx + 1} of {customers.length} · Question {questionIdx + 1} of {SCORE_QUESTIONS.length}</div>
      </div>
      <div className="score-progress">
        {customers.map((_, i) => <div key={i} className={`score-progress-step ${i < customerIdx ? "done" : i === customerIdx ? "active" : ""}`} />)}
      </div>
      <div className="card">
        <div className="score-customer-header">
          <div className="score-customer-name">{customer.name}</div>
          <div className="score-customer-meta">
            GM% {pct(customer.gm)} · {pct(customer.concentration)} concentration · {customer.payDays}d avg pay · {customer.openIssues} open issues
          </div>
        </div>
        <div style={{ height: 4, background: "var(--border2)", borderRadius: 2, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "var(--accent)", borderRadius: 2, width: `${((questionIdx) / SCORE_QUESTIONS.length) * 100}%`, transition: "width .3s" }} />
        </div>
        <div className="score-question">{question.question}</div>
        <div className="score-question-hint">{question.hint}</div>
        <div className="score-options">
          {question.options.map(opt => (
            <button key={opt.value} className={`score-option ${answers[question.key] === opt.value ? "selected" : ""}`} onClick={() => handleAnswer(opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="score-nav">
          <button className="score-next" onClick={handleNext} disabled={!answers[question.key]}>
            {isLastQuestion ? "See Recommendation →" : "Next →"}
          </button>
          {questionIdx > 0 && <button className="score-back" onClick={() => setQuestionIdx(q => q - 1)}>← Back</button>}
        </div>
      </div>
    </div>
  );
}

// ─── HEALTH TIMELINE ─────────────────────────────────────────────────────────
function HealthTimeline({ entity, onSave, isManufacturer = false }) {
  const snapshots = entity.monthlySnapshots || [];
  const [annotating, setAnnotating] = useState(null);
  const [annoText, setAnnoText] = useState("");

  const sorted = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const greenCount = sorted.filter(s => s.healthStatus === "green").length;
  const yellowCount = sorted.filter(s => s.healthStatus === "yellow").length;
  const redCount = sorted.filter(s => s.healthStatus === "red").length;
  const annotated = sorted.filter(s => s.annotation);

  const saveAnnotation = (month) => {
    if (!annoText.trim()) return;
    const updated = addAnnotation(entity, month, annoText.trim(), isManufacturer);
    onSave(updated);
    setAnnotating(null);
    setAnnoText("");
  };

  if (sorted.length === 0) return (
    <div style={{ color: "var(--text3)", fontSize: 12, fontFamily: "DM Mono,monospace", padding: "12px 0" }}>
      No history yet — snapshots build automatically each month when you save data.
    </div>
  );

  return (
    <div>
      {/* Summary counts */}
      <div className="timeline-summary">
        <div className="timeline-summary-item">
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
          <span style={{ color: "var(--green)", fontWeight: 700 }}>{greenCount}</span>
          <span style={{ color: "var(--text3)" }}>green</span>
        </div>
        <div className="timeline-summary-item">
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--yellow)", display: "inline-block" }} />
          <span style={{ color: "var(--yellow)", fontWeight: 700 }}>{yellowCount}</span>
          <span style={{ color: "var(--text3)" }}>yellow</span>
        </div>
        <div className="timeline-summary-item">
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
          <span style={{ color: "var(--red)", fontWeight: 700 }}>{redCount}</span>
          <span style={{ color: "var(--text3)" }}>red</span>
        </div>
        <div className="timeline-summary-item">
          <span style={{ color: "var(--text3)" }}>{sorted.length} months total</span>
        </div>
        {sorted.length > 0 && (
          <div className="timeline-summary-item">
            <span style={{ color: "var(--text3)" }}>
              {Math.round(greenCount / sorted.length * 100)}% healthy overall
            </span>
          </div>
        )}
      </div>

      {/* Dot timeline */}
      <div className="timeline-wrap">
        <div className="timeline-row">
          {sorted.map((s, i) => (
            <div key={i} className="timeline-cell">
              <div
                className={`timeline-dot ${s.healthStatus || "none"}`}
                title={`${s.month}${s.annotation ? ` — ${s.annotation}` : ""}`}
                onClick={() => { setAnnotating(annotating === s.month ? null : s.month); setAnnoText(s.annotation || ""); }}
              >
                {s.annotation ? "✎" : ""}
              </div>
              {s.annotation && <div className="timeline-anno" />}
              <div className="timeline-month">{s.month.slice(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Annotation editor */}
      {annotating && (
        <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border2)" }}>
          <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 6 }}>Note for {annotating}</div>
          <div className="anno-input-row">
            <input className="anno-input" value={annoText} onChange={e => setAnnoText(e.target.value)}
              placeholder="e.g. Raised prices, lost SKU 4, new product launch..." onKeyDown={e => e.key === "Enter" && saveAnnotation(annotating)} />
            <button className="anno-save-btn" onClick={() => saveAnnotation(annotating)}>Save</button>
            <button onClick={() => setAnnotating(null)} style={{ background: "transparent", border: "none", color: "var(--text3)", fontSize: 18, padding: "0 4px" }}>✕</button>
          </div>
        </div>
      )}

      {/* Annotation list */}
      {annotated.length > 0 && (
        <div className="timeline-anno-list">
          <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8 }}>Notes</div>
          {annotated.map((s, i) => (
            <div key={i} className="timeline-anno-item">
              <span className="timeline-anno-month">{s.month}</span>
              <span style={{ color: "var(--text2)" }}>{s.annotation}</span>
              <span style={{ marginLeft: "auto" }}>
                <span className={`timeline-dot ${s.healthStatus}`} style={{ width: 12, height: 12, display: "inline-block", borderRadius: "50%" }} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PIPELINE HELPERS ────────────────────────────────────────────────────────
const STAGE_PROBS = { prospect: 15, proposal: 35, negotiation: 60, verbal: 85, closed: 100 };
const STAGE_LABELS = { prospect: "Prospect", proposal: "Proposal Sent", negotiation: "In Negotiation", verbal: "Verbal Yes", closed: "Closed Won" };

function getPipelineMetrics(pipeline) {
  const active = pipeline.filter(p => p.stage !== "closed");
  const totalRevenue = pipeline.reduce((s, p) => s + p.revenue, 0);
  const weightedRevenue = pipeline.reduce((s, p) => s + p.revenue * (p.probability / 100), 0);
  const weightedGP = pipeline.reduce((s, p) => s + p.revenue * (p.gm / 100) * (p.probability / 100), 0);
  const weightedGM = weightedRevenue > 0 ? (weightedGP / weightedRevenue) * 100 : 0;
  return { active: active.length, total: pipeline.length, totalRevenue, weightedRevenue, weightedGP, weightedGM };
}

function getProFormaBook(customers, pipeline, includeAll = false) {
  const currentRevenue = customers.reduce((s, c) => s + c.revenue_ytd, 0);
  const currentGP = customers.reduce((s, c) => s + c.gp_ytd, 0);
  const currentGM = currentRevenue > 0 ? (currentGP / currentRevenue) * 100 : 0;

  const pipelineRevenue = pipeline
    .filter(p => includeAll || p.stage !== "prospect")
    .reduce((s, p) => s + p.revenue * (p.probability / 100), 0);
  const pipelineGP = pipeline
    .filter(p => includeAll || p.stage !== "prospect")
    .reduce((s, p) => s + p.revenue * (p.gm / 100) * (p.probability / 100), 0);

  const proFormaRevenue = currentRevenue + pipelineRevenue;
  const proFormaGP = currentGP + pipelineGP;
  const proFormaGM = proFormaRevenue > 0 ? (proFormaGP / proFormaRevenue) * 100 : 0;

  const anchor = [...customers].sort((a, b) => b.revenue_ytd - a.revenue_ytd)[0];
  const anchorConc = currentRevenue > 0 ? (anchor?.revenue_ytd / currentRevenue) * 100 : 0;
  const proFormaAnchorConc = proFormaRevenue > 0 ? (anchor?.revenue_ytd / proFormaRevenue) * 100 : 0;

  return { currentRevenue, currentGP, currentGM, pipelineRevenue, pipelineGP, proFormaRevenue, proFormaGP, proFormaGM, anchor, anchorConc, proFormaAnchorConc };
}

function scorePipelineDeal(deal, guardrails) {
  const g = guardrails;
  const floor = deal.serviceType === "npd" ? g.minGM_npd : deal.serviceType === "raw" ? g.minGM_rawMaterial : g.minGM_manufacturing;
  const gpDollars = deal.revenue * (deal.gm / 100);
  let score = 0;
  if (deal.gm >= 25) score += 30; else if (deal.gm >= floor) score += 15; else score -= 20;
  if (gpDollars >= 80000) score += 25; else if (gpDollars >= g.minGPPerAccount) score += 15; else score -= 10;
  const verdict = score >= 40 ? "take" : score >= 20 ? "renegotiate" : "decline";
  return { score, verdict, gpDollars, floor };
}

// ─── PIPELINE & DIVERSIFICATION MODULE ───────────────────────────────────────
function PipelineTracker({ d, onSave }) {
  const [showScenario, setShowScenario] = useState(false);
  const [scenarioCustomers, setScenarioCustomers] = useState([
    { id: 1, name: "", revenue: "", gm: "", serviceType: "manufacturing" }
  ]);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  const pipeline = d.pipeline || [];
  const customers = d.customers || [];
  const g = d.settings.guardrails;
  const metrics = getPipelineMetrics(pipeline);
  const proforma = getProFormaBook(customers, pipeline);
  const anchor = [...customers].sort((a, b) => b.revenue_ytd - a.revenue_ytd)[0];
  const totalCurrentRevenue = customers.reduce((s, c) => s + c.revenue_ytd, 0);
  const anchorConc = totalCurrentRevenue > 0 ? (anchor?.revenue_ytd / totalCurrentRevenue) * 100 : 0;
  const targetCap = g.maxCustomerConcentration;
  const revenueNeeded = anchor ? Math.max(0, anchor.revenue_ytd / (targetCap / 100) - totalCurrentRevenue) : 0;
  const pipelineCoverage = revenueNeeded > 0 ? Math.min((metrics.weightedRevenue / revenueNeeded) * 100, 100) : 100;

  const savePipeline = (updated) => onSave({ ...d, pipeline: updated });

  const startEdit = (deal) => { setEditingId(deal.id); setEditDraft({ ...deal }); };
  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };
  const saveEdit = () => {
    savePipeline(pipeline.map(p => p.id === editingId ? { ...editDraft, revenue: num(editDraft.revenue), gm: num(editDraft.gm), probability: num(editDraft.probability) } : p));
    setEditingId(null); setEditDraft(null);
  };

  const addDeal = () => {
    const newDeal = { id: Date.now(), name: "New Opportunity", revenue: 0, gm: 24, serviceType: "manufacturing", stage: "prospect", probability: 15, expectedCloseMonth: new Date().toISOString().slice(0, 7), owner: "Owner", dealScore: null, verdict: null, notes: "" };
    savePipeline([...pipeline, newDeal]);
    startEdit(newDeal);
  };

  const removeDeal = (id) => savePipeline(pipeline.filter(p => p.id !== id));

  const runDealScore = (deal) => {
    const { score, verdict } = scorePipelineDeal(deal, g);
    savePipeline(pipeline.map(p => p.id === deal.id ? { ...p, dealScore: score, verdict } : p));
  };

  // Scenario helpers — combined pipeline selection + hypothetical customers
  const [selectedPipelineIds, setSelectedPipelineIds] = useState([]);
  const addScenarioCustomer = () => setScenarioCustomers(s => [...s, { id: Date.now(), name: "", revenue: "", gm: "", serviceType: "manufacturing" }]);
  const removeScenarioCustomer = (id) => setScenarioCustomers(s => s.filter(c => c.id !== id));
  const updateScenario = (id, field, val) => setScenarioCustomers(s => s.map(c => c.id === id ? { ...c, [field]: val } : c));
  const togglePipelineDeal = (id) => setSelectedPipelineIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);

  // Combined scenario calculations — selected pipeline deals (at 100%) + hypothetical customers
  const selectedDeals = pipeline.filter(p => selectedPipelineIds.includes(p.id));
  const selectedPipelineRevenue = selectedDeals.reduce((s, p) => s + p.revenue, 0);
  const selectedPipelineGP = selectedDeals.reduce((s, p) => s + p.revenue * (p.gm / 100), 0);
  const hypotheticalRevenue = scenarioCustomers.reduce((s, c) => s + num(c.revenue), 0);
  const hypotheticalGP = scenarioCustomers.reduce((s, c) => s + num(c.revenue) * (num(c.gm) / 100), 0);
  const totalScenarioRevenue = selectedPipelineRevenue + hypotheticalRevenue;
  const totalScenarioGP = selectedPipelineGP + hypotheticalGP;
  const currentBookGP = customers.reduce((s, c) => s + c.gp_ytd, 0);
  const proFormaRevenue = totalCurrentRevenue + totalScenarioRevenue;
  const proFormaGP = currentBookGP + totalScenarioGP;
  const proFormaGM = proFormaRevenue > 0 ? (proFormaGP / proFormaRevenue) * 100 : 0;
  const proFormaAnchorConc = proFormaRevenue > 0 ? (anchor?.revenue_ytd / proFormaRevenue) * 100 : 0;
  const proFormaEMPE = proFormaGP / d.settings.employees;
  const currentEMPE = currentBookGP / d.settings.employees;
  const hasScenarioInput = totalScenarioRevenue > 0;

  const allScenarioFloorBreaches = [
    ...scenarioCustomers.filter(c => {
      const floor = c.serviceType === "npd" ? g.minGM_npd : c.serviceType === "raw" ? g.minGM_rawMaterial : g.minGM_manufacturing;
      return num(c.gm) > 0 && num(c.gm) < floor;
    }).map(c => ({ name: c.name || "Unnamed hypothetical", gm: num(c.gm), serviceType: c.serviceType, source: "hypothetical" })),
    ...selectedDeals.filter(p => {
      const floor = p.serviceType === "npd" ? g.minGM_npd : p.serviceType === "raw" ? g.minGM_rawMaterial : g.minGM_manufacturing;
      return p.gm < floor;
    }).map(p => ({ name: p.name, gm: p.gm, serviceType: p.serviceType, source: "pipeline" })),
  ];

  return (
    <div className="gap16">
      <div className="sh">
        <div className="sh-title">Pipeline & Diversification</div>
        <div className="sh-sub">Active opportunities · pro forma book · scenario modeling</div>
      </div>

      {/* Diversification Gap -- always visible at top */}
      <div className="card">
        <div className="card-title">Diversification Gap — Auto-Anchor: {anchor?.name || "—"}</div>
        <div className="g4">
          <div className="divers-gap">
            <div className="divers-gap-title">Current Concentration</div>
            <div className="divers-gap-anchor" style={{ color: anchorConc >= targetCap ? "var(--red)" : anchorConc >= targetCap * 0.8 ? "var(--yellow)" : "var(--green)" }}>{pct(anchorConc)}</div>
            <div className="divers-gap-sub">of total revenue · cap: {pct(targetCap)}</div>
            <div className="divers-gap-bar-wrap">
              <div className="divers-gap-bar-labels"><span>0%</span><span>Cap {pct(targetCap)}</span><span>100%</span></div>
              <div style={{ height: 8, background: "var(--border2)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", left: `${targetCap}%`, top: 0, bottom: 0, width: 2, background: "var(--yellow)", zIndex: 2 }} />
                <div style={{ height: "100%", width: `${Math.min(anchorConc, 100)}%`, background: anchorConc >= targetCap ? "var(--red)" : anchorConc >= targetCap * 0.8 ? "var(--yellow)" : "var(--green)", borderRadius: 4, transition: "width .4s" }} />
              </div>
            </div>
          </div>
          <div className="divers-gap">
            <div className="divers-gap-title">Revenue Gap to Cap</div>
            <div className="divers-gap-anchor" style={{ color: revenueNeeded > 0 ? "var(--yellow)" : "var(--green)" }}>{fmt(revenueNeeded)}</div>
            <div className="divers-gap-sub">non-{anchor?.name?.split(" ")[0]} revenue needed</div>
            <div style={{ height: 8, background: "var(--border2)", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
              <div style={{ height: "100%", width: `${pipelineCoverage}%`, background: pipelineCoverage >= 80 ? "var(--green)" : pipelineCoverage >= 40 ? "var(--yellow)" : "var(--red)", borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 4 }}>{pct(pipelineCoverage)} covered by weighted pipeline</div>
          </div>
          <div className="divers-gap">
            <div className="divers-gap-title">Weighted Pipeline</div>
            <div className="divers-gap-anchor" style={{ color: "var(--accent)" }}>{fmt(metrics.weightedRevenue)}</div>
            <div className="divers-gap-sub">{metrics.active} active deals · {pct(metrics.weightedGM)} blended GM%</div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 8 }}>
              {fmt(metrics.weightedGP)} weighted GP$
            </div>
          </div>
          <div className="divers-gap">
            <div className="divers-gap-title">Pro Forma Concentration</div>
            <div className="divers-gap-anchor" style={{ color: proforma.proFormaAnchorConc >= targetCap ? "var(--red)" : proforma.proFormaAnchorConc >= targetCap * 0.8 ? "var(--yellow)" : "var(--green)" }}>{pct(proforma.proFormaAnchorConc)}</div>
            <div className="divers-gap-sub">if pipeline closes as weighted</div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 8 }}>
              {proforma.proFormaAnchorConc < anchorConc ? `▼ ${(anchorConc - proforma.proFormaAnchorConc).toFixed(1)}pts improvement` : "No change"}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Active Pipeline ({pipeline.length})</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="snapshot-btn" onClick={() => setShowScenario(true)}>🔮 Scenario Modeler</button>
            <button className="eval-btn" style={{ marginTop: 0, padding: "6px 16px", fontSize: 12 }} onClick={addDeal}>+ Add Deal</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Opportunity</th><th>Stage</th><th>Revenue</th><th>GM%</th><th>Wtd GP$</th>
              <th>Close</th><th>Owner</th><th>Score</th><th>Verdict</th><th>Actions</th>
            </tr></thead>
            <tbody>{pipeline.map(deal => {
              if (editingId === deal.id && editDraft) return (
                <tr key={deal.id} style={{ background: "var(--surface2)" }}>
                  <td><input className="finput" style={{ padding: "4px 8px", fontSize: 12 }} value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))} /></td>
                  <td>
                    <select className="fselect" style={{ padding: "4px 8px", fontSize: 12 }} value={editDraft.stage} onChange={e => setEditDraft(d => ({ ...d, stage: e.target.value, probability: STAGE_PROBS[e.target.value] }))}>
                      {Object.entries(STAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td><input className="finput" style={{ padding: "4px 8px", fontSize: 12, width: 90 }} type="number" value={editDraft.revenue} onChange={e => setEditDraft(d => ({ ...d, revenue: e.target.value }))} /></td>
                  <td><input className="finput" style={{ padding: "4px 8px", fontSize: 12, width: 60 }} type="number" value={editDraft.gm} onChange={e => setEditDraft(d => ({ ...d, gm: e.target.value }))} /></td>
                  <td className="mono" style={{ fontSize: 11, color: "var(--text3)" }}>{fmt(num(editDraft.revenue) * (num(editDraft.gm) / 100) * (num(editDraft.probability) / 100))}</td>
                  <td><input className="finput" style={{ padding: "4px 8px", fontSize: 12, width: 100 }} type="month" value={editDraft.expectedCloseMonth} onChange={e => setEditDraft(d => ({ ...d, expectedCloseMonth: e.target.value }))} /></td>
                  <td>
                    <select className="fselect" style={{ padding: "4px 8px", fontSize: 12 }} value={editDraft.owner} onChange={e => setEditDraft(d => ({ ...d, owner: e.target.value }))}>
                      {(d.settings.team || []).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                  <td colSpan={2} style={{ fontSize: 11 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <input className="finput" style={{ padding: "4px 8px", fontSize: 11, width: 50 }} type="number" value={editDraft.probability} onChange={e => setEditDraft(d => ({ ...d, probability: e.target.value }))} placeholder="Prob%" />
                      <select className="fselect" style={{ padding: "4px 8px", fontSize: 11 }} value={editDraft.serviceType} onChange={e => setEditDraft(d => ({ ...d, serviceType: e.target.value }))}>
                        <option value="manufacturing">Mfg</option>
                        <option value="raw">Raw</option>
                        <option value="npd">NPD</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="anno-save-btn" onClick={saveEdit}>✓</button>
                      <button onClick={cancelEdit} style={{ background: "transparent", border: "none", color: "var(--text3)", fontSize: 16 }}>✕</button>
                    </div>
                  </td>
                </tr>
              );
              const wtdGP = deal.revenue * (deal.gm / 100) * (deal.probability / 100);
              const floor = deal.serviceType === "npd" ? g.minGM_npd : deal.serviceType === "raw" ? g.minGM_rawMaterial : g.minGM_manufacturing;
              const gmColor = deal.gm >= 25 ? "var(--green)" : deal.gm >= floor ? "var(--yellow)" : "var(--red)";
              return (
                <tr key={deal.id}>
                  <td style={{ fontWeight: 600, color: "var(--text)" }}>
                    {deal.name}
                    {deal.notes && <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 2 }}>{deal.notes}</div>}
                  </td>
                  <td><span className={`pipe-stage ${deal.stage}`}>{STAGE_LABELS[deal.stage]}</span></td>
                  <td className="mono">{fmt(deal.revenue)}</td>
                  <td className="mono" style={{ color: gmColor }}>{pct(deal.gm)}</td>
                  <td className="mono" style={{ color: "var(--accent)" }}>{fmt(wtdGP)}</td>
                  <td className="mono" style={{ fontSize: 11, color: "var(--text3)" }}>{deal.expectedCloseMonth}</td>
                  <td style={{ fontSize: 11, color: "var(--text2)" }}>{deal.owner}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{deal.dealScore !== null ? deal.dealScore : "—"}</td>
                  <td>
                    {deal.verdict
                      ? <span className={`pipe-verdict ${deal.verdict}`}>{deal.verdict.toUpperCase()}</span>
                      : <span className="pipe-verdict unscored">Unscored</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => startEdit(deal)} style={{ background: "transparent", border: "1px solid var(--border2)", color: "var(--text3)", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>Edit</button>
                      <button onClick={() => runDealScore(deal)} style={{ background: "transparent", border: "1px solid var(--border2)", color: "var(--accent)", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>Score</button>
                      <button onClick={() => removeDeal(deal.id)} style={{ background: "transparent", border: "none", color: "var(--text3)", fontSize: 16 }}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      {/* Pro Forma Book */}
      <div className="card">
        <div className="card-title">Pro Forma Book — If Pipeline Closes as Weighted</div>
        <div className="g2">
          <div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 10 }}>Key Metrics</div>
            {[
              { label: "Total Revenue", current: totalCurrentRevenue, next: proforma.proFormaRevenue },
              { label: "Total GP$", current: customers.reduce((s, c) => s + c.gp_ytd, 0), next: proforma.proFormaGP },
              { label: "Blended GM%", current: proforma.currentGM, next: proforma.proFormaGM, isPct: true },
              { label: `${anchor?.name?.split(" ")[0]} Concentration`, current: anchorConc, next: proforma.proFormaAnchorConc, isPct: true, invert: true },
            ].map(r => {
              const improved = r.invert ? r.next < r.current : r.next > r.current;
              const fmt2 = r.isPct ? pct : fmt;
              const delta = r.next - r.current;
              return (
                <div key={r.label} className="proforma-row">
                  <span style={{ fontSize: 12.5, color: "var(--text2)" }}>{r.label}</span>
                  <div style={{ display: "flex", align: "center", gap: 8 }}>
                    <span className="proforma-current">{fmt2(r.current)}</span>
                    <span className="proforma-arrow">→</span>
                    <span className="proforma-new" style={{ color: improved ? "var(--green)" : delta === 0 ? "var(--text3)" : "var(--red)" }}>{fmt2(r.next)}</span>
                    <span style={{ fontSize: 10, fontFamily: "DM Mono,monospace", color: improved ? "var(--green)" : "var(--red)", minWidth: 50 }}>
                      {r.isPct ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}pts` : `${delta >= 0 ? "+" : ""}${fmt(Math.abs(delta))}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 10 }}>Pipeline by Stage</div>
            {Object.entries(STAGE_LABELS).map(([stage, label]) => {
              const stageDeals = pipeline.filter(p => p.stage === stage);
              if (!stageDeals.length) return null;
              const stageRev = stageDeals.reduce((s, p) => s + p.revenue, 0);
              return (
                <div key={stage} className="proforma-row">
                  <div style={{ display: "flex", align: "center", gap: 8 }}>
                    <span className={`pipe-stage ${stage}`}>{label}</span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>{stageDeals.length} deal{stageDeals.length > 1 ? "s" : ""}</span>
                  </div>
                  <span className="proforma-new" style={{ color: "var(--text)" }}>{fmt(stageRev)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scenario Modal */}
      {showScenario && (
        <div className="scenario-modal" onClick={e => e.target === e.currentTarget && setShowScenario(false)}>
          <div className="scenario-panel">
            <div className="scenario-header">
              <div>
                <div className="scenario-title">Scenario Modeler</div>
                <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 2 }}>
                  Select pipeline deals + add hypotheticals — see full combined business impact instantly
                </div>
              </div>
              <button className="admin-close" onClick={() => setShowScenario(false)}>✕</button>
            </div>

            {/* Step 1: Select pipeline deals */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>
                Step 1 — Select Pipeline Deals (closes at 100%)
              </div>
              {pipeline.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>No pipeline deals yet — add them in the pipeline table first.</div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {pipeline.map(p => {
                  const selected = selectedPipelineIds.includes(p.id);
                  const floor = p.serviceType === "npd" ? g.minGM_npd : p.serviceType === "raw" ? g.minGM_rawMaterial : g.minGM_manufacturing;
                  const belowFloor = p.gm < floor;
                  return (
                    <button key={p.id} onClick={() => togglePipelineDeal(p.id)} style={{
                      padding: "8px 14px", borderRadius: 8, border: "1px solid",
                      borderColor: selected ? "var(--accent)" : "var(--border2)",
                      background: selected ? "rgba(0,212,160,.08)" : "var(--surface2)",
                      color: selected ? "var(--accent)" : "var(--text2)",
                      fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                      textAlign: "left",
                    }}>
                      <div>{p.name}</div>
                      <div style={{ fontSize: 10, fontFamily: "DM Mono,monospace", marginTop: 2, color: selected ? "var(--accent)" : "var(--text3)" }}>
                        {fmt(p.revenue)} · <span style={{ color: belowFloor ? "var(--red)" : selected ? "var(--accent)" : "var(--text3)" }}>{pct(p.gm)} GM%</span>
                        {belowFloor && " ⚠"}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedPipelineIds.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>
                  {selectedPipelineIds.length} deal{selectedPipelineIds.length > 1 ? "s" : ""} selected · {fmt(selectedPipelineRevenue)} revenue · {fmt(selectedPipelineGP)} GP$
                </div>
              )}
            </div>

            {/* Step 2: Add hypothetical customers */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>
                Step 2 — Add Hypothetical Customers
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 6 }}>
                {["Name", "Revenue", "GM%", "Service", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 9, color: "var(--text3)", fontFamily: "DM Mono,monospace", letterSpacing: ".8px", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {scenarioCustomers.map(sc => {
                const floor = sc.serviceType === "npd" ? g.minGM_npd : sc.serviceType === "raw" ? g.minGM_rawMaterial : g.minGM_manufacturing;
                const gmNum = num(sc.gm);
                const belowFloor = gmNum > 0 && gmNum < floor;
                return (
                  <div key={sc.id} className="scenario-customer-row">
                    <input className="finput" style={{ fontSize: 13 }} placeholder="Company name" value={sc.name} onChange={e => updateScenario(sc.id, "name", e.target.value)} />
                    <input className="finput" style={{ fontSize: 13 }} type="number" placeholder="e.g. 750000" value={sc.revenue} onChange={e => updateScenario(sc.id, "revenue", e.target.value)} />
                    <div>
                      <input className="finput" style={{ fontSize: 13, borderColor: belowFloor ? "var(--red)" : undefined }} type="number" placeholder="e.g. 24.0" value={sc.gm} onChange={e => updateScenario(sc.id, "gm", e.target.value)} />
                      {belowFloor && <div style={{ fontSize: 9, color: "var(--red)", fontFamily: "DM Mono,monospace", marginTop: 2 }}>Below {floor}% floor</div>}
                    </div>
                    <select className="fselect" style={{ fontSize: 13 }} value={sc.serviceType} onChange={e => updateScenario(sc.id, "serviceType", e.target.value)}>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="raw">Raw Material</option>
                      <option value="npd">NPD</option>
                    </select>
                    <button className="remove-btn" onClick={() => removeScenarioCustomer(sc.id)}>✕</button>
                  </div>
                );
              })}
              <button className="add-btn" onClick={addScenarioCustomer}>+ Add Hypothetical Customer</button>
            </div>

            {/* Scenario summary input line */}
            {hasScenarioInput && (
              <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border2)", marginBottom: 20, fontSize: 11, fontFamily: "DM Mono,monospace", display: "flex", gap: 20, flexWrap: "wrap" }}>
                <span style={{ color: "var(--text3)" }}>Total scenario input:</span>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{fmt(totalScenarioRevenue)} revenue</span>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{fmt(totalScenarioGP)} GP$</span>
                <span style={{ color: totalScenarioRevenue > 0 ? (totalScenarioGP / totalScenarioRevenue * 100 >= g.minGM_manufacturing ? "var(--green)" : "var(--yellow)") : "var(--text3)", fontWeight: 700 }}>
                  {totalScenarioRevenue > 0 ? pct(totalScenarioGP / totalScenarioRevenue * 100) : "—"} blended GM%
                </span>
                {selectedPipelineIds.length > 0 && <span style={{ color: "var(--text3)" }}>{selectedPipelineIds.length} pipeline deal{selectedPipelineIds.length > 1 ? "s" : ""} + {scenarioCustomers.filter(c => num(c.revenue) > 0).length} hypothetical</span>}
              </div>
            )}

            {/* Results */}
            {hasScenarioInput && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 14 }}>Combined Impact on Business</div>
                <div className="g4" style={{ marginBottom: 20 }}>
                  {[
                    { label: "New Total Revenue", current: totalCurrentRevenue, next: proFormaRevenue },
                    { label: "New Total GP$", current: currentBookGP, next: proFormaGP },
                    { label: "New Blended GM%", current: proforma.currentGM, next: proFormaGM, isPct: true },
                    { label: `${anchor?.name?.split(" ")[0] || "Anchor"} Concentration`, current: anchorConc, next: proFormaAnchorConc, isPct: true, invert: true },
                    { label: "New EMPE", current: currentEMPE, next: proFormaEMPE },
                    { label: "Revenue Added", current: 0, next: totalScenarioRevenue, hideArrow: true },
                    { label: "GP$ Added", current: 0, next: totalScenarioGP, hideArrow: true },
                    { label: "Scenario GM%", current: 0, next: totalScenarioRevenue > 0 ? (totalScenarioGP / totalScenarioRevenue) * 100 : 0, isPct: true, hideArrow: true },
                  ].map(r => {
                    const improved = r.invert ? r.next < r.current : r.next > r.current;
                    const fmt2 = r.isPct ? pct : fmt;
                    const delta = r.next - r.current;
                    const guardrailBreach = r.label.includes("Concentration") && r.next >= targetCap;
                    const gmBreach = r.label.includes("GM%") && !r.hideArrow && r.next < g.minGM_manufacturing;
                    return (
                      <div key={r.label} className="scenario-result-card">
                        <div className="scenario-result-title">{r.label}</div>
                        {r.hideArrow ? (
                          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>{fmt2(r.next)}</div>
                        ) : (
                          <div>
                            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>{fmt2(r.current)}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: guardrailBreach ? "var(--red)" : gmBreach ? "var(--red)" : improved ? "var(--green)" : "var(--yellow)" }}>
                              {fmt2(r.next)}
                            </div>
                            <div className="scenario-delta" style={{ color: improved ? "var(--green)" : "var(--red)" }}>
                              {r.isPct ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}pts` : `${delta >= 0 ? "+" : ""}${fmt(Math.abs(delta))}`}
                            </div>
                          </div>
                        )}
                        {guardrailBreach && <div style={{ fontSize: 9, color: "var(--red)", fontFamily: "DM Mono,monospace", marginTop: 4 }}>⚠ EXCEEDS CAP</div>}
                        {gmBreach && <div style={{ fontSize: 9, color: "var(--red)", fontFamily: "DM Mono,monospace", marginTop: 4 }}>⚠ BELOW GM FLOOR</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Guardrail warnings */}
                {(allScenarioFloorBreaches.length > 0 || proFormaAnchorConc >= targetCap) && (
                  <div style={{ padding: "12px 14px", background: "var(--red-bg)", border: "1px solid rgba(255,71,87,.3)", borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, color: "var(--red)", marginBottom: 6 }}>Guardrail Warnings</div>
                    {allScenarioFloorBreaches.map((c, i) => (
                      <div key={i} style={{ color: "var(--text2)", marginBottom: 3 }}>
                        · {c.name} at {pct(c.gm)} GM% is below the {c.serviceType} floor
                        <span style={{ marginLeft: 6, fontSize: 10, fontFamily: "DM Mono,monospace", color: c.source === "pipeline" ? "var(--blue)" : "var(--text3)" }}>
                          [{c.source}]
                        </span>
                      </div>
                    ))}
                    {proFormaAnchorConc >= targetCap && (
                      <div style={{ color: "var(--text2)", marginTop: 4 }}>
                        · {anchor?.name} still at {pct(proFormaAnchorConc)} — exceeds {pct(targetCap)} cap even with this scenario
                      </div>
                    )}
                  </div>
                )}

                {/* Remaining gap */}
                {proFormaAnchorConc > targetCap * 0.7 && (
                  <div style={{ padding: "12px 14px", background: "var(--yellow-bg)", border: "1px solid rgba(255,201,71,.3)", borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: "var(--yellow)", fontWeight: 700 }}>Remaining gap after scenario: </span>
                    <span style={{ color: "var(--text2)" }}>
                      You still need {fmt(Math.max(0, anchor?.revenue_ytd / (targetCap / 100) - proFormaRevenue))} more in non-{anchor?.name?.split(" ")[0]} revenue to bring concentration below {pct(targetCap)}.
                    </span>
                  </div>
                )}
              </div>
            )}

            {!hasScenarioInput && (
              <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--text3)", fontFamily: "DM Mono,monospace", fontSize: 12 }}>
                Select pipeline deals above or enter hypothetical customers to see combined business impact
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PDF BOOKKEEPER IMPORTER ──────────────────────────────────────────────────
function PDFImporter({ d, onSave, onClose }) {
  const [stage, setStage] = useState("drop"); // drop | processing | review | done
  const [drag, setDrag] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });
  const [extracted, setExtracted] = useState(null);
  const [accepted, setAccepted] = useState({});
  const [error, setError] = useState(null);

  const months = Array.from({ length: 36 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  const extractPDF = async (file) => {
    setStage("processing");
    setError(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: base64 }
              },
              {
                type: "text",
                text: `You are extracting financial data from a bookkeeper monthly report for ${reportMonth}. Extract ONLY these specific numbers from the ACCRUAL BASIS section of the report. Return ONLY valid JSON, no explanation, no markdown:

{
  "accrual_revenue_mtd": <number or null>,
  "accrual_gp_mtd": <number or null>,
  "accrual_gm_pct_mtd": <number or null>,
  "accrual_net_income": <number or null>,
  "cash_revenue_mtd": <number or null>,
  "cash_gp_mtd": <number or null>,
  "cash_gm_pct_mtd": <number or null>,
  "cash_net_income": <number or null>,
  "cash_balance_total": <number or null>,
  "ar_total_open": <number or null>,
  "ar_past_due": <number or null>,
  "ap_total": <number or null>,
  "owner_comp_ytd": <number or null>,
  "distributions_ytd": <number or null>,
  "overhead_monthly": <number or null>,
  "payroll_monthly": <number or null>,
  "confidence": "high|medium|low",
  "notes": "<any caveats about extraction quality>"
}

If a value is not found or unclear, use null. All monetary values should be plain numbers without $ or commas.`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.find(c => c.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setExtracted(parsed);

      // Default: accept all non-null fields
      const defaults = {};
      Object.keys(parsed).forEach(k => {
        if (k !== "confidence" && k !== "notes" && parsed[k] !== null) defaults[k] = true;
      });
      setAccepted(defaults);
      setStage("review");
    } catch (e) {
      setError(`Extraction failed: ${e.message}. Try a digital PDF rather than a scanned image.`);
      setStage("drop");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") extractPDF(file);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) extractPDF(file);
  };

  const applyExtraction = () => {
    const x = extracted;
    const f = d.financials;
    const updates = {};

    if (accepted.accrual_revenue_mtd && x.accrual_revenue_mtd) updates["financials.revenue.mtd"] = x.accrual_revenue_mtd;
    if (accepted.accrual_gp_mtd && x.accrual_gp_mtd) updates["financials.gp.mtd"] = x.accrual_gp_mtd;
    if (accepted.accrual_gm_pct_mtd && x.accrual_gm_pct_mtd) updates["financials.gm.mtd"] = x.accrual_gm_pct_mtd;
    if (accepted.accrual_net_income && x.accrual_net_income) updates["financials.netIncomeEstimate"] = x.accrual_net_income;
    if (accepted.cash_revenue_mtd && x.cash_revenue_mtd) updates["financials.cash_revenue.mtd"] = x.cash_revenue_mtd;
    if (accepted.cash_gp_mtd && x.cash_gp_mtd) updates["financials.cash_gp.mtd"] = x.cash_gp_mtd;
    if (accepted.cash_gm_pct_mtd && x.cash_gm_pct_mtd) updates["financials.cash_gm.mtd"] = x.cash_gm_pct_mtd;
    if (accepted.cash_net_income && x.cash_net_income) updates["financials.netIncomeCash"] = x.cash_net_income;
    if (accepted.ar_total_open && x.ar_total_open) updates["ar.total"] = x.ar_total_open;
    if (accepted.ar_past_due && x.ar_past_due) updates["ar.aging.4.amount"] = x.ar_past_due;
    if (accepted.owner_comp_ytd && x.owner_comp_ytd) updates["financials.ownerCompYTD"] = x.owner_comp_ytd;
    if (accepted.distributions_ytd && x.distributions_ytd) updates["financials.distributionsYTD"] = x.distributions_ytd;
    if (accepted.overhead_monthly && x.overhead_monthly) updates["financials.overheadRunRate"] = x.overhead_monthly;
    if (accepted.payroll_monthly && x.payroll_monthly) updates["financials.payrollRunRate"] = x.payroll_monthly;

    // Apply updates via deep path setter
    let newData = JSON.parse(JSON.stringify(d));
    Object.entries(updates).forEach(([path, value]) => {
      const keys = path.split(".");
      let obj = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] === undefined) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
    });

    // Update bank cash if provided
    if (accepted.cash_balance_total && x.cash_balance_total) {
      const currentTotal = newData.cash.accounts.reduce((s, a) => s + a.balance, 0);
      const ratio = x.cash_balance_total / (currentTotal || 1);
      newData.cash.accounts = newData.cash.accounts.map(a => ({ ...a, balance: Math.round(a.balance * ratio) }));
    }

    newData.financials.lastBookkeeperMonth = reportMonth;
    newData.financials.lastBookkeeperReport = new Date().toISOString();
    newData.financials.basisNote = "accrual";
    newData.meta = { lastUpdated: new Date().toISOString(), updatedBy: "Bookkeeper PDF Import" };
    newData.changelog = [...(newData.changelog || []), {
      date: new Date().toISOString(),
      changes: [`Bookkeeper report imported for ${reportMonth} — ${Object.keys(updates).length} fields updated (accrual basis, ${x.confidence} confidence)`]
    }];

    onSave(newData);
    setStage("done");
    setTimeout(onClose, 1800);
  };

  const FIELD_LABELS = {
    accrual_revenue_mtd: ["Revenue MTD", "Accrual"],
    accrual_gp_mtd: ["Gross Profit MTD", "Accrual"],
    accrual_gm_pct_mtd: ["GM% MTD", "Accrual", true],
    accrual_net_income: ["Net Income", "Accrual"],
    cash_revenue_mtd: ["Revenue MTD", "Cash"],
    cash_gp_mtd: ["Gross Profit MTD", "Cash"],
    cash_gm_pct_mtd: ["GM% MTD", "Cash", true],
    cash_net_income: ["Net Income", "Cash"],
    cash_balance_total: ["Cash Balance Total", "Cash"],
    ar_total_open: ["A/R Total Open", "Balance Sheet"],
    ar_past_due: ["A/R Past Due", "Balance Sheet"],
    ap_total: ["A/P Total", "Balance Sheet"],
    owner_comp_ytd: ["Owner Comp YTD", "P&L"],
    distributions_ytd: ["Distributions YTD", "P&L"],
    overhead_monthly: ["Overhead (monthly)", "P&L"],
    payroll_monthly: ["Payroll (monthly)", "P&L"],
  };

  const currentVals = {
    accrual_revenue_mtd: d.financials.revenue.mtd,
    accrual_gp_mtd: d.financials.gp.mtd,
    accrual_gm_pct_mtd: d.financials.gm.mtd,
    accrual_net_income: d.financials.netIncomeEstimate,
    cash_revenue_mtd: d.financials.cash_revenue?.mtd,
    cash_gp_mtd: d.financials.cash_gp?.mtd,
    cash_gm_pct_mtd: d.financials.cash_gm?.mtd,
    cash_net_income: d.financials.netIncomeCash,
    cash_balance_total: d.cash.accounts.reduce((s, a) => s + a.balance, 0),
    ar_total_open: d.ar.aging.reduce((s, r) => s + r.amount, 0),
    ar_past_due: d.ar.aging.slice(3).reduce((s, r) => s + r.amount, 0),
    ap_total: d.ap.aging.reduce((s, r) => s + r.amount, 0),
    owner_comp_ytd: d.financials.ownerCompYTD,
    distributions_ytd: d.financials.distributionsYTD,
    overhead_monthly: d.financials.overheadRunRate,
    payroll_monthly: d.financials.payrollRunRate,
  };

  const acceptedCount = Object.values(accepted).filter(Boolean).length;

  return (
    <div className="pdf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pdf-panel">
        <div className="pdf-header">
          <div>
            <div className="pdf-title">Bookkeeper Report Import</div>
            <div className="pdf-sub">AI-assisted extraction · accrual primary · review before applying</div>
          </div>
          <button className="admin-close" onClick={onClose}>✕</button>
        </div>

        <div className="pdf-body">
          {stage === "drop" && (
            <div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="flabel">Report Month</label>
                <select className="pdf-month-select" value={reportMonth} onChange={e => setReportMonth(e.target.value)}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className={`pdf-drop ${drag ? "drag" : ""}`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".pdf"; i.onchange = handleFile; i.click(); }}>
                <div className="pdf-drop-icon">📑</div>
                <div className="pdf-drop-text">Drop your bookkeeper PDF here</div>
                <div className="pdf-drop-sub">or click to browse · digital PDFs only (not scanned images)</div>
              </div>
              {error && <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--red-bg)", border: "1px solid rgba(255,71,87,.3)", borderRadius: 8, fontSize: 12, color: "var(--red)" }}>{error}</div>}
              <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border2)", fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", lineHeight: 1.7 }}>
                The PDF is sent to Claude AI for extraction. It is not stored anywhere. Only the extracted numbers are applied to your app. Review every field before applying.
              </div>
            </div>
          )}

          {stage === "processing" && (
            <div className="pdf-processing">
              <div className="pdf-processing-icon">⚙</div>
              <div className="pdf-processing-text">Reading your bookkeeper report...</div>
              <div className="pdf-processing-sub">Claude is extracting accrual and cash figures from {reportMonth}</div>
            </div>
          )}

          {stage === "review" && extracted && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "10px 12px", background: extracted.confidence === "high" ? "var(--green-bg)" : "var(--yellow-bg)", borderRadius: 8, border: `1px solid ${extracted.confidence === "high" ? "rgba(0,212,160,.3)" : "rgba(255,201,71,.3)"}` }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: extracted.confidence === "high" ? "var(--green)" : "var(--yellow)" }}>Extraction confidence: {extracted.confidence?.toUpperCase()}</div>
                  {extracted.notes && <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 2 }}>{extracted.notes}</div>}
                </div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>{reportMonth}</div>
              </div>

              <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginBottom: 12 }}>
                Toggle each field to accept or skip. Green = accept, gray = skip. Review extracted values against current app values before applying.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 0, borderBottom: "1px solid var(--border2)", paddingBottom: 6, marginBottom: 4 }}>
                {["Field", "Extracted", "Current", ""].map((h, i) => <span key={i} style={{ fontSize: 9, color: "var(--text3)", fontFamily: "DM Mono,monospace", letterSpacing: ".8px", textTransform: "uppercase", padding: "4px 6px", textAlign: i > 0 ? "right" : "left" }}>{h}</span>)}
              </div>

              {Object.entries(FIELD_LABELS).map(([key, [label, section, isPct]]) => {
                if (extracted[key] === null || extracted[key] === undefined) return null;
                const isAccepted = !!accepted[key];
                const current = currentVals[key];
                return (
                  <div key={key} className="pdf-review-row" style={{ opacity: isAccepted ? 1 : 0.45 }}>
                    <span className="pdf-review-field">
                      {label}
                      <span style={{ marginLeft: 6, fontSize: 9, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>{section}</span>
                    </span>
                    <span className="pdf-review-extracted">{isPct ? pct(extracted[key]) : fmt(extracted[key])}</span>
                    <span className="pdf-review-current">{current !== undefined ? (isPct ? pct(current) : fmt(current)) : "—"}</span>
                    <div className="pdf-review-toggle">
                      <button className={`pdf-accept-btn ${isAccepted ? "active" : ""}`} onClick={() => setAccepted(a => ({ ...a, [key]: true }))}>✓</button>
                      <button className={`pdf-skip-btn ${!isAccepted ? "active" : ""}`} onClick={() => setAccepted(a => ({ ...a, [key]: false }))}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {stage === "done" && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Import Applied</div>
              <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>{acceptedCount} fields updated from {reportMonth} bookkeeper report</div>
            </div>
          )}
        </div>

        {stage === "review" && (
          <div className="pdf-footer">
            <button className="pdf-apply-btn" onClick={applyExtraction} disabled={acceptedCount === 0}>
              Apply {acceptedCount} Field{acceptedCount !== 1 ? "s" : ""} to App
            </button>
            <div className="pdf-meta-note">Accrual figures will update primary P&L · Cash figures update comparison view · All changes logged</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CSV IMPORTER ─────────────────────────────────────────────────────────────
function CSVImporter({ d, onSave, onClose }) {
  const [plParsed, setPlParsed] = useState(null);
  const [arParsed, setArParsed] = useState(null);
  const [plDrag, setPlDrag] = useState(false);
  const [arDrag, setArDrag] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const parseQBOPL = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const results = [];
    lines.forEach(line => {
      const cols = line.split(",").map(c => c.replace(/"/g, "").trim());
      if (cols.length < 3) return;
      const name = cols[0];
      const revenue = parseFloat(cols[1]?.replace(/[$,]/g, "")) || 0;
      const gp = parseFloat(cols[2]?.replace(/[$,]/g, "")) || 0;
      if (!name || name.toLowerCase().includes("total") || name.toLowerCase().includes("customer")) return;
      if (revenue <= 0) return;
      const gm = revenue > 0 ? (gp / revenue) * 100 : 0;
      const existing = d.customers.find(c => c.name.toLowerCase().trim() === name.toLowerCase().trim());
      results.push({ name, revenue, gp, gm: parseFloat(gm.toFixed(1)), matched: !!existing, existingId: existing?.id });
    });
    return results;
  };

  const parseQBOAR = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const results = [];
    lines.forEach(line => {
      const cols = line.split(",").map(c => c.replace(/"/g, "").trim());
      if (cols.length < 3) return;
      const name = cols[0];
      const open = parseFloat(cols[1]?.replace(/[$,]/g, "")) || 0;
      const pastDue = parseFloat(cols[2]?.replace(/[$,]/g, "")) || 0;
      if (!name || name.toLowerCase().includes("total")) return;
      const existing = d.customers.find(c => c.name.toLowerCase().trim() === name.toLowerCase().trim());
      if (existing) results.push({ name, open, pastDue, matched: true, existingId: existing.id });
    });
    return results;
  };

  const readFile = (file, setter, parser) => {
    const reader = new FileReader();
    reader.onload = e => setter(parser(e.target.result));
    reader.readAsText(file);
  };

  const handleDrop = (e, setter, parser) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) readFile(file, setter, parser);
  };

  const applyImport = () => {
    setApplying(true);
    let updatedCustomers = [...d.customers];
    const changes = [];

    if (plParsed) {
      plParsed.forEach(row => {
        if (!row.matched) return;
        updatedCustomers = updatedCustomers.map(c => {
          if (c.id !== row.existingId) return c;
          changes.push(`${c.name}: revenue updated to ${fmt(row.revenue)}, GM% to ${pct(row.gm)}`);
          return { ...c, revenue_mtd: row.revenue, gp_mtd: row.gp, gm: row.gm };
        });
      });
    }

    if (arParsed) {
      arParsed.forEach(row => {
        updatedCustomers = updatedCustomers.map(c => {
          if (c.id !== row.existingId) return c;
          changes.push(`${c.name}: A/R updated — open ${fmt(row.open)}, past due ${fmt(row.pastDue)}`);
          return { ...c, arOpen: row.open, arPastDue: row.pastDue };
        });
      });
    }

    const newData = {
      ...d, customers: updatedCustomers,
      meta: { lastUpdated: new Date().toISOString(), updatedBy: "CSV Import" },
      changelog: [...(d.changelog || []), { date: new Date().toISOString(), changes: [`CSV Import: ${changes.length} customers updated`, ...changes.slice(0, 5)] }],
    };
    onSave(newData);
    setApplied(true);
    setApplying(false);
    setTimeout(onClose, 1500);
  };

  const DropZone = ({ label, hint, parsed, onDrop, onFile, drag, setDrag }) => (
    <div className="csv-section">
      <div className="csv-title">{label}</div>
      <div className="csv-hint">{hint}</div>
      <div className={`csv-drop ${drag ? "drag" : ""}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { setDrag(false); onDrop(e); }}
        onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".csv,.txt"; i.onchange = e => { if (e.target.files[0]) onFile(e.target.files[0]); }; i.click(); }}>
        <div className="csv-drop-icon">{parsed ? "✓" : "📄"}</div>
        <div className="csv-drop-text">{parsed ? `${parsed.length} rows parsed` : "Drop CSV here or click to browse"}</div>
        <div className="csv-drop-sub">{parsed ? `${parsed.filter(r => r.matched).length} matched to existing customers` : "Export from QBO Reports"}</div>
      </div>
      {parsed && (
        <div className="csv-preview">
          <div className="csv-preview-title">Preview</div>
          {parsed.slice(0, 8).map((row, i) => (
            <div key={i} className="csv-match-row">
              <span className="csv-match-name">{row.name}</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {row.revenue !== undefined && <span className="mono" style={{ fontSize: 11, color: "var(--text3)" }}>{fmt(row.revenue)}</span>}
                <span className={`csv-match-status ${row.matched ? "matched" : "new"}`}>{row.matched ? "✓ MATCHED" : "? NEW"}</span>
              </div>
            </div>
          ))}
          {parsed.length > 8 && <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 6 }}>+{parsed.length - 8} more rows</div>}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 600, display: "flex", justifyContent: "flex-end", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "min(560px,95vw)", background: "var(--surface)", borderLeft: "1px solid var(--border2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>QBO CSV Import</div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 2 }}>Auto-populate customer financials from QuickBooks exports</div>
          </div>
          <button className="admin-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          <DropZone label="P&L by Customer (MTD)" hint={"In QBO: Reports → Profit & Loss by Customer → This Month → Export CSV\nColumns needed: Customer Name, Total Revenue, Gross Profit"}
            parsed={plParsed} drag={plDrag} setDrag={setPlDrag}
            onDrop={e => handleDrop(e, setPlParsed, parseQBOPL)}
            onFile={f => readFile(f, setPlParsed, parseQBOPL)} />
          <DropZone label="A/R Aging Summary" hint={"In QBO: Reports → Accounts Receivable Aging Summary → Export CSV\nColumns needed: Customer Name, Total Open, Past Due"}
            parsed={arParsed} drag={arDrag} setDrag={setArDrag}
            onDrop={e => handleDrop(e, setArParsed, parseQBOAR)}
            onFile={f => readFile(f, setArParsed, parseQBOAR)} />
          <div style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border2)", fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono,monospace", lineHeight: 1.6 }}>
            Only matched customers update. Unmatched rows are ignored. You can still manually adjust after import. All changes are logged in the changelog.
          </div>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <button className="save-btn" onClick={applyImport} disabled={!plParsed && !arParsed || applying}>
            {applied ? "✓ Applied" : applying ? "Applying..." : `Apply Import${plParsed || arParsed ? ` (${(plParsed?.filter(r => r.matched).length || 0) + (arParsed?.filter(r => r.matched).length || 0)} updates)` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MANUFACTURER TAB ─────────────────────────────────────────────────────────
function ManufacturerTab({ d, onSave }) {
  const [sel, setSel] = useState(null);
  const manufacturers = d.manufacturers || [];

  const getMfrStatus = (m) => {
    const bad = m.onTimeRate < 80 || m.openNCRs > 1 || m.lateShipments > 1;
    const warn = m.onTimeRate < 90 || m.openNCRs > 0 || m.lateShipments > 0;
    return bad ? "red" : warn ? "yellow" : "green";
  };

  const statusColor = { green: "var(--green)", yellow: "var(--yellow)", red: "var(--red)" };
  const statusLabel = { green: "Healthy", yellow: "Watch", red: "At Risk" };

  const handleAnnotationSave = (updatedMfr) => {
    onSave({ ...d, manufacturers: manufacturers.map(m => m.id === updatedMfr.id ? updatedMfr : m) });
  };

  return (
    <div className="gap16">
      <div className="sh"><div className="sh-title">Manufacturer Tracker</div><div className="sh-sub">On-time rate · NCRs · issue exposure · health trajectory</div></div>

      <div className="g4">
        <Tile label="Total Manufacturers" value={manufacturers.length} />
        <Tile label="At Risk" value={manufacturers.filter(m => getMfrStatus(m) === "red").length} color="red" />
        <Tile label="Watch" value={manufacturers.filter(m => getMfrStatus(m) === "yellow").length} color="yellow" />
        <Tile label="Open Issues Total" value={manufacturers.reduce((s, m) => s + m.openIssues, 0)} color={manufacturers.reduce((s, m) => s + m.openIssues, 0) > 3 ? "red" : "yellow"} />
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Manufacturer</th><th>Health</th><th>On-Time %</th><th>Quality Score</th>
              <th>Late Shipments</th><th>Open NCRs</th><th>Issues</th>
              <th>Active Customers</th><th>Concentration</th><th>Tier</th>
            </tr></thead>
            <tbody>{manufacturers.map(m => {
              const status = getMfrStatus(m);
              const snaps = m.monthlySnapshots || [];
              const lastSnap = snaps[snaps.length - 1];
              const prevSnap = snaps[snaps.length - 2];
              const trendArrow = !lastSnap || !prevSnap ? "→"
                : lastSnap.onTimeRate > prevSnap.onTimeRate ? "▲"
                : lastSnap.onTimeRate < prevSnap.onTimeRate ? "▼" : "→";
              const trendColor = trendArrow === "▲" ? "var(--green)" : trendArrow === "▼" ? "var(--red)" : "var(--text3)";
              return (
                <tr key={m.id} className="clickable" onClick={() => setSel(sel?.id === m.id ? null : m)}>
                  <td style={{ fontWeight: 600, color: "var(--text)" }}>{m.name}</td>
                  <td>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: statusColor[status], marginRight: 6 }} />
                    <span style={{ fontSize: 11, color: statusColor[status] }}>{statusLabel[status]}</span>
                    <span style={{ color: trendColor, fontSize: 11, marginLeft: 4 }}>{trendArrow}</span>
                  </td>
                  <td className="mono" style={{ color: m.onTimeRate >= 90 ? "var(--green)" : m.onTimeRate >= 80 ? "var(--yellow)" : "var(--red)" }}>{m.onTimeRate}%</td>
                  <td className="mono" style={{ color: m.qualityScore >= 90 ? "var(--green)" : m.qualityScore >= 80 ? "var(--yellow)" : "var(--red)" }}>{m.qualityScore}</td>
                  <td className="mono" style={{ color: m.lateShipments > 1 ? "var(--red)" : m.lateShipments > 0 ? "var(--yellow)" : "var(--green)" }}>{m.lateShipments}</td>
                  <td className="mono" style={{ color: m.openNCRs > 1 ? "var(--red)" : m.openNCRs > 0 ? "var(--yellow)" : "var(--green)" }}>{m.openNCRs}</td>
                  <td className="mono" style={{ color: m.openIssues > 2 ? "var(--red)" : m.openIssues > 0 ? "var(--yellow)" : "var(--green)" }}>{m.openIssues}</td>
                  <td style={{ fontSize: 11, color: "var(--text2)" }}>{(m.activeCustomers || []).join(", ")}</td>
                  <td className="mono" style={{ color: m.concentration >= 35 ? "var(--red)" : m.concentration >= 25 ? "var(--yellow)" : "var(--green)" }}>{pct(m.concentration)}</td>
                  <td><span className={`tag tag-${(m.tier || "b").toLowerCase()}`}>{m.tier}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      {sel && (() => {
        const status = getMfrStatus(sel);
        const tenureMonths = sel.tenureStartDate ? Math.floor((new Date() - new Date(sel.tenureStartDate)) / (1000 * 60 * 60 * 24 * 30)) : 0;
        const relatedIssues = (d.issues || []).filter(i => i.entity === sel.name);
        return (
          <div className="card" style={{ borderColor: status === "red" ? "rgba(255,71,87,.3)" : status === "yellow" ? "rgba(255,201,71,.3)" : "rgba(0,212,160,.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{sel.name}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "DM Mono,monospace", marginTop: 2 }}>
                  {tenureMonths}mo tenure · {(sel.activeCustomers || []).length} active customers · {pct(sel.concentration)} of volume
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: statusColor[status] }}>{statusLabel[status]}</div>
            </div>

            <div className="g4">
              <Tile label="On-Time Rate" value={`${sel.onTimeRate}%`} color={sel.onTimeRate >= 90 ? "green" : sel.onTimeRate >= 80 ? "yellow" : "red"} />
              <Tile label="Quality Score" value={sel.qualityScore} color={sel.qualityScore >= 90 ? "green" : sel.qualityScore >= 80 ? "yellow" : "red"} />
              <Tile label="Late Shipments" value={sel.lateShipments} color={sel.lateShipments > 1 ? "red" : sel.lateShipments > 0 ? "yellow" : "green"} />
              <Tile label="Open NCRs" value={sel.openNCRs} color={sel.openNCRs > 1 ? "red" : sel.openNCRs > 0 ? "yellow" : "green"} />
            </div>

            {relatedIssues.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="card-title" style={{ marginBottom: 8 }}>Related Issues</div>
                {relatedIssues.map(issue => (
                  <div key={issue.id} className={`alert ${issue.status === "escalated" ? "red" : "yellow"}`} style={{ marginBottom: 6 }}>
                    <span className={`abadge ${issue.status === "escalated" ? "red" : "yellow"}`}>{issue.category}</span>
                    <span style={{ fontSize: 12 }}>{issue.description} · Owner: {issue.owner} · {issue.daysOpen}d open · {fmt(issue.exposure)} exposure</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>Health Timeline</div>
              <HealthTimeline
                entity={sel}
                isManufacturer
                onSave={(updated) => handleAnnotationSave(updated)}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── CUSTOMER SNAPSHOT ───────────────────────────────────────────────────────
function CustomerSnapshot({ customer: c, data: d, onClose }) {
  const g = d.settings.guardrails;
  const traj = computeTrajectoryStatus(c, g);
  const issues = d.issues.filter(i => i.entity === c.name && i.status !== "resolved");
  const snapshots = c.monthlySnapshots || [];
  const gmFloor = g.minGM_manufacturing;
  const healthColors = { green: "#059669", yellow: "#d97706", red: "#dc2626" };
  const healthColor = healthColors[traj.status];

  const snapColor = (val, floor) => val >= floor + 2 ? "snap-green" : val >= floor ? "" : "snap-red";
  const arColor = (val) => val > 0 ? "snap-red" : "snap-green";

  const guardrailChecks = [
    { label: "GM% above floor", pass: c.gm >= gmFloor, warn: c.gm >= gmFloor * 0.95, detail: `${pct(c.gm)} vs ${pct(gmFloor)} floor` },
    { label: "A/R current", pass: c.arPastDue === 0, warn: false, detail: c.arPastDue > 0 ? `${fmt(c.arPastDue)} past due` : "Current" },
    { label: "GP$ above minimum", pass: c.gp_ytd >= g.minGPPerAccount, warn: c.gp_ytd >= g.minGPPerAccount * 0.8, detail: `${fmt(c.gp_ytd)} vs ${fmt(g.minGPPerAccount)} min` },
    { label: "Concentration within cap", pass: c.concentration < g.maxCustomerConcentration, warn: c.concentration >= g.maxCustomerConcentration * 0.8, detail: `${pct(c.concentration)} vs ${pct(g.maxCustomerConcentration)} cap` },
    { label: "Issue volume manageable", pass: c.openIssues <= 1, warn: c.openIssues <= 3, detail: `${c.openIssues} open issue${c.openIssues !== 1 ? "s" : ""}` },
  ];

  const handlePrint = () => window.print();
  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const tenureMonths = c.tenureStartDate ? Math.floor((new Date() - new Date(c.tenureStartDate)) / (1000 * 60 * 60 * 24 * 30)) : null;

  return (
    <div className="snapshot-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="snapshot-modal">
        <div className="snapshot-actions">
          <span className="snapshot-actions-label">Customer Snapshot · {month}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="snap-close-btn" onClick={onClose}>✕ Close</button>
            <button className="snap-print-btn" onClick={handlePrint}>⬇ Save as PDF</button>
          </div>
        </div>

        <div className="snapshot-body">
          {/* Header */}
          <div className="snap-header">
            <div>
              <div className="snap-co">{d.settings.companyName} — Confidential</div>
              <div className="snap-name">{c.name}</div>
              {(c.owners || []).length > 0 && (
                <div className="snap-owners">
                  Owners: {(c.owners || []).map(o => <span key={o} className="owner-tag">{o}</span>)}
                </div>
              )}
              <div className="snap-health" style={{ marginTop: 10 }}>
                <div className="snap-health-dot" style={{ background: healthColor }} />
                <span className="snap-health-label" style={{ color: healthColor }}>{traj.label} {traj.trajectoryArrow}</span>
                <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8, fontFamily: "DM Mono,monospace" }}>{traj.detail}</span>
              </div>
            </div>
            <div className="snap-date">
              <div>{month}</div>
              {tenureMonths && <div style={{ marginTop: 4 }}>{tenureMonths} months as customer</div>}
              <div style={{ marginTop: 4 }}>
                <span style={{ background: STRATEGY_COLORS[c.strategy] + "22", color: STRATEGY_COLORS[c.strategy], padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: "DM Mono,monospace" }}>{c.strategy.toUpperCase()}</span>
                {" "}
                <span style={{ background: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: "DM Mono,monospace" }}>TIER {c.tier}</span>
              </div>
            </div>
          </div>

          {/* Revenue & GP */}
          <div className="snap-section">
            <div className="snap-section-title">Revenue & Gross Profit</div>
            <div className="snap-grid">
              {[
                { label: "Revenue MTD", val: fmt(c.revenue_mtd) },
                { label: "Revenue QTD", val: fmt(c.revenue_qtd) },
                { label: "Revenue YTD", val: fmt(c.revenue_ytd) },
                { label: "GP$ MTD", val: fmt(c.gp_mtd), color: snapColor(c.gm, gmFloor) },
                { label: "GP$ QTD", val: fmt(c.gp_qtd), color: snapColor(c.gm, gmFloor) },
                { label: "GP$ YTD", val: fmt(c.gp_ytd), color: snapColor(c.gm, gmFloor) },
              ].map(t => (
                <div key={t.label} className="snap-tile">
                  <div className="snap-tile-label">{t.label}</div>
                  <div className={`snap-tile-val ${t.color || ""}`}>{t.val}</div>
                </div>
              ))}
            </div>
            <div className="snap-row">
              <span className="snap-row-label">GM% MTD</span>
              <span className={`snap-row-val ${snapColor(c.gm, gmFloor)}`}>{pct(c.gm)}</span>
            </div>
            <div className="snap-row">
              <span className="snap-row-label">GM% Floor</span>
              <span className="snap-row-val">{pct(gmFloor)}</span>
            </div>
            <div className="snap-row">
              <span className="snap-row-label">vs Floor</span>
              <span className={`snap-row-val ${c.gm >= gmFloor ? "snap-green" : "snap-red"}`}>
                {c.gm >= gmFloor ? "+" : ""}{(c.gm - gmFloor).toFixed(1)} pts
              </span>
            </div>
            <div className="snap-row">
              <span className="snap-row-label">Avg Order Size</span>
              <span className="snap-row-val">{fmt(c.avgOrderSize)}</span>
            </div>
          </div>

          {/* Health & Trajectory */}
          <div className="snap-section">
            <div className="snap-section-title">Health & Trajectory</div>
            <div className="snap-row">
              <span className="snap-row-label">Current Status</span>
              <span className="snap-row-val" style={{ color: healthColor }}>{traj.label}</span>
            </div>
            <div className="snap-row">
              <span className="snap-row-label">Direction</span>
              <span className={`snap-row-val ${traj.trajectory === "improving" ? "snap-green" : traj.trajectory === "deteriorating" ? "snap-red" : ""}`}>
                {traj.trajectory} {traj.trajectoryArrow}
              </span>
            </div>
            <div className="snap-row">
              <span className="snap-row-label">Consecutive Bad Months</span>
              <span className={`snap-row-val ${traj.consecutiveBad >= 2 ? "snap-red" : traj.consecutiveBad === 1 ? "snap-yellow" : "snap-green"}`}>{traj.consecutiveBad}</span>
            </div>
            <div className="snap-row">
              <span className="snap-row-label">Consecutive Good Months</span>
              <span className={`snap-row-val ${traj.consecutiveGood >= 2 ? "snap-green" : ""}`}>{traj.consecutiveGood}</span>
            </div>
            <div className="snap-row">
              <span className="snap-row-label">Operator Score</span>
              <span className="snap-row-val">{OPERATOR_LABELS[c.operatorScore] || c.operatorScore}</span>
            </div>
            <div className="snap-row">
              <span className="snap-row-label">Pay Cycle (avg days)</span>
              <span className={`snap-row-val ${c.payDays <= 35 ? "snap-green" : c.payDays <= 50 ? "snap-yellow" : "snap-red"}`}>{c.payDays} days</span>
            </div>
          </div>

          {/* A/R */}
          <div className="snap-section">
            <div className="snap-section-title">Accounts Receivable</div>
            <div className="snap-row">
              <span className="snap-row-label">Open A/R</span>
              <span className="snap-row-val">{fmt(c.arOpen)}</span>
            </div>
            <div className="snap-row">
              <span className="snap-row-label">Past Due A/R</span>
              <span className={`snap-row-val ${arColor(c.arPastDue)}`}>{c.arPastDue > 0 ? fmt(c.arPastDue) : "Current — none past due"}</span>
            </div>
          </div>

          {/* Guardrails */}
          <div className="snap-section">
            <div className="snap-section-title">Guardrail Status</div>
            {guardrailChecks.map((r, i) => {
              const s = r.pass ? "pass" : r.warn ? "warn" : "fail";
              return (
                <div key={i} className="snap-guardrail-row">
                  <span style={{ color: "#374151", fontSize: 12 }}>{r.label}</span>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "DM Mono,monospace" }}>{r.detail}</span>
                    <span className={`snap-guardrail-status ${s}`}>{r.pass ? "✓ PASS" : r.warn ? "! WATCH" : "✗ BREACH"}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Open Issues */}
          {issues.length > 0 && (
            <div className="snap-section">
              <div className="snap-section-title">Open Issues ({issues.length})</div>
              {issues.map(issue => (
                <div key={issue.id} className="snap-issue">
                  <span className="snap-issue-cat">{issue.category}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 2 }}>{issue.description}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "DM Mono,monospace" }}>
                      Owner: {issue.owner} · Open {issue.daysOpen}d · Exposure: {fmt(issue.exposure)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Monthly History */}
          {snapshots.length > 0 && (
            <div className="snap-section">
              <div className="snap-section-title">Monthly GM% History</div>
              <table className="snap-history-table">
                <thead>
                  <tr><th>Month</th><th>GM%</th><th>vs Floor</th><th>Past Due A/R</th><th>Issues</th><th>Health</th></tr>
                </thead>
                <tbody>
                  {[...snapshots].reverse().map((s, i) => {
                    const diff = s.gm - gmFloor;
                    const bad = snapshotIsBad(s, gmFloor);
                    const good = snapshotIsGood(s, gmFloor);
                    return (
                      <tr key={i}>
                        <td>{s.month}</td>
                        <td style={{ color: s.gm >= gmFloor ? "#059669" : "#dc2626", fontWeight: 700 }}>{pct(s.gm)}</td>
                        <td style={{ color: diff >= 0 ? "#059669" : "#dc2626" }}>{diff >= 0 ? "+" : ""}{diff.toFixed(1)}pts</td>
                        <td style={{ color: s.arPastDue > 0 ? "#dc2626" : "#6b7280" }}>{s.arPastDue > 0 ? fmt(s.arPastDue) : "—"}</td>
                        <td style={{ color: s.openIssues > 2 ? "#dc2626" : s.openIssues > 0 ? "#d97706" : "#6b7280" }}>{s.openIssues}</td>
                        <td style={{ fontWeight: 700, color: good ? "#059669" : bad ? "#dc2626" : "#d97706" }}>{good ? "GOOD" : bad ? "BAD" : "WATCH"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Override note if present */}
          {c.overrideNote && (
            <div className="snap-section">
              <div className="snap-section-title">Strategic Note</div>
              <div className="snap-note">{c.overrideNote}</div>
            </div>
          )}

          {/* Footer */}
          <div className="snap-footer">
            <span>{d.settings.companyName} · Internal Use Only · Confidential</span>
            <span>Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PIN SCREEN ──────────────────────────────────────────────────────────────
function PinScreen({ onUnlock }) {
  const [entry, setEntry] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const dotsRef = useRef(null);

  const press = (digit) => {
    if (entry.length >= 4) return;
    const next = entry + digit;
    setEntry(next);
    setError("");
    if (next.length === 4) {
      setTimeout(() => {
        if (next === APP_PIN) {
          try { sessionStorage.setItem(PIN_SESSION_KEY, "1"); } catch {}
          onUnlock();
        } else {
          setShake(true);
          setError("Incorrect PIN");
          setTimeout(() => { setEntry(""); setShake(false); }, 600);
        }
      }, 120);
    }
  };

  const del = () => { setEntry(e => e.slice(0, -1)); setError(""); };

  const keys = ["1","2","3","4","5","6","7","8","9"];

  return (
    <div className="pin-screen">
      <div className="pin-brand">
        <img src="data:image/png;base64,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" alt="Nutriience" style={{ height: 52, width: "auto", objectFit: "contain" }} />
        <div>
          <div className="pin-brand-name" style={{ color: "#1878a8" }}>Nutriience</div>
          <div className="pin-brand-name" style={{ fontSize: 16, fontWeight: 600, color: "#e8f0fb" }}>Command</div>
          <div className="pin-brand-sub">Decision Cockpit</div>
        </div>
      </div>
      <div className="pin-label">Enter PIN to continue</div>
      <div className={`pin-dots ${shake ? "shake" : ""}`}>
        {[0,1,2,3].map(i => (
          <div key={i} className={`pin-dot ${entry.length > i ? (error ? "error" : "filled") : ""}`} />
        ))}
      </div>
      <div className="pin-pad">
        {keys.map(k => <button key={k} className="pin-key" onClick={() => press(k)}>{k}</button>)}
        <div />
        <button className="pin-key zero" onClick={() => press("0")}>0</button>
        <button className="pin-key del" onClick={del}>⌫</button>
      </div>
      <div className="pin-error">{error}</div>
      <div className="pin-hint">Default PIN: 1234 — change APP_PIN in code before deploying</div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "home", label: "Command" },
  { id: "financials", label: "Flash Financials" },
  { id: "customers", label: "Customers" },
  { id: "manufacturers", label: "Manufacturers" },
  { id: "pipeline", label: "Pipeline" },
  { id: "cash", label: "Cash Command" },
  { id: "guardrails", label: "Guardrails" },
  { id: "deal", label: "Deal Evaluator" },
  { id: "leaks", label: "Margin Leaks" },
  { id: "distribution", label: "Distribution" },
  { id: "issues", label: "Issue Tracker" },
  { id: "changed", label: "What Changed" },
  { id: "review", label: "📋 Monthly Review" },
];

export default function App() {
  const [tab, setTab] = useState("home");
  const [data, setData] = useState(DEFAULT_DATA);
  const [admin, setAdmin] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem(PIN_SESSION_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    loadData().then(saved => {
      if (saved) setData(saved);
      setLoaded(true);
    });
  }, []);

  const handleSave = useCallback((newData) => {
    const withSnapshots = writeMonthlySnapshots(newData);
    setData(withSnapshots);
    saveData(withSnapshots);
  }, []);

  const handleExport = () => {
    try {
      const exportPayload = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        appName: "Nutriience Command",
        data,
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `nutriience-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed. Please try again.");
    }
  };

  const handleRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const restored = parsed.data || parsed;
        if (!restored.settings || !restored.customers) {
          alert("Invalid backup file. Make sure you are using a Nutriience Command backup.");
          return;
        }
        if (window.confirm("This will replace all current app data with the backup. Continue?")) {
          handleSave(restored);
          setRestoreOpen(false);
          alert("Backup restored successfully.");
        }
      } catch {
        alert("Could not read backup file. Make sure it is a valid Nutriience Command JSON backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── PWA manifest + iOS meta tags ─────────────────────────────────────────
  useEffect(() => {
    document.title = "Nutriience Command";
    const setMeta = (name, content, prop = "name") => {
      let el = document.querySelector(`meta[${prop}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(prop, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("theme-color", "#1e3a5f");
    setMeta("apple-mobile-web-app-capable", "yes");
    setMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    setMeta("apple-mobile-web-app-title", "Nutriience");
    setMeta("mobile-web-app-capable", "yes");
    setMeta("application-name", "Nutriience Command");

    // Web app manifest -- enables proper PWA install on Chrome + Safari
    const existing = document.querySelector('link[rel="manifest"]');
    if (!existing) {
      const manifest = {
        name: "Nutriience Command",
        short_name: "Nutriience",
        description: "Decision Cockpit",
        start_url: "./",
        display: "standalone",
        background_color: "#f0f4fa",
        theme_color: "#1878a8",
        orientation: "any",
        icons: [
          { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' fill='%231878a8' rx='38'/%3E%3Ctext x='96' y='130' font-size='100' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold'%3EN%3C/text%3E%3C/svg%3E", sizes: "192x192", type: "image/svg+xml" },
          { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' fill='%231878a8' rx='100'/%3E%3Ctext x='256' y='350' font-size='280' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold'%3EN%3C/text%3E%3C/svg%3E", sizes: "512x512", type: "image/svg+xml" }
        ]
      };
      const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = url;
      document.head.appendChild(link);
    }
  }, []);


  if (!unlocked) return (
    <>
      <style>{CSS}</style>
      <PinScreen onUnlock={() => setUnlocked(true)} />
    </>
  );

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)", color: "var(--text3)", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
      Loading Nutriience Command...
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="header">
          <div className="brand">
            <img src="data:image/png;base64,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" alt="Nutriience" style={{ height: 36, width: "auto", objectFit: "contain" }} />
            <div><div className="brand-name" style={{ color: "#7ed4f7", letterSpacing: "0.5px" }}>Nutriience</div><div className="brand-name" style={{ color: "#c8e0f4", fontSize: 12, fontWeight: 600, letterSpacing: "1px" }}>Command</div><div className="brand-sub">Decision Cockpit · {data.settings.employees} FTE</div></div>
          </div>
          <div className="header-right">
            <div className="last-updated">Updated {new Date(data.meta.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            <button className="admin-toggle" onClick={() => setPdfOpen(true)}>📑 PDF Report</button>
            <button className="admin-toggle" onClick={() => setCsvOpen(true)}>⬆ Import CSV</button>
            <button className="admin-toggle" onClick={handleExport} title="Download full backup to your Mac">⬇ Backup</button>
            <label className="admin-toggle" style={{ cursor: "pointer" }} title="Restore from a previous backup file">
              ↩ Restore
              <input type="file" accept=".json" style={{ display: "none" }} onChange={handleRestore} />
            </label>
            <button className={`admin-toggle ${admin ? "active" : ""}`} onClick={() => setAdmin(a => !a)}>⚙ Update Data</button>
          </div>
        </header>
        <nav className="nav">{TABS.map(t => <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</nav>
        <main className="main">
          {tab === "home" && <HomeScreen d={data} onStartReview={() => setTab("review")} />}
          {tab === "financials" && <FlashFinancials d={data} />}
          {tab === "customers" && <CustomerScoreboard d={data} onSave={handleSave} />}
          {tab === "manufacturers" && <ManufacturerTab d={data} onSave={handleSave} />}
          {tab === "pipeline" && <PipelineTracker d={data} onSave={handleSave} />}
          {tab === "cash" && <CashCommand d={data} />}
          {tab === "guardrails" && <GuardrailsTab d={data} />}
          {tab === "deal" && <DealEvaluator d={data} />}
          {tab === "leaks" && <MarginLeak d={data} />}
          {tab === "distribution" && <DistributionSnapshot d={data} />}
          {tab === "issues" && <IssueTracker d={data} onUpdate={handleSave} />}
          {tab === "changed" && <WhatChanged d={data} />}
          {tab === "review" && <ScoringWorkflow d={data} onSave={handleSave} onClose={() => setTab("home")} />}
        </main>
        {admin && <AdminPanel d={data} onSave={(nd) => { handleSave(nd); }} onClose={() => setAdmin(false)} />}
        {csvOpen && <CSVImporter d={data} onSave={handleSave} onClose={() => setCsvOpen(false)} />}
        {pdfOpen && <PDFImporter d={data} onSave={handleSave} onClose={() => setPdfOpen(false)} />}
      </div>
    </>
  );
}
