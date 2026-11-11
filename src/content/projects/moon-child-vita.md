---
name: Moon Child Vita
slug: moon-child-vita
division: legacy-acquisitions
platform: PS Vita
status: in-development
summary: A PS Vita port of Moon Child FE, the source port of the 1997 Windows 95 platformer.
screenshot: /shots/moon-child-vita.png
links:
  repo: https://github.com/hiraethsystems/MoonChildVita
order: 30
---

Moon Child is a platformer released for Windows 95 in 1997 by Reinier van Vliet, with graphics
by Metin Seven and music and sound by Ramon Braumuller. [Moon Child FE](https://github.com/MorsGames/MoonChildFE)
(Friend Edition) by Mors Games is its modern source port, based on the later iOS release with
the menus and full motion video of the Windows 95 original restored.

This project brings Moon Child FE to the PS Vita as a homebrew app. It is a platform port only:
gameplay, physics, timing and levels are left exactly as they are.

## What the port does

- Draws with a dedicated Vita renderer on SDL3's native GXM driver, with two streaming
  textures alternated so the CPU never overwrites one the GPU is still reading.
- Offers a 1:1 picture or a sharp scaled "Fill" mode, chosen from the game's own video menu.
- Adds a switch for the full motion video sequences, off by default on the Vita.
- Uses the Vita's buttons and sticks: move, Cross to jump, Square to shoot, Start to pause.
- Keeps saves, settings and a detailed timing log in `ux0:data/MoonChildFE/`.

## Status

In development and not yet released. Builds come from continuous integration on every push.

## Licences

The code is MIT licensed. The game's graphics, music and sound are licensed CC BY-NC 4.0, so
they may not be used commercially, and that applies to this port too.
