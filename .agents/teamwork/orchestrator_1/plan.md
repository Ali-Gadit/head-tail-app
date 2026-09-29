# Plan: Head-Tail-App Responsiveness Audit

## Objective
Audit all React Native screens and UI components in `head-tail-app` for hardcoded absolute dimensions and generate `C:\MyGames\head-tail-app\responsiveness_report.md` with flexbox/percentage-based replacement code. Strictly non-destructive (no modification to source files).

## Phases & Milestones

### Phase 1: Exploration & Audit (Parallel Survey)
Dispatch 3 Explorers across UI component groups to thoroughly inspect all `.tsx` UI components:
- **Explorer 1 (Scope A)**: `App.tsx`, Root Layout, Navigation, top-level containers, and global styles.
- **Explorer 2 (Scope B)**: `GameRoom.tsx`, `RevealView.tsx`, game controls, animations, and coin flip views.
- **Explorer 3 (Scope C)**: `Matchmaking.tsx`, modals, scoreboards, status banners, and other components in `src/components/`.

Each Explorer will catalog:
- Exact file paths & line numbers of rigid absolute dimensions (width, height, margin, padding, top/bottom/left/right, borderRadius where relevant).
- Breakage conditions on smaller/larger viewports (clipping, overflow, awkward spacing).
- Exact React Native flexbox or percentage replacement code preserving visual layout and proportions.

### Phase 2: Synthesis & Report Generation
- Dispatch Worker (`teamwork_preview_worker`) to synthesize all Explorer findings into `C:\MyGames\head-tail-app\responsiveness_report.md`.
- Ensure report structure is comprehensive, structured with clear sections:
  1. Executive Summary & Impact Analysis
  2. Component-by-Component Responsiveness Audit (App, RevealView, GameRoom, Matchmaking, and all components)
  3. Problematic Code vs. Exact Responsive Replacements (File, Line numbers, Current rigid code, Proposed flex/percentage code, Rationale)
  4. Best Practices Guide for React Native Dynamic Layouts in this codebase.
- Verify NO source files are touched.

### Phase 3: Review & Forensic Audit Gate
- Dispatch 2 Reviewers (`teamwork_preview_reviewer`) to independently review `responsiveness_report.md`:
  - Reviewer 1: Checks coverage completeness against all `.tsx` components and verifies that every proposed fix uses percentage strings (e.g. `'100%'`) or flex properties rather than fixed pixels.
  - Reviewer 2: Verifies visual fidelity of proposed flexbox layouts and validates that no source files were modified.
- Dispatch 1 Forensic Auditor (`teamwork_preview_auditor`):
  - Confirms non-destructive compliance via git diff / status (zero changes to source code).
  - Verifies integrity of audit findings and absence of dummy/facade data.

### Phase 4: Final Gate & Sentinel Reporting
- Gate check: Reviewers APPROVE + Auditor CLEAN.
- Send completion message to Sentinel with executive summary and report reference.
