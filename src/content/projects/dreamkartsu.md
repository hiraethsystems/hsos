---
name: DreamKartsU
slug: dreamkartsu
division: leisure-compliance
platform: Wii U
status: in-development
summary: A Wii U port of the DreamKarts kart racer that races real Dreamcasts online.
screenshot: /shots/dreamkartsu.png
links:
  repo: https://github.com/hiraethsystems/DreamKartsU
  release: https://github.com/hiraethsystems/DreamKartsU/releases/latest
order: 40
---

DreamKartsU is an unofficial Wii U port of
[DreamKarts](https://github.com/richstokes/dreamcast-homebrew/tree/main/projects/games/dreamkarts),
Rich Stokes' homebrew kart racer for the Sega Dreamcast. Online races run on the same lobby
server as the Dreamcast version, with Rich's permission, so Wii U players race real Dreamcasts.

The first live cross-play race, a Wii U against a Dreamcast, ran in November 2026.

## How the port works

- The game and race logic are Rich's code, kept as unchanged as possible and imported from
  upstream so new versions can be merged in. Every edit is marked in the source and listed.
- The Dreamcast's PowerVR renderer is replaced by a GX2 backend behind the game's own renderer
  interface. Shaders are compiled offline with CafeGLSL.
- Audio is a new software mixer for the sound effects, with the music streamed from MP3.
- Controls cover the GamePad, Pro Controller, Classic Controller and Wii Remote, with rumble on
  the GamePad.
- Network play works because the original protocol syncs state rather than running in
  lockstep, and packs every byte explicitly, so a big-endian console can speak it unchanged.

## Testing

Each milestone is checked by the game's own autotest, in which the computer drives a whole race
and reports a pass or fail with frame timings. Online play is tested against a local copy of
the lobby server and its bot, on a Linux build, in the Cemu emulator, and on a real Wii U.

## Installing

Built for the Aroma environment. Copy the `.wuhb` to `SD:/wiiu/apps/DreamKartsU/` and start it
from the Wii U Menu.

## Licences

MIT, shared between Rich Stokes and Hiraeth Systems. The music is by Alex Morgan under the
Pixabay Content License. See the repository's credits for the rest.
