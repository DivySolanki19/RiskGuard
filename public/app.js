import { risks } from "./data.js";
import {
  categories,
  statuses,
  validRisk,
  inherent,
  residual,
  severity,
  overdue,
  heatmap,
  summary,
} from "./domain.js";
import {
  number,
  escapeHTML as e,
  stat,
  readStore,
  saveStore,
  announce,
  download,
  openEditor,
  confirmAction,
} from "./common.js";
const KEY = "riskguard.register.v1";
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
let loaded;
try {
  loaded = readStore(KEY, risks, validRisk);
} catch {
  loaded = {
    data: structuredClone(risks),
    warning:
      "Browser storage is unavailable. Changes will last for this session only.",
  };
}
let items = loaded.data,
  cell = null;
const filters = {
  search: "",
  category: "All categories",
  status: "All statuses",
};
document.querySelector("#app").innerHTML =
  `<section class="hero" id="overview"><div><div class="eyebrow">Risk management workspace</div><h1>Turn exposure into action.</h1><p>A shared view of what matters, who owns it and what happens next.</p></div><div class="actions"><button id="export">↓ Export CSV</button><button id="print">Print report</button><button id="add" class="primary">+ Add risk</button></div></section><section class="toolbar" aria-label="Risk filters"><label>Search register<input id="search" type="search" placeholder="Title, owner or risk ID"></label><label>Category<select id="category"><option>All categories</option>${categories.map((x) => `<option>${x}</option>`).join("")}</select></label><label>Status<select id="risk-status"><option>All statuses</option>${statuses.map((x) => `<option>${x}</option>`).join("")}</select></label></section><p class="print-only">Report date: ${today}. Synthetic demo data. Export reflects current filters.</p><div id="results"></div>`;
const filtered = () =>
  items.filter(
    (x) =>
      (x.title + " " + x.owner + " " + x.id)
        .toLowerCase()
        .includes(filters.search.toLowerCase()) &&
      (filters.category === "All categories" ||
        x.category === filters.category) &&
      (filters.status === "All statuses" || x.status === filters.status),
  );
const visible = () =>
  filtered()
    .filter(
      (x) =>
        !cell || (x.likelihood === cell.likelihood && x.impact === cell.impact),
    )
    .sort((a, b) => inherent(b) - inherent(a) || a.id.localeCompare(b.id));
function persist(message) {
  let ok = false;
  try {
    ok = saveStore(KEY, items);
  } catch {}
  announce(
    message +
      (ok
        ? " Saved in this browser."
        : " Storage unavailable: changes are temporary. Export a report before closing."),
  );
  render();
}
function render() {
  const base = filtered(),
    rows = visible(),
    s = summary(base, today),
    map = heatmap(base);
  document.querySelector("#results").innerHTML =
    `<section class="stats" aria-label="Filtered risk indicators">${stat("Active risks", String(s.active), "Open and in-progress risks")}${stat("High inherent risks", String(s.high), "Active risks with score ≥ 15")}${stat("Average residual score", number(s.residual) + " / 25", "All filtered risks, including closed")}${stat("Overdue mitigations", String(s.overdue), "Incomplete risks due before " + today)}</section><div class="grid"><section class="panel" id="heatmap"><div class="panel-head"><div><h2>Risk exposure map</h2><span class="muted">Inherent risk · Select a cell to filter the register</span></div><button id="clear-cell" class="link">Clear selection</button></div><div class="muted">Likelihood ↑ · Impact →</div><div class="heatmap" role="group" aria-label="Likelihood by impact risk heatmap">${[
      5, 4, 3, 2, 1,
    ]
      .map(
        (l) =>
          `<span class="axis">${l}</span>${map
            .filter((c) => c.likelihood === l)
            .map(
              (c) =>
                `<button class="heat-cell ${severity(l * c.impact).toLowerCase()}" data-l="${l}" data-i="${c.impact}" aria-pressed="${Boolean(cell && cell.likelihood === l && cell.impact === c.impact)}" aria-label="Likelihood ${l}, impact ${c.impact}, ${severity(l * c.impact)} risk: ${c.count} risks">${c.count || "–"}</button>`,
            )
            .join("")}`,
      )
      .join(
        "",
      )}<span></span>${[1, 2, 3, 4, 5].map((i) => `<span class="axis">${i}</span>`).join("")}</div><div class="legend"><span class="badge low">Low 1–6</span><span class="badge medium">Medium 7–14</span><span class="badge high">High 15–25</span></div><p class="subtext">Counts follow search, category and status filters. Cell selection affects the register and exports, not these summary cards.</p></section><section class="panel"><div class="panel-head"><div><h2>Mitigation priorities</h2><span class="muted">Top active residual exposures in the filtered set</span></div></div>${
      base
        .filter((x) => x.status !== "Closed")
        .sort((a, b) => residual(b) - residual(a))
        .slice(0, 4)
        .map(
          (x) =>
            `<div class="forecast-row"><span>${e(x.title)}<small class="muted" style="display:block">${e(x.owner)} · Due ${x.due}</small><span class="progress" aria-label="${x.progress}% complete"><span style="width:${x.progress}%"></span></span><small class="muted">${x.progress}% complete</small></span><strong>${number(residual(x))}<small class="muted" style="display:block">residual</small></strong></div>`,
        )
        .join("") || '<p class="empty">No active risks in this view.</p>'
    }</section></div><section class="panel" id="register"><div class="panel-head"><div><h2>Risk register</h2><span class="muted">${rows.length} risks · ${cell ? "Likelihood " + cell.likelihood + ", impact " + cell.impact : "All heatmap cells"} · Highest inherent score first</span></div></div><div class="table-wrap"><table><caption class="muted">Risk ownership, scoring and mitigation tracking</caption><thead><tr><th>Risk / owner</th><th>Category</th><th>L × I</th><th>Inherent</th><th>Residual</th><th>Mitigation / due</th><th>Status</th><th>Manage</th></tr></thead><tbody>${rows.map((x) => `<tr><td><strong>${e(x.title)}</strong><small>${e(x.id)} · ${e(x.owner)}</small></td><td>${x.category}</td><td>${x.likelihood} × ${x.impact}</td><td><span class="badge ${severity(inherent(x)).toLowerCase()}">${inherent(x)} · ${severity(inherent(x))}</span></td><td><strong>${number(residual(x))}</strong><small>${x.effectiveness}% effective</small></td><td><details><summary>${x.progress}% complete</summary><p>${e(x.mitigation)}</p></details><small class="${overdue(x, today) ? "bad" : ""}">${overdue(x, today) ? "Overdue · " : ""}${x.due}</small></td><td>${x.status}</td><td><button class="link" data-edit="${e(x.id)}" aria-label="Edit ${e(x.title)}">Edit</button> <button class="link danger" data-delete="${e(x.id)}" aria-label="Delete ${e(x.title)}">Delete</button></td></tr>`).join("") || '<tr><td colspan="8" class="empty">No risks match this view. Clear the heatmap selection or adjust your filters.</td></tr>'}</tbody></table></div></section><section class="panel"><details><summary>Scoring methodology & limitations</summary><p>Likelihood: 1 rare, 2 unlikely, 3 possible, 4 likely, 5 almost certain. Impact: 1 negligible, 2 minor, 3 moderate, 4 major, 5 severe. Inherent score = likelihood × impact. Residual score = inherent × (1 − control effectiveness ÷ 100), rounded to one decimal place.</p><p>Effectiveness is an assessed reduction, separate from mitigation completion. A completed action need not remove all risk. Closed records must have 100% progress and remain available for reporting. Ordinal scores help prioritisation; they are not probabilities, expected losses or regulatory assessments.</p></details></section><div class="actions"><button id="reset">Restore demo register</button></div>`;
  document.querySelectorAll(".heat-cell").forEach(
    (b) =>
      (b.onclick = () => {
        cell = { likelihood: Number(b.dataset.l), impact: Number(b.dataset.i) };
        render();
        document
          .querySelector(
            `[data-l="${cell.likelihood}"][data-i="${cell.impact}"]`,
          )
          .focus();
        announce(
          "Register filtered to likelihood " +
            cell.likelihood +
            ", impact " +
            cell.impact +
            ".",
        );
      }),
  );
  document.querySelector("#clear-cell").onclick = () => {
    cell = null;
    render();
    document.querySelector("#clear-cell").focus();
    announce("Heatmap selection cleared.");
  };
  document
    .querySelectorAll("[data-edit]")
    .forEach((b) => (b.onclick = () => edit(b.dataset.edit)));
  document.querySelectorAll("[data-delete]").forEach(
    (b) =>
      (b.onclick = () => {
        const x = items.find((r) => r.id === b.dataset.delete);
        confirmAction("Delete " + x.id + " from this browser?", () => {
          items = items.filter((r) => r.id !== x.id);
          persist("Risk deleted.");
        });
      }),
  );
  document.querySelector("#reset").onclick = () => {
    confirmAction("Replace your risk edits with the original demo register?", () => {
      items = structuredClone(risks);
      cell = null;
      persist("Demo register restored.");
    });
  };
}
function edit(id) {
  const existing = items.find((x) => x.id === id),
    x = existing || {
      id: "R-" + crypto.randomUUID().slice(0, 8),
      title: "",
      category: "Operational",
      owner: "",
      likelihood: 3,
      impact: 3,
      effectiveness: 0,
      progress: 0,
      status: "Open",
      due: today,
      mitigation: "",
    };
  const select = (name, label, options) =>
    `<label>${label}<select name="${name}">${options.map((v) => `<option ${v === x[name] ? "selected" : ""}>${v}</option>`).join("")}</select></label>`;
  openEditor(
    `<h2 id="editor-title">${existing ? "Edit risk" : "Add risk"}</h2><form><div class="form-grid"><label class="span-all">Risk title<input name="title" value="${e(x.title)}" required maxlength="140"></label><label>Owner (role)<input name="owner" value="${e(x.owner)}" required maxlength="80"></label>${select("category", "Category", categories)}${select("likelihood", "Likelihood · 1 rare to 5 almost certain", [1, 2, 3, 4, 5])}${select("impact", "Impact · 1 negligible to 5 severe", [1, 2, 3, 4, 5])}<label>Control effectiveness (%)<input name="effectiveness" type="number" min="0" max="100" required value="${x.effectiveness}"></label><label>Mitigation completion (%)<input name="progress" type="number" min="0" max="100" required value="${x.progress}"></label>${select("status", "Status", statuses)}<label>Mitigation due date<input name="due" type="date" required value="${x.due}"></label><label class="span-all">Mitigation plan<textarea name="mitigation" required maxlength="1000">${e(x.mitigation)}</textarea></label></div><p class="muted">Closed risks require 100% mitigation completion. Effectiveness remains an independent assessment.</p><p class="form-error" role="alert"></p><div class="actions"><button type="button" data-cancel>Cancel</button><button class="primary" type="submit">Save risk</button></div></form>`,
    (form) => {
      const next = {
        ...form,
        id: x.id,
        title: form.title.trim(),
        owner: form.owner.trim(),
        mitigation: form.mitigation.trim(),
        likelihood: Number(form.likelihood),
        impact: Number(form.impact),
        effectiveness: Number(form.effectiveness),
        progress: Number(form.progress),
      };
      if (next.status === "Closed" && next.progress !== 100)
        throw Error(
          "Set mitigation completion to 100% before closing this risk.",
        );
      if (!validRisk(next))
        throw Error("Check the required fields, date and score ranges.");
      items = existing
        ? items.map((r) => (r.id === id ? next : r))
        : [...items, next];
      persist("Risk register updated.");
    },
  );
}
document.querySelector("#add").onclick = () => edit();
document.querySelector("#search").oninput = (event) => {
  filters.search = event.target.value;
  cell = null;
  render();
};
document.querySelector("#category").onchange = (event) => {
  filters.category = event.target.value;
  cell = null;
  render();
};
document.querySelector("#risk-status").onchange = (event) => {
  filters.status = event.target.value;
  cell = null;
  render();
};
document.querySelector("#export").onclick = () => {
  download("riskguard-register-" + today + ".csv", [
    [
      "ID",
      "Title",
      "Category",
      "Owner",
      "Likelihood",
      "Impact",
      "Inherent score",
      "Control effectiveness %",
      "Residual score",
      "Mitigation",
      "Progress %",
      "Status",
      "Due date",
      "Overdue",
      "Report date",
    ],
    ...visible().map((x) => [
      x.id,
      x.title,
      x.category,
      x.owner,
      x.likelihood,
      x.impact,
      inherent(x),
      x.effectiveness,
      residual(x),
      x.mitigation,
      x.progress,
      x.status,
      x.due,
      overdue(x, today) ? "Yes" : "No",
      today,
    ]),
  ]);
  announce("Exported " + visible().length + " risks with current filters.");
};
// Include mitigation details in printed reports, then restore the user's view.
let printDetails = [];
window.addEventListener("beforeprint", () => {
  printDetails = [...document.querySelectorAll("details")].map(element => ({element, open:element.open}));
  printDetails.forEach(({element}) => { element.open = true; });
});
window.addEventListener("afterprint", () => {
  printDetails.forEach(({element, open}) => { element.open = open; });
  printDetails = [];
});
document.querySelector("#print").onclick = () => window.print();
render();
if (loaded.warning) announce(loaded.warning);
