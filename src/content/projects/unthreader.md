---
name: UnThreader
slug: unthreader
division: defence-contracts
platform: Windows, Linux, macOS, Electron
status: in-development
summary: A desktop app that bulk deletes the posts and replies on your own Threads account.
screenshot: /shots/unthreader.png
links:
  repo: https://github.com/hiraethsystems/UnThreader
  release: https://github.com/hiraethsystems/UnThreader/releases/latest
order: 110
---

UnThreader is a desktop app for Windows, Linux and macOS that clears out your own
[Threads](https://www.threads.net) account. It can delete all your posts and all your replies.

It works by driving the real Threads website inside an embedded browser, using your own logged
in session. It clicks the same buttons you would click by hand.

Version 0.1.1 is the current release.

## Read this first

- Automating threads.net is against Meta's terms of service. Bulk actions can get an account
  rate limited, blocked for a while, or banned.
- Use it only on your own account, and understand the risk.
- Deleting from Threads is permanent. Download your data from Meta first if you want to keep it.
- Dry run is on by default. It lists everything that would be deleted without touching anything.

## Why not the official API

Meta's Threads API can delete posts, but only 100 a day, and an app that uses it has to pass
Meta's review. Driving the website with your own session has neither limit and needs no server.

## How it works

- You log in to Threads yourself, inside the app. Your password never passes through UnThreader.
- It works on the first item at the top of the list, waits for the list to settle, and repeats.
  This copes with Threads' endless scrolling lists.
- A rate limiter waits a random, human length of time between actions, can stop at a daily cap,
  and pauses on its own when Threads asks it to slow down.
- The activity log stays in memory unless you choose to save it. You can log out and clear all
  Threads data from the app at any time.
- Every part of the Threads page it relies on is listed in one file, so a Threads redesign means
  changing one file.

Earlier versions also tried to unfollow everyone and remove followers. Threads' website has no
reliable way to do either, so those features were removed rather than shipped half working.

## Installing

The latest release has an installer for Windows, an AppImage and `.deb` for Linux, and a `.dmg`
for macOS. The builds are not code signed, so Windows and macOS will warn the first time you run
them. MIT licence.
