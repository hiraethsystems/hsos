/**
 * Desktop icons and the logo. Each icon is 16 by 16 pixels, drawn at 3x on the desktop.
 * The logo is 32 by 32, drawn at 3x.
 * Edit the art by hand: one character per pixel, `.` is transparent, the legend says which
 * palette colour each letter is. Shading uses stepped bands, never blends.
 */
import { spriteFromArt } from './sprite';

/** divisions/ : a manila folder in four stepped bands. */
const folder = spriteFromArt(
  [
    '................',
    '..oooo..........',
    '.oLLLLo.........',
    '.oLLLLLoooooooo.',
    '.oMMMMMMMMMMMMo.',
    '.oLLLLLLLLLLLLo.',
    '.oLLLLLLLLLLLLo.',
    '.oMMMMMMMMMMMMo.',
    '.oMMMMMMMMMMMMo.',
    '.oDDDDDDDDDDDDo.',
    '.oDDDDDDDDDDDDo.',
    '.oSSSSSSSSSSSSo.',
    '.oSSSSSSSSSSSSo.',
    '.oooooooooooooo.',
    '................',
    '................',
  ],
  { o: 'brown', L: 'ledger-q3.0', M: 'ledger-q3.1', D: 'ledger-q3.2', S: 'ledger-q3.3' },
);

/** boardd : the eye of the Board. */
const eye = spriteFromArt(
  [
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...ooWWWWWWoo...',
    '..oWWWIIIIWWWo..',
    '.oWWWIIPPIIWWWo.',
    'oWWWWIPPPPIWWWWo',
    '.oWWWIIPPIIWWWo.',
    '..oWWWIIIIWWWo..',
    '...ooWWWWWWoo...',
    '.....oooooo.....',
    '................',
    '..LLLLLLLLLLLL..',
    '................',
    '................',
  ],
  { o: 'board.0', W: 'white', I: 'docs.2', P: 'black', L: 'board.3' },
);

/** /dev/lp7 : a waterfall display with two signals. */
const waterfall = spriteFromArt(
  [
    'oooooooooooooooo',
    'oKKKAKKKKKYKKKKo',
    'oKKAAAKKKKYKKKKo',
    'oKKKAKKKKKKKKMKo',
    'oKMKAKKKKKYKKKKo',
    'oKKKAKKKKKYKKKKo',
    'oKKAAAKKMKKKKKKo',
    'oKKKAKKKKKYKKKKo',
    'oKKKAKKKKKYKKMKo',
    'oKMKAKKKKKKKKKKo',
    'oKKAAAKKKKYKKKKo',
    'oKKKAKKKKKYKKKKo',
    'oooooooooooooooo',
    '.....oooooo.....',
    '...oooooooooo...',
    '................',
  ],
  { o: 'listening.0', K: 'heat.2', M: 'heat.9', A: 'heat.20', Y: 'heat.27' },
);

/** ledger : a bar chart on paper. */
const ledger = spriteFromArt(
  [
    'iiiiiiiiiiiiiiii',
    'iWWWWWWWWWWWWWWi',
    'iWWWWWWWWWWWBBWi',
    'iWWWWWWGGWWWBBWi',
    'iWWWWWWGGWWWBBWi',
    'iWWWWWWGGWWWBBWi',
    'iWWWWWWGGWRRBBWi',
    'iWWYYWWGGWRRBBWi',
    'iWWYYWWGGWRRBBWi',
    'iWWYYWWGGWRRBBWi',
    'iWWYYWWGGWRRBBWi',
    'iWWYYWWGGWRRBBWi',
    'iWiiiiiiiiiiiiWi',
    'iWWWWWWWWWWWWWWi',
    'iiiiiiiiiiiiiiii',
    '................',
  ],
  { i: 'ink', W: 'white', Y: 'ledger-q2.2', G: 'ledger-q4.2', R: 'ledger-q1.2', B: 'ledger-q6.2' },
);

/** survey : a drone over the estate's tiles. */
const survey = spriteFromArt(
  [
    '................',
    '.......WW.......',
    '......WLLW......',
    '.....WLLLLW.....',
    '....WLLRRLLW....',
    '...WLLRRRRLLW...',
    '..WWWW....WWWW..',
    '......Y..Y......',
    '.....Y....Y.....',
    '................',
    'GGGGHHHHGGGGHHHH',
    'GGGGHHHHGGGGHHHH',
    'HHHHGGGGHHHHGGGG',
    'HHHHGGGGHHHHGGGG',
    'GGGGHHHHGGGGHHHH',
    'GGGGHHHHGGGGHHHH',
  ],
  { W: 'white', L: 'light-grey', R: 'hr.1', Y: 'heat.28', G: 'files.1', H: 'ledger-q4.1' },
);

/** terminal : the legacy text layer. */
const terminal = spriteFromArt(
  [
    'oooooooooooooooo',
    'oKKKKKKKKKKKKKKo',
    'oKKKKKKKKKKKKKKo',
    'oKKgKgKKKKKKKKKo',
    'oKgggggKKKKKKKKo',
    'oKgKgKKKKKKKKKKo',
    'oKgggggKKKKKKKKo',
    'oKKKgKgKKKKKKKKo',
    'oKgggggKKKKKKKKo',
    'oKKgKgKKggggKKKo',
    'oKKKKKKKKKKKKKKo',
    'oKKKKKKKKKKKKKKo',
    'oooooooooooooooo',
    '......oooo......',
    '...oooooooooo...',
    '................',
  ],
  { o: 'dark-grey', K: 'black', g: 'term-prompt' },
);

/** /etc/hsos : a gear. */
const gear = spriteFromArt(
  [
    '................',
    '......oooo......',
    '..oo..oLLo..oo..',
    '..oLooLLLLooLo..',
    '...oLLLLLLLLo...',
    '..ooLLMMMMLLoo..',
    'ooLLLMooooMLLLoo',
    'oLLLMo....oMLLLo',
    'oLLLMo....oMLLLo',
    'ooLLLMooooMLLLoo',
    '..ooLLMMMMLLoo..',
    '...oLLLLLLLLo...',
    '..oLooLLLLooLo..',
    '..oo..oLLo..oo..',
    '......oooo......',
    '................',
  ],
  { o: 'system.0', L: 'paper-edge', M: 'muted' },
);

/** /dev/null : the suggestion box. */
const bin = spriteFromArt(
  [
    '................',
    '......oooo......',
    '..oooooooooooo..',
    '..oLLLLLLLLLLo..',
    '..oooooooooooo..',
    '...oDLMLMLMLDo..',
    '...oDLMLMLMLDo..',
    '...oDLMLMLMLDo..',
    '...oDLMLMLMLDo..',
    '...oDLMLMLMLDo..',
    '...oDLMLMLMLDo..',
    '...oDLMLMLMLDo..',
    '...oDLMLMLMLDo..',
    '...oooooooooo...',
    '................',
    '................',
  ],
  { o: 'terminal.0', L: 'paper-edge', M: 'light-grey', D: 'muted' },
);

/**
 * The Hiraeth Systems logo, 32 by 32: an enso (one open brush circle) in white ink, with a sea
 * wave breaking inside it. A thin stroke: the brush lands in a round blot at the top, runs
 * anticlockwise, presses heaviest down the left, then splits into two bristle lines along the
 * bottom right and lifts thin, with a touch of dry ink (G) at the very end. The enso frames the
 * wave: the water runs right up to the inside of the stroke, with no gap. It uses the wave ramp, crest to trough,
 * its foam drawn in the same ink.
 * Ink (W) is black on light backgrounds (the WELCOME.dd masthead) and white on dark ones (boot).
 */
const logo = (ink: 'black' | 'white') => spriteFromArt(
  [
    '................................',
    '..........WWWWWWWWWWW...........',
    '.......WWWWWWWWWWWWWWWWW........',
    '......WWWWWWWWWWWWWWWWWWW.......',
    '.....WWWWWW.........WWWWW.......',
    '....WWWWW............WWW........',
    '....WWWW......WWWWW.............',
    '...WWWW....WWWAAAAAWW...........',
    '...WWWW..WWAAAAAAAAAAWW.........',
    '..WWWW..WAAAABBBBBBBAAAW........',
    '..WWWW.WAAB......BBBBBAAW.......',
    '..WWWWWAB..........BBBBBAW..WG..',
    '.WWWWWAB...WW.......BBBBBAW..W..',
    '.WWWWWB...WAAW.......CBBBBAW..G.',
    '.WWWWB....WB..........CCBBBAWWW.',
    '.WWWW.....WB...........CCBBBAWW.',
    '.WWWW......B...........CCCBBBWW.',
    '.WWWW.................CCCCCBBWW.',
    '.WWWW................CCCCCCCBWW.',
    '.WWWW..............CCCCCCCCCCWW.',
    '..WWWW...........CCCCDDDCCCC..W.',
    '..WWWW.........CCCDDDDDDDCCCWWW.',
    '..WWWWWWWWW..CCCDDDDDDDDDDD.WW..',
    '...WWWWWAAAWBBCCDDDDDDDDDDDWWW..',
    '....WWWWWBBBBBCCCDDDDDDDDDWWW...',
    '.....WWWWWBCCCCCCDDDDDDDDW.W....',
    '......WWWWWCCCCDDDDDDDDWW.W.....',
    '.......WWWWWDDDDDDDDDDW..W......',
    '........WWWWWWWDDDDWW...W.......',
    '.........WWWWWWWW.....WW........',
    '...........WWWWW....WW..........',
    '..............WWWWW.............',
  ],
  {
    W: ink,
    G: 'light-grey',
    A: 'wave.0',
    B: 'wave.1',
    C: 'wave.2',
    D: 'wave.3',
  },
);

export const ICONS = { folder, eye, waterfall, ledger, survey, terminal, gear, bin } as const;
export type IconName = keyof typeof ICONS;
/** Black ink, for light backgrounds. */
export const LOGO = logo('black');
/** White ink, for dark backgrounds. */
export const LOGO_ON_DARK = logo('white');

