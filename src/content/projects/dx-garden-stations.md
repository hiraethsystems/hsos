---
name: DX Garden Stations
slug: dx-garden-stations
division: signals
platform: Data, Python
status: released
summary: An open directory of internet radio stations and their places on the map.
links:
  repo: https://github.com/hiraethsystems/DX-Garden-Stations
  release: https://github.com/hiraethsystems/DX-Garden-Stations/releases/latest
order: 80
---

DX Garden Stations is an open directory of internet radio stations, each placed on the map. It
was made for [DX Garden](/srv/divisions/signals/dx-garden/) and is free for any other app to use.

Each station has a name, a stream URL, a country, a town, coordinates, genres, and its codec and
bitrate. Releases are named after their date, for example 2026.10.24.

## How a list is made

Every release is built from one dated snapshot of [Radio Browser](https://www.radio-browser.info),
a community station directory, and then cleaned up:

- dead streams and streams that only offer HLS are dropped,
- positions are checked against country borders, and swapped or sign flipped coordinates are
  fixed,
- each station gets the nearest town within 30 km, or failing that its region.

Every change the build makes to a station is explained in that station's notes.

## The files

- `stations.txt` holds MP3, AAC, AAC+, Ogg Vorbis and Opus stations, for desktop and Android
  players.
- `stations-mp3.txt` holds MP3 stations only, for the PS Vita and other MP3 only players.
- Both lists are also published as JSON.

The text files are one station per line, with fields separated by ` | `.

## Stations change

A list is correct as of its snapshot date. Stations move and close, so some entries will drift
over time. The best place to fix a station is Radio Browser itself, so the fix reaches every app
that uses it. The next release here picks it up.

## Licences

The station data is dedicated to the public domain under CC0 1.0, on top of Radio Browser's own
public domain data. Town names come from GeoNames under CC BY 4.0. The build tools are GNU GPL v3
and need only Python's standard library and curl.
