---
name: NetSplitElectron
slug: netsplitelectron
division: legacy-acquisitions
platform: Linux, Windows, Electron
status: in-development
summary: A Linux and Windows port of Netsplit, the modern macOS IRC client, built with Electron.
screenshot: /shots/netsplitelectron.png
links:
  repo: https://github.com/hiraethsystems/NetSplitElectron
  release: https://github.com/hiraethsystems/NetSplitElectron/releases/latest
order: 100
---

NetSplitElectron is a cross platform port of [Netsplit](https://github.com/richstokes/Netsplit),
Rich Stokes' modern IRC client for macOS. The original is a native Swift app that only runs on a
Mac. This port rebuilds it in Electron so it runs on Linux and Windows, keeping the look and feel
as close to the original as possible.

Version 0.1.0 is a first port of the look and the core client. It is independent and not
affiliated with or endorsed by the original author.

## What it does

- The same three pane layout as the original: connections, messages and members.
- All sixteen of the original's colour themes, ported one to one, with the same nickname
  colouring.
- Real IRC over TLS or plain TCP, including IRCv3 message tags, CTCP and keepalive.
- Channels and private messages, with topics, unread badges and mention highlighting.
- The common commands, from `/join` and `/msg` to `/whois` and `/raw`. You can connect entirely
  by typing, for example `/server irc.libera.chat`.
- A command palette (Ctrl+K), a searchable channel list, and automatic reconnecting.
- Connections through an SSH tunnel, with password or key login and host key pinning.
- Passwords and keys are encrypted with the system keychain and never written to disk in plain
  text.
- An offline demo server, so you can try it without connecting anywhere.

## Not done yet

Link preview cards, the original's full set of moderation commands, and scripts that run when
you connect to a server.

## Installing

The latest release has an AppImage and a `.deb` for Linux and an installer for Windows. To run
from source, you need Node.js 18 or newer, then `npm install` and `npm start`. MIT licence.
