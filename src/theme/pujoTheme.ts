import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

/**
 * Pujo Parikrama theme — "Pujo Night".
 * Marigold (genda) garlands against a black night, built on Astryx Neutral.
 *
 *   marigold  accent: buttons, selection, numbered pins (dark text on it)
 *   dusk blue secondary: metro routes, start point, must-see rings, focus ring
 *   alert red reserved for police closures and walking routes
 *
 * Every text/surface pair below was measured (WCAG 2.2):
 *   body text ≥ 13:1, secondary text ≥ 7.2:1, accent text ≥ 8.6:1 on every dark
 *   surface; dark text on marigold 9.2:1; emphasized borders ≥ 3.5:1. Light-mode
 *   values hold ≥ 4.5:1 text and ≥ 3:1 borders the same way.
 * Build after every edit: `npx astryx theme build src/theme/pujoTheme.ts`.
 */
export const pujoTheme = defineTheme({
  name: 'pujo',
  extends: neutralTheme,

  color: {accent: ['#9A5B00', '#F2A33A'], neutralStyle: 'cool', contrast: 'standard'},

  typography: {
    scale: {base: 15, ratio: 1.2},
    body: {family: 'Instrument Sans', fallbacks: '"Noto Sans Bengali", system-ui, -apple-system, sans-serif'},
    heading: {weight: 'semibold', weights: {1: 'bold', 2: 'bold'}},
  },

  radius: {base: 4, multiplier: 2},
  motion: {fast: 150, medium: 300, slow: 700, ratio: 0.75},

  tokens: {
    // Accent — marigold. Labels on it are dark ink, not white (8.8:1 vs 2.1:1).
    '--color-accent': ['#9A5B00', '#F2A33A'],
    '--color-on-accent': ['#FFFFFF', '#140E05'],
    '--color-accent-muted': ['rgb(154 91 0 / 0.10)', 'rgb(242 163 58 / 0.12)'],
    '--color-text-accent': ['#8A5200', '#F5B35A'],
    '--color-icon-accent': ['#8A5200', '#F5B35A'],

    // Surfaces — warm paper by day, near-black (faintly warm) night by default.
    '--color-background-body': ['#F7F4EE', '#0A0A0B'],
    '--color-background-surface': ['#FFFFFF', '#111112'],
    '--color-background-card': ['#FAF7F1', '#1A1A1C'],
    '--color-background-popover': ['#FFFFFF', '#222225'],
    '--color-background-muted': ['#F1ECE3', '#18181A'],
    '--color-border': ['#E6DFD3', '#2A2A2E'],
    '--color-border-emphasized': ['#8E8574', '#76767F'],
    '--color-overlay-hover': ['rgb(29 27 38 / 0.05)', 'rgb(238 233 224 / 0.06)'],
    '--color-overlay-pressed': ['rgb(29 27 38 / 0.09)', 'rgb(238 233 224 / 0.10)'],

    // Text and icons.
    '--color-text-primary': ['#1D1B26', '#EEE9E0'],
    '--color-text-secondary': ['#565366', '#B3AFA7'],
    '--color-text-disabled': ['#9A97A6', '#6E6B66'],
    '--color-icon-primary': ['#1D1B26', '#E6E1D8'],
    '--color-icon-secondary': ['#565366', '#A6A29A'],

    // Status. Warning is the alert red, reserved for closures; success stays green.
    '--color-warning': ['#B3261E', '#FF8A7A'],
    '--color-warning-muted': ['rgb(179 38 30 / 0.10)', 'rgb(229 72 77 / 0.16)'],
    '--color-on-warning': ['#FFFFFF', '#1F0A0A'],
    '--color-error': ['#B3261E', '#FF6B6B'],
    '--color-success': ['#1E7A4C', '#5BD49A'],
    '--color-text-blue': ['#2F5F8A', '#8FB8D9'],
    '--color-icon-blue': ['#2F5F8A', '#8FB8D9'],

    // Focus ring — dusk blue, ≥ 7:1 against every surface.
    '--focus-outline-color': ['#2F5F8A', '#8FB8D9'],

    // Concentric radii: each nested surface = parent radius − parent padding.
    //   panel/sheet 32 − 16 padding → cards 16 − 16 padding → controls (pills)
    '--radius-inner': '6px',
    '--radius-element': '10px',
    '--radius-container': '16px',
    '--radius-page': '32px',

    // Soft, diffuse elevation — wide blur, low opacity, negative spread.
    '--shadow-low': '0 1px 2px light-dark(rgb(17 20 35 / 0.05), rgb(0 0 0 / 0.24)), 0 2px 6px light-dark(rgb(17 20 35 / 0.05), rgb(0 0 0 / 0.18))',
    '--shadow-med': '0 8px 24px -8px light-dark(rgb(17 20 35 / 0.14), rgb(0 0 0 / 0.40))',
    '--shadow-high': '0 18px 44px -14px light-dark(rgb(17 20 35 / 0.18), rgb(0 0 0 / 0.48))',
  },

  localTokens: {
    '--pujo-marigold': ['#9A5B00', '#F2A33A'],
    '--pujo-dusk': ['#2F5F8A', '#8FB8D9'],
    // Map pins sit on the basemap, not the panel, so they keep one look:
    // marigold fill, ink numeral and ink outline (15:1 on the light map).
    '--pujo-pin': '#F2A33A',
    '--pujo-pin-ink': '#111423',
    '--pujo-pin-must': '#8FB8D9',
    '--pujo-start': '#2F5F8A',
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
      // The pressed state is exposed as a prop value: data-is-pressed="true".
      'isPressed:true': {
        backgroundColor: 'var(--color-accent)',
        borderColor: 'var(--color-accent)',
        color: 'var(--color-on-accent)',
      },
    },
    // Secondary buttons and icon buttons float over the map too.
    button: {
      'variant:secondary': {backgroundColor: 'var(--color-background-card)', borderColor: 'var(--color-border)'},
    },
    // Closure banners speak in the alert red, not the default yellow, so they
    // never read as the marigold accent.
    banner: {
      'status:warning': {
        '--color-text-yellow': 'var(--color-warning)',
        '--color-icon-yellow': 'var(--color-warning)',
        '--color-text-accent': 'var(--color-warning)',
      },
    },
    'banner-icon': {'status:warning': {color: 'var(--color-warning)'}},
    'banner-description': {base: {color: 'var(--color-text-primary)'}},
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
        color: 'var(--pujo-marigold)',
      },
    },
  },
});
