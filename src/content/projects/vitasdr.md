---
name: VitaSDR
slug: vitasdr
division: signals
platform: PS Vita, C, VitaSDK
status: in-development
summary: A PS Vita client for KiwiSDR and OpenWebRX receivers, with live audio and a waterfall.
screenshot: /shots/vitasdr.png
links:
  repo: https://github.com/hiraethsystems/VitaSDR
  release: https://github.com/hiraethsystems/VitaSDR/releases/latest
order: 10
---

VitaSDR turns a PS Vita into a shortwave radio that uses someone else's antenna. Point it at a
[KiwiSDR](http://kiwisdr.com/) or [OpenWebRX](https://www.openwebrx.de/) receiver anywhere in
the world and it streams the audio, lets you tune, and draws a live RF waterfall.

Version 0.3.0 works on real hardware and has been tested on a PCH-1000.

## What it does

- Speaks two receiver protocols: KiwiSDR (separate audio and waterfall connections) and
  OpenWebRX or OpenWebRX+ (one connection carrying both), over plain `ws://` or TLS `wss://`.
- Opens on a server picker with the live public KiwiSDR directory, plus favourites and manual
  entry with the on-screen keyboard.
- Filters the picker by free slots, minimum SNR, location, or distance from a home point given
  as a Maidenhead grid square or latitude and longitude.
- Jumps straight to the HF amateur and broadcast bands.
- Tunes with the d-pad or an accelerated analogue sweep, and switches between USB, LSB, AM, CW
  and FM.
- Shows a 1024 bin waterfall and spectrum, an S-meter and the passband.
- Has a Settings screen for the palette, waterfall speed, audio bandwidth, auto-connect and
  certificate checking.

## How it is built

Written in C with VitaSDK and vita2d. Audio is IMA-ADPCM, decoded and resampled with a windowed
sinc filter, then played through a jitter buffer. TLS uses a vendored BearSSL with a compiled-in
certificate set. The radio core has its own host-side test suite of 110 assertions covering the
decoders, protocol parsers and WebSocket handshake.

## Known gaps

- Some public receivers allow one connection per address, which gives audio but no waterfall.
  The app labels this "Audio only".
- OpenWebRX support is new and has not yet been shaken out on real hardware.
- No touchscreen controls or button remapping yet.

## Installing

Download the VPK from the latest release and install it with VitaShell on a Vita running
HENkaku or ensō. Settings and favourites are kept in `ux0:data/vitasdr/`.
