# DISPATCH: Explorer 2 (Core Game Screens Audit: RevealView & GameRoom)

## Working Directory
`C:\MyGames\head-tail-app\.agents\teamwork\explorer_2`

## Authoritative Request
`C:\MyGames\head-tail-app\.agents\teamwork\ORIGINAL_REQUEST.md`

## Mission
Audit `GameRoom.tsx`, `RevealView.tsx`, coin animation containers, scorecards, round result views, and game controls under `src/components/` for responsiveness issues.

## Requirements
1. Identify all hardcoded absolute dimensions (width, height, margin, padding, fixed positioning `top`/`bottom`/`left`/`right`, rigid coin or card sizes) that cause clipping, overlapping, or bad scaling on small/large devices.
2. For EVERY identified issue, provide:
   - File path
   - Exact line number(s)
   - Problematic code snippet
   - Breakage explanation (e.g. coin clipping off-screen, fixed height cutting off on short screens)
   - Exact responsive replacement code using percentage strings (e.g. `'100%'`, `'50%'`) or flexbox properties (e.g. `flex: 1`, `aspectRatio`, `alignSelf`, `flexShrink: 1`), preserving exact visual design.
3. DO NOT modify any source files.

## 2026-09-29T20:30:47Z
Audit RevealView (e.g. RevealView.tsx), GameRoom (e.g. GameRoom.tsx), and any associated coin animation containers, scorecards, round result views, and game controls in src/components/ for hardcoded absolute dimensions that cause clipping, overflow, or layout distortion across screen sizes.
