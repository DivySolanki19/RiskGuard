import { bounded, validText } from "./common.js";
export const categories = [
  "Operational",
  "Financial",
  "Technology",
  "Compliance",
  "Strategic",
];
export const statuses = ["Open", "In progress", "Closed"];
export function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validRisk(x) {
  return (
    x &&
    validText(x.id, 50) &&
    validText(x.title, 140) &&
    validText(x.owner, 80) &&
    validText(x.mitigation, 1000) &&
    categories.includes(x.category) &&
    statuses.includes(x.status) &&
    ["likelihood", "impact"].every(
      (k) => Number.isInteger(x[k]) && bounded(x[k], 1, 5),
    ) &&
    ["effectiveness", "progress"].every((k) => bounded(x[k], 0, 100)) &&
    validDate(x.due) &&
    (x.status !== "Closed" || x.progress === 100)
  );
}
export const inherent = (x) => x.likelihood * x.impact;
export const residual = (x) =>
  Math.round((inherent(x) * (100 - x.effectiveness)) / 10) / 10;
export const severity = (score) =>
  score >= 15 ? "High" : score >= 7 ? "Medium" : "Low";
export const overdue = (x, today) => x.status !== "Closed" && x.due < today;
export function heatmap(rows) {
  return Array.from({ length: 25 }, (_, i) => {
    const likelihood = 5 - Math.floor(i / 5),
      impact = (i % 5) + 1;
    return {
      likelihood,
      impact,
      count: rows.filter(
        (x) => x.likelihood === likelihood && x.impact === impact,
      ).length,
    };
  });
}
export function summary(rows, today) {
  return {
    active: rows.filter((x) => x.status !== "Closed").length,
    high: rows.filter(
      (x) => x.status !== "Closed" && severity(inherent(x)) === "High",
    ).length,
    residual: rows.length
      ? rows.reduce((s, x) => s + residual(x), 0) / rows.length
      : 0,
    overdue: rows.filter((x) => overdue(x, today)).length,
  };
}
