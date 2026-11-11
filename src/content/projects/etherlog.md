---
name: EtherLog
slug: etherlog
division: signals
platform: Windows, macOS, Linux, Python, PyQt5
status: in-development
summary: A desktop app for shortwave listeners to write, log and send eQSL reception reports.
links:
  repo: https://github.com/hiraethsystems/EtherLog
  release: https://github.com/hiraethsystems/EtherLog/releases/latest
order: 60
---

EtherLog is a desktop application for shortwave radio listeners. It helps you compose a
reception report for a station you have heard, keep a log of every report you have sent, and
send them as electronic QSLs (eQSL) by email.

Version 1.0.0 beta 1 is out for Windows, macOS and Linux.

## What it does

- Composes structured reception reports with a SINPO rating.
- Suggests station names from the EiBi shortwave schedule and from your own past reports, and
  fills in the frequency, language and target region from EiBi.
- Keeps a searchable, filterable log of reports, with CSV export.
- Prints airmail address labels for reports sent as postcards, with a live preview, a choice of
  label sizes and an optional PAR AVION border. Labels can also be saved as PDF.
- Downloads the current season's EiBi schedule on demand. Stations you add yourself are never
  overwritten by an update.
- Sends reports over SMTP with a full preview first. It works with Proton Mail Bridge.
- Light, dark and system themes.

## How it is built

Written in Python with PyQt5. Reports, schedules and profiles live in a SQLite database in the
platform's usual config folder (`~/.config/EtherLog/` on Linux). The SMTP password is kept in
the system keychain (GNOME Keyring or KWallet on Linux), and EtherLog only offers to store it in
its config file if no keychain is available.

## Installing

Download the standalone executable for your platform from the latest release. No Python
installation is needed. To run from source, install the requirements with pip and run
`python main.py`.
