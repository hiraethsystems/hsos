---
name: DX Garden
slug: dx-garden
division: signals
platform: PS Vita, Windows, Linux
status: in-development
summary: An internet radio player for the PS Vita. Spin a globe and hear what is on air there.
screenshot: /shots/dx-garden.png
links:
  repo: https://github.com/hiraethsystems/DX-Garden
  release: https://github.com/hiraethsystems/DX-Garden/releases/latest
order: 20
---

DX Garden is an internet radio player and explorer for the PS Vita, in the spirit of spinning a
globe and listening to whatever is on air somewhere else. Stop the crosshair on a place and it
starts playing after a moment.

Version 0.9.0 is a beta. Every planned feature is in and has been tested on a PCH-1000; the
beta is there to collect reports from other Vitas before 1.0.

<img src="/shots/dx-garden-list.png" width="960" height="544" alt="The station list, showing the places in Wales" loading="lazy" decoding="async">

## What it does

- Browse by globe, or by country, city or genre, with favourites and recently played.
- Search by station or place name, jump to a random place, set a sleep timer.
- "Dark screen" turns the display black and keeps the radio playing, which saves most of the
  screen's power on the OLED Vita.
- Plays MP3 streams over HTTP and HTTPS, with track titles, playlist links, clear error
  messages and automatic reconnecting. AAC, Ogg and HLS stations say so rather than failing
  silently.
- Draws station names in Latin, Greek, Cyrillic, Arabic, Hebrew, Thai, Georgian, Ethiopic,
  Chinese, Japanese and Korean scripts.
- Every button apart from Cross and Circle can be remapped.

<img src="/shots/dx-garden-menu.png" width="960" height="544" alt="The START menu: search, random place, sleep timer, dark screen and more" loading="lazy" decoding="async">

## The station list

The VPK comes with about 7,500 MP3 stations from a snapshot of
[Radio Browser](https://www.radio-browser.info), a community directory. The list becomes your
own `stations.txt` on first start, and the app never goes online to replace it. You can add
stations by URL, drop M3U or PLS files into a folder, or build a fresh list with the included
Python script, which also checks every station against country borders and fixes the usual
mistakes in the data.

The cleaned lists are also published on their own, free for any app to use, as
[DX Garden Stations](https://github.com/hiraethsystems/DX-Garden-Stations).

## How it is built

Written in C with VitaSDK, drawing with vitaGL, decoding with mpg123 and shaping text with
HarfBuzz and FriBidi. The globe is drawn from Natural Earth map data. The portable core has its
own Linux unit tests. Licensed under the GNU GPL v3.

## Installing

DX Garden needs the Vita's shader compiler at `ur0:data/libshacccg.suprx`, which the ShaRKBR33D
homebrew extracts. Then download the VPK from the latest release and install it with VitaShell.
Stations, favourites and settings live in `ux0:data/dxgarden/` and survive updates.
