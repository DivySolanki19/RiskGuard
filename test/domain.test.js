import test from "node:test";
import assert from "node:assert/strict";
test("Residual midpoint rounds up without subtraction precision loss", () => {
  assert.equal(residual({likelihood:3,impact:5,effectiveness:55}),6.8);
});
import { risks } from "../public/data.js";
import {
  validRisk,
  validDate,
  inherent,
  residual,
  severity,
  overdue,
  heatmap,
  summary,
} from "../public/domain.js";
test("All synthetic risks pass validation", () =>
  assert.ok(risks.every(validRisk)));
test("Inherent and residual scoring keep completion separate", () => {
  const x = { likelihood: 4, impact: 5, effectiveness: 35, progress: 100 };
  assert.equal(inherent(x), 20);
  assert.equal(residual(x), 13);
  assert.equal(residual({ ...x, effectiveness: 0 }), 20);
  assert.equal(residual({ ...x, effectiveness: 100 }), 0);
});
test("Severity boundaries are explicit", () => {
  assert.equal(severity(6), "Low");
  assert.equal(severity(7), "Medium");
  assert.equal(severity(14), "Medium");
  assert.equal(severity(15), "High");
});
test("Due today is not overdue and closed risks are excluded", () => {
  const x = { due: "2026-11-14", status: "Open" };
  assert.equal(overdue(x, "2026-11-14"), false);
  assert.equal(overdue(x, "2026-11-15"), true);
  assert.equal(overdue({ ...x, status: "Closed" }, "2026-11-15"), false);
});
test("Heatmap places every record in exactly one of 25 cells", () => {
  const map = heatmap(risks);
  assert.equal(map.length, 25);
  assert.equal(
    map.reduce((sum, c) => sum + c.count, 0),
    risks.length,
  );
  assert.equal(map.find((c) => c.likelihood === 4 && c.impact === 5).count, 1);
});
test("Schema rejects score bounds, incomplete closure and invalid dates", () => {
  for (const patch of [
    { likelihood: 0 },
    { impact: 6 },
    { effectiveness: 101 },
    { progress: -1 },
    { status: "Closed", progress: 99 },
    { due: "2026-02-30" },
    { title: " " },
    { mitigation: "" },
  ])
    assert.equal(validRisk({ ...risks[0], ...patch }), false);
  assert.equal(validDate("2024-02-29"), true);
  assert.equal(validDate("2025-02-29"), false);
});
test("Summary excludes closed risks from active totals and handles empty data", () => {
  const s = summary(risks, "2026-11-14");
  assert.equal(s.active, 8);
  assert.equal(s.high, 3);
  assert.equal(s.overdue, 2);
  assert.deepEqual(summary([], "2026-11-14"), {
    active: 0,
    high: 0,
    residual: 0,
    overdue: 0,
  });
});
