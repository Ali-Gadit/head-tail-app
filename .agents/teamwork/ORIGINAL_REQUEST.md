# Original User Request

## 2026-09-29T20:29:06Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Standard Full Team

Review all React Native screens in the `head-tail-app` codebase and generate a report of all responsiveness issues, focusing on hardcoded absolute dimensions that cause clipping on different mobile screen sizes. Do not implement the fixes; just audit and report.

Working directory: C:\MyGames\head-tail-app
Integrity mode: development

## Requirements

### R1. Codebase Audit
Analyze all UI components (e.g. `App.tsx` and files in `src/components/`) to identify hardcoded absolute pixel values (widths, heights, margins, paddings, fixed positions) that break on smaller or larger screens. 

### R2. Responsive Alternatives
For every identified issue, propose a React Native flexbox or percentage-based alternative that preserves the exact current visual design and proportions, just scaling it dynamically.

### R3. Generate Report
Do NOT modify any source files. Instead, create a comprehensive Markdown artifact (`responsiveness_report.md`) detailing the specific files, line numbers, the problematic code, and the exact replacement code to fix it.

## Acceptance Criteria

### Audit Completeness
- [ ] The report identifies at least the major top-level components (like RevealView, GameRoom, App, Matchmaking) and highlights their rigid constraints.

### Non-Destructive
- [ ] No `.tsx` or source files in the codebase are modified during this task.

### Actionable Replacements
- [ ] Every proposed fix in the report uses percentage strings (e.g., `'100%'`) or `flex` properties rather than fixed pixel counts.

---
*Next: when approved → delegate via invoke_subagent (see Delegation Protocol)*

## 2026-09-29T20:57:26Z

The system was restarted and you were halted while synthesizing the responsiveness_report.md artifact. Please wake up and resume synthesizing the report based on the findings from the 3 explorers. Finish the markdown file and finalize the task!
