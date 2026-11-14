# Interview preparation: RiskGuard

## A concise demonstration

Select the likelihood 4 / impact 5 heatmap cell. Edit the supplier interruption risk, adjust effectiveness to 50% and observe residual exposure of 10. Try closing with incomplete progress to see the validation rule.

Explain the problem, demonstrate a decision-changing input, trace it to a pure domain function, and show a test for its boundary behaviour. Describe the AI assistance honestly and explain what you have personally reviewed or extended.

## Questions to practise

### Why separate progress from effectiveness?

Completing an action does not prove it works. A control can be fully implemented yet only reduce exposure by 30%; evidence should support the effectiveness estimate.

### Explain residual risk.

A likelihood of 4 and impact of 5 gives inherent score 20. An assessed 35% reduction gives 13. This is an ordinal prioritisation model, not a quantified financial loss.

### Why retain closed risks?

They support review and learning. The demo excludes them from active and overdue counts while keeping them available through filters and exports.

### What would production governance require?

Role-based access, immutable audit events, evidence attachments, approval workflows, review dates, and clear ownership of scoring definitions.

### How did you handle unreliable browser storage?

Reads are parsed and validated; failures return a cloned demo dataset with a warning. Writes return a success flag. The user is told when edits are temporary. A future backend would replace the storage adapter and add conflict detection.

### How did you make charts accessible?

Interactive marks use native buttons with descriptive names. Tables or textual values expose the data, and meaning is not conveyed only through colour. Filters use labelled native controls. Formal assistive-technology testing remains a separate activity.

### What did testing establish?

Unit tests exercise business examples and edge cases such as zero demand, threshold boundaries or declining forecasts, as applicable. They also cover corrupt storage and formula-safe exports. Explain the difference between those guarantees and browser or production validation.

## Practical extension exercise

Add one stakeholder-driven feature with an acceptance example, implement it at the correct boundary and add a regression test. Good options are forecast backtesting, supplier delivery-date tracking or a risk review history. Avoid inventing impact metrics or client results; use measured test outcomes from your own work.
