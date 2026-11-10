# First prompt for Claude Code

Paste this into Claude Code after you have copied the starter files into the repo and
started `claude` inside it.

---

Hi. This repository is HSOS, my website at hiraeth.systems. Please start by reading
CLAUDE.md and docs/SPEC.md in full, then look at docs/reference/prototype.dc.html as a
behaviour and look reference (do not copy its format).

Then:

1. Tell me in a short summary what you understood, and list anything in the spec that is
   unclear or that you think is a bad idea, before writing any code.
2. Once I reply, do **Phase 0 (Scaffold)** from section 18 of the spec: set up Astro with
   TypeScript and Preact, static output, content collections for projects and memos,
   src/os/palette.ts with the 256 colour palette and named ramps, a placeholder bitmap
   font setup, docs/CREDITS.md, and npm scripts for dev, build, preview and check.
3. Make sure `npm run build` and `npm run check` both pass, commit, and explain what you
   did in plain English.

Work in small steps and check with me before starting each new phase.
