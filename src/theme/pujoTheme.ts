import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

/**
 * Pujo Parikrama theme — Astryx neutral, re-toned for Durga Puja:
 * a sindoor-red accent, deep green-charcoal night surfaces, turmeric for
 * must-see highlights, soft diffuse shadows, Instrument Sans for English and
 * Noto Sans Bengali for Bangla (per-glyph fallback inside one family stack).
 * Build after every edit: `npx astryx theme build src/theme/pujoTheme.ts`.
 */
export const pujoTheme = defineTheme({
  name: 'pujo',
  extends: neutralTheme,

  color: {accent: ['#B8282F', '#C93A33'], neutralStyle: 'warm', contrast: 'standard'},

  typography: {
    scale: {base: 15, ratio: 1.2},
    body: {family: 'Instrument Sans', fallbacks: '"Noto Sans Bengali", system-ui, -apple-system, sans-serif'},
    heading: {weight: 'semibold', weights: {1: 'bold', 2: 'bold'}},
  },

  radius: {base: 4, multiplier: 2},
  motion: {fast: 150, medium: 300, slow: 700, ratio: 0.75},

  tokens: {
    // Accent: sindoor red, toned so white labels keep >= 4.5:1 in both modes.
    '--color-accent': ['#B8282F', '#C93A33'],
    '--color-on-accent': ['#FFFFFF', '#FFFFFF'],
    '--color-text-accent': ['#A3222A', '#F2948B'],
    '--color-icon-accent': ['#A3222A', '#F2948B'],

    // Surfaces: warm paper by day, green-charcoal by night.
    '--color-background-body': ['#F6F3EE', '#0E1513'],
    '--color-background-surface': ['#FFFFFF', '#131C1A'],
    '--color-background-card': ['#FBF9F6', '#1A2421'],
    '--color-background-popover': ['#FFFFFF', '#1F2A27'],
    '--color-border': ['#E7E1D8', '#2B3632'],
    '--focus-outline-color': ['#B8282F', '#E8B65A'],

    // Concentric radii: each nested surface = parent radius − parent padding.
    //   panel/sheet 32 − 16 padding → cards 16 − 16 padding → controls (pills)
    '--radius-inner': '6px',
    '--radius-element': '10px',
    '--radius-container': '16px',
    '--radius-page': '32px',

    // Soft, diffuse elevation — wide blur, low opacity, negative spread.
    '--shadow-low': '0 1px 2px light-dark(rgb(20 28 26 / 0.05), rgb(0 0 0 / 0.22)), 0 2px 6px light-dark(rgb(20 28 26 / 0.05), rgb(0 0 0 / 0.18))',
    '--shadow-med': '0 8px 24px -8px light-dark(rgb(20 28 26 / 0.12), rgb(0 0 0 / 0.36))',
    '--shadow-high': '0 18px 44px -14px light-dark(rgb(20 28 26 / 0.16), rgb(0 0 0 / 0.42))',
  },

  localTokens: {
    '--pujo-holud': ['#8A5A00', '#E8B65A'],
    '--pujo-sabuj': ['#24524A', '#8FCFBD'],
    // Map-marker colours: the map stays light in both modes, so these don't flip.
    '--pujo-sabuj-solid': '#1F4A44',
    '--pujo-holud-solid': '#E0A43A',
  },

  components: {
    // Quick-pick capsules and map controls float over a light map, so they
    // need a solid surface rather than the default transparent fill.
    'toggle-button': {
      base: {
        backgroundColor: 'var(--color-background-card)',
        borderColor: 'var(--color-border)',
        borderWidth: 'var(--border-width)',
        borderStyle: 'solid',
        borderRadius: 'var(--radius-full)',
      },
      isPressed: {
        backgroundColor: 'var(--color-accent)',
        borderColor: 'var(--color-accent)',
        color: 'var(--color-on-accent)',
      },
    },
    // Secondary buttons and icon buttons float over the map too.
    button: {
      'variant:secondary': {backgroundColor: 'var(--color-background-card)', borderColor: 'var(--color-border)'},
    },
    'segmented-control': {
      base: {backgroundColor: 'var(--color-background-card)', borderRadius: 'var(--radius-container)'},
    },
    'segmented-control-item': {
      selected: {backgroundColor: 'var(--color-accent)', color: 'var(--color-on-accent)'},
    },
    heading: {
      'type:bangla': {
        fontFamily: '"Noto Sans Bengali", var(--font-family-body)',
        fontSize: 'var(--font-size-xl)',
        lineHeight: '1.3',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--pujo-holud)',
      },
    },
  },
});
