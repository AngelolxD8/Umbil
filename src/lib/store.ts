// src/lib/store.ts
export type CPDEntry = {
  timestamp: string;
  question: string;
  answer: string;
  reflection?: string;
  tags?: string[];
};

export type PDPGoal = {
  id: string;
  title: string;
  timeline: string;
  activities: string[];
};

const isBrowser = typeof window !== "undefined";

export function getCPD(): CPDEntry[] {
  if (!isBrowser) return [];
  return JSON.parse(localStorage.getItem("cpd_log") || "[]");
}

export function saveCPD(list: CPDEntry[]) {
  if (!isBrowser) return;
  localStorage.setItem("cpd_log", JSON.stringify(list));
}

export function addCPD(entry: CPDEntry) {
  const list = getCPD();
  list.unshift(entry);
  saveCPD(list);
}

export function getPDP(): PDPGoal[] {
  if (!isBrowser) return [];
  return JSON.parse(localStorage.getItem("pdp_goals") || "[]");
}

export function savePDP(list: PDPGoal[]) {
  if (!isBrowser) return;
  localStorage.setItem("pdp_goals", JSON.stringify(list));
}

export function clearAll() {
  if (!isBrowser) return;
  localStorage.removeItem("cpd_log");
  localStorage.removeItem("pdp_goals");
}
