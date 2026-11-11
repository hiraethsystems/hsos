---
name: Bonsai
slug: bonsai
division: general-services
platform: Windows, Linux, Python, Qt
status: released
summary: Trims a big IPTV channel list down to a small playlist for low spec players like the PS Vita.
screenshot: /shots/bonsai.png
links:
  repo: https://github.com/hiraethsystems/Bonsai
  release: https://github.com/hiraethsystems/Bonsai/releases/latest
order: 120
---

Bonsai trims a big IPTV channel list down to a small `.m3u` playlist that a low spec player, such
as a PS Vita, can cope with. It works with two kinds of source:

- **An Xtream Codes account.** The trimmed playlist still plays through the same account. Bonsai
  only reads from the provider and never changes anything there, so other devices keep the full
  list. Live TV only.
- **Any M3U playlist**, from a link or a file, such as the public
  [iptv-org](https://github.com/iptv-org/iptv) lists.

Version 1.0.0 is released for Windows and Linux.

## What it does

- Tick whole categories or single channels, after filtering by name if you like.
- Filters by resolution, read from the tags in channel names (SD, HD, FHD, 4K), including tags
  written in small capitals or superscript. Anything above 720p is hidden by default.
- Filters by content and region, and hides by default the things a Vita cannot play: HEVC,
  interlaced video, and DASH or RTMP streams.
- Saves named profiles, such as "Vita", that remember your ticks, filters and export settings.
  New channels in a category you ticked from are highlighted.
- Regenerate fetches the latest list, applies a profile and writes the playlist in one step. The
  command line version of this works well as a cron job or systemd timer.
- Tests streams. A quick test checks each one works. A deep test runs ffprobe and checks it
  against what the Vita's player can decode.

## Privacy and security

An Xtream playlist has your username and password in every stream URL, because that is how
Xtream works. Treat the exported file like a password. Bonsai keeps your login in a config file
only your user can read, sends no telemetry, and never downloads channel logos.

## How it is built

Written in Python with a Qt interface, and tested with pytest. The release builds are single
files made with PyInstaller. Licensed under the GNU GPL v3.

## Installing

Download the single `.exe` for Windows, or the Linux `.tar.gz`, from the latest release. The
Linux build runs on Debian 12 and 13 and Ubuntu 22.04 or newer. The deep test needs ffprobe from
FFmpeg.
