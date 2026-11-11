/**
 * Desktop icons and the logo. Each icon is 16 by 16 pixels, drawn at 3x on the desktop.
 * Edit the art by hand: one character per pixel, `.` is transparent, the legend says which
 * palette colour each letter is. Shading uses stepped bands, never blends.
 */
import { refIndex } from '../palette';
import { spriteFromArt, type Sprite } from './sprite';

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
 * The Hiraeth Systems logo: a sliced sun inside a diamond, 16 by 16. Built by rule rather than
 * drawn, as in the prototype: bands of the logo ramp top to bottom, the lower half sliced.
 */
function buildLogo(): Sprite {
  const pixels: (number | null)[] = [];
  const edge = refIndex('docs.3');
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.abs(x - 7.5) + Math.abs(y - 7.5);
      let slot: number | null = null;
      if (d <= 8) {
        slot = refIndex(`logo.${Math.min(8, Math.floor(y / 2))}`);
        if (y >= 9 && y % 2 === 0) slot = null;
        if (d > 7.2) slot = edge;
      }
      pixels.push(slot);
    }
  }
  return { w: 16, h: 16, pixels };
}

export const ICONS = { folder, eye, waterfall, ledger, survey, terminal, gear, bin } as const;
export type IconName = keyof typeof ICONS;
export const LOGO = buildLogo();

