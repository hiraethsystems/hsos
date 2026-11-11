/**
 * Desktop icons and the logo. Each icon is 16 by 16 pixels, drawn at 3x on the desktop.
 * The logo is 24 by 24, drawn at 3x.
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
 * The Hiraeth Systems logo, 24 by 24: an enso (one open brush circle) with a sea wave breaking
 * inside it. Drawn by hand. The stroke lands heavy at the top, runs anticlockwise and lifts
 * thin at the upper right, stepping through the logo ramp as it goes (digits 0 to 8). The wave
 * uses the wave ramp, crest to trough, with white foam.
 */
const LOGO_ART = spriteFromArt(
  [
    '.........0000...........',
    '.......110000000........',
    '.....1111000000000......',
    '....111111000000000.....',
    '...2211111.0000000......',
    '..222211.....000........',
    '..22222.................',
    '.22222.......WWWWW......',
    '.22222.....WWAAAAAW...8.',
    '.2222.....WAABBBBAW...8.',
    '33333....WABB....BB...88',
    '33333....WAB.WW..BB...88',
    '33333.....W.WAB..BB...88',
    '33333......WAB..BBC..888',
    '.3333.......B..BBCC..78.',
    '.33344.......BBBCCC.777.',
    '.3444.....WWBBCCCCD.777.',
    '..444...WWBBCCCDDDD.77..',
    '..4444.WWBBCCDDDDD.777..',
    '...44444555.....66777...',
    '....4445555556666667....',
    '.....45555555666666.....',
    '.......5555556666.......',
    '..........5556..........',
  ],
  {
    ...Object.fromEntries([...'012345678'].map((d) => [d, `logo.${d}` as const])),
    W: 'white',
    A: 'wave.0',
    B: 'wave.1',
    C: 'wave.2',
    D: 'wave.3',
  },
);

export const ICONS = { folder, eye, waterfall, ledger, survey, terminal, gear, bin } as const;
export type IconName = keyof typeof ICONS;
export const LOGO = LOGO_ART;

