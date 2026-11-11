---
name: ByteNoise
slug: bytenoise
division: leisure-compliance
platform: Windows, macOS, Linux, Python, PyQt5
status: in-development
summary: A desktop instrument that reads the raw bytes of any file and plays them as sound.
links:
  repo: https://github.com/hiraethsystems/ByteNoise
order: 90
---

ByteNoise is a desktop instrument that turns any file into sound. It reads the raw bytes of an
image, a program, a novel or anything else, and renders them as audio. Four synthesis modes read
those bytes in very different ways, and a chain of thirteen effects shapes the result into
anything from glitchy noise to slow, drifting drones.

There is no packaged release yet. It runs from source.

## Synthesis modes

- **Raw Noise**: the bytes are the samples, read as 8 bit or paired 16 bit, at 8 kHz to 96 kHz.
- **Drone**: the bytes drive a bank of detuned sine, saw or triangle oscillators with an LFO.
- **Crunch**: bit depth reduction, sample rate decimation and quantisation noise.
- **Space Drone**: long ambient pieces with a static bed, slow fades, drift and bursts triggered
  by the bytes.

## Effects

Parametric EQ, low pass and high pass filters, ring modulator, distortion, chorus, flanger,
phaser, granular, Paulstretch, bit crusher, delay and reverb, in that fixed order. Each one has
an on switch, a wet and dry mix where it makes sense, and its own level meter.

## Working with it

- Layer several files at once, each with its own gain.
- Save and load whole patches as JSON presets.
- Tick Watch and ByteNoise renders again whenever a loaded file changes on disk.
- Undo, redo, and randomise the current mode and effects.
- Export to WAV, or convert the byte stream to a MIDI file in one of nine scales.
- Live waveform, spectrum and level meters.

## How it is built

Written in Python with PyQt5, NumPy and SciPy. All the DSP and the MIDI writer are its own code,
with no external audio or MIDI libraries. Licensed under the GNU GPL v3.

## Running it

Needs Python 3.9 or newer and a working audio output. On Linux, also install PortAudio
(`sudo apt install libportaudio2`). Install the requirements with pip, then run `python main.py`.
