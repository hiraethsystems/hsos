---
name: OWTR Viewer
slug: owtr-viewer
division: signals
platform: Windows, Electron
status: released
summary: Puts Ofcom's Wireless Telegraphy Register on an interactive map you can filter.
links:
  repo: https://github.com/hiraethsystems/OWTR-Viewer
  release: https://github.com/hiraethsystems/OWTR-Viewer/releases/latest
order: 70
---

OWTR Viewer, also called Ofcom Spectrum Map, is a Windows desktop application that shows data
from Ofcom's Wireless Telegraphy Register (WTR) on a map. The register lists licensed radio
transmitters in the UK, with their frequencies, licensees and locations.

Version 1.0.0 is released.

## What it does

- Loads a WTR CSV file chosen with a file picker.
- Filters by frequency range in MHz and by licensee name.
- Plots the results on an interactive Leaflet map with CartoDB tiles.
- Lists the results in a scrollable table. Clicking a row pans the map to it.
- Dark theme.

## Getting the data

The register is published as CSV on Ofcom's
[Spectrum Information Portal](https://www.ofcom.org.uk/spectrum/frequencies/spectrum-information-portal).
The app expects Ofcom's standard columns, including frequency, licensee, latitude, longitude and
product description.

## Installing

Download the installer from the latest release. To run from source, use `npm install` and then
`npm start`.
