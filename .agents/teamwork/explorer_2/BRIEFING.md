# BRIEFING — 2026-09-29T20:36:00Z

## Mission
Audit RevealView, GameRoom, and associated game components in src/components/ for hardcoded absolute dimensions and propose responsive replacements.

## 🔒 My Identity
- Archetype: explorer
- Roles: Explorer 2 (Core Game Screens Audit: RevealView & GameRoom)
- Working directory: C:\MyGames\head-tail-app\.agents\teamwork\explorer_2
- Original parent: e85ea61a-006d-4799-9d9e-88da8a3d4aff
- Milestone: Core Game Screens Responsiveness Audit

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strictly NON-DESTRUCTIVE: Do NOT modify any .tsx or source files
- Provide exact line numbers, code snippets, breakage explanation, and exact responsive replacement code

## Current Parent
- Conversation ID: e85ea61a-006d-4799-9d9e-88da8a3d4aff
- Updated: not yet

## Investigation State
- **Explored paths**: `src/components/GameRoom.tsx`, `src/components/RevealView.tsx`, `src/components/HandSelector.tsx`, `src/components/Scoreboard.tsx`, `src/components/InviteFriends.tsx`
- **Key findings**: 
  - Casual Matchmaking UI assumes landscape and sets `minWidth: 185` on both player cards, crashing horizontally on standard portrait phones ($538\text{px} > 360\text{px}$).
  - Host Waiting Lobby exceeds 830px vertically with no `<ScrollView>`, causing the "Start Match" button to be pushed off-screen.
  - Toss Call and Toss Throw render Scoreboard at `absolute top-0` with insufficient `mt-20` (80px), colliding with header text.
  - Toss Call coin buttons are fixed `128x128px` inside 160px padding, overflowing horizontally on 360px screens ($256\text{px} > 200\text{px}$).
  - HandSelector buttons are fixed `80x96px`, breaking 3-across wrapping inside padded containers.
  - RevealView has fixed `h-24` container for 154px of result elements, rigid 96px animated coin, and 60% container width that crushes player choice boxes.
  - Select Roles lacks `<ScrollView>` for squad sizes > 3 wickets, hiding lower players.
  - Floating controls (`top-0`) collide with hardware notches and top-right scoreboard info.
- **Unexplored areas**: None in Core Game Screens.

## Key Decisions Made
- Fully documented all 16 responsiveness issues with exact line numbers, breakage mechanics, and drop-in percentage/flexbox replacement code preserving exact styling.

## Artifact Index
- C:\MyGames\head-tail-app\.agents\teamwork\explorer_2\handoff.md — Comprehensive audit report
