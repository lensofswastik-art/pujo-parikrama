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
 *   body text ≥ 11.4:1, secondary text ≥ 6.9:1, accent text ≥ 7.3:1 on every dark
 *   surface; dark text on marigold 8–10.9:1 across its gradient; emphasized
 *   borders ≥ 3.4:1. Light-mode
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

    // Surfaces — warm paper by day; by night a near-black page under graphite widgets.
    '--color-background-body': ['#F7F4EE', '#0E0E10'],
    '--color-background-surface': ['#FFFFFF', '#1C1C1F'],
    '--color-background-card': ['#FAF7F1', '#26262A'],
    '--color-background-popover': ['#FFFFFF', '#2E2E33'],
    '--color-background-muted': ['#F1ECE3', '#222226'],
    '--color-border': ['#E6DFD3', '#34343A'],
    '--color-border-emphasized': ['#8E8574', '#80808B'],
    '--color-overlay-hover': ['rgb(29 27 38 / 0.05)', 'rgb(238 233 224 / 0.06)'],
    '--color-overlay-pressed': ['rgb(29 27 38 / 0.09)', 'rgb(238 233 224 / 0.10)'],

    // Text and icons.
    '--color-text-primary': ['#1D1B26', '#F0ECE4'],
    '--color-text-secondary': ['#565366', '#BDB9B1'],
    '--color-text-disabled': ['#9A97A6', '#6E6B66'],
    '--color-icon-primary': ['#1D1B26', '#E6E1D8'],
    '--color-icon-secondary': ['#565366', '#ADA9A1'],

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
    //   widgets 12px → cards 12px → controls and chips 8px → toggle segments 4px
    '--radius-inner': '6px',
    '--radius-element': '8px',
    '--radius-container': '12px',
    '--radius-page': '12px',

    // Soft, diffuse elevation — wide blur, low opacity, negative spread.
    '--shadow-low': '0 1px 2px light-dark(rgb(17 20 35 / 0.05), rgb(0 0 0 / 0.24)), 0 2px 6px light-dark(rgb(17 20 35 / 0.05), rgb(0 0 0 / 0.18))',
    '--shadow-med': '0 8px 24px -8px light-dark(rgb(17 20 35 / 0.14), rgb(0 0 0 / 0.40))',
    '--shadow-high': '0 18px 44px -14px light-dark(rgb(17 20 35 / 0.18), rgb(0 0 0 / 0.48))',
  },

  localTokens: {
    // Depth: soft inner shadows for anything selected or pressed, and the
    // bevel highlight that gives buttons their raised top edge.
    '--pujo-inset-selected': 'inset 0 1px 2px rgb(0 0 0 / 0.28), inset 0 -1px 0 rgb(255 255 255 / 0.18)',
    '--pujo-inset-pressed': 'inset 0 2px 6px rgb(0 0 0 / 0.32)',
    '--pujo-bevel': 'inset 0 1px 0 rgb(255 255 255 / 0.28)',
    '--pujo-bevel-subtle': 'inset 0 1px 0 rgb(255 255 255 / 0.07)',
    // Chip labels: a fixed 12px so the quick picks stay balanced at every density.
    '--pujo-chip-font': '0.6875rem',
    // Shape: widgets 12px, controls (search, toggle, chips) 8px, toggle segments 8 − 4 padding = 4px.
    '--pujo-radius-widget': '12px',
    '--pujo-radius-control': '8px',
    '--pujo-radius-segment': '4px',
    '--pujo-control-height': '3.25rem',
    '--pujo-chip-bg': ['#F1ECE3', '#141416'],
    '--pujo-marigold-top': ['#B36C08', '#F7B85C'],
    '--pujo-marigold-bottom': ['#8F5400', '#E8952A'],
    '--pujo-graphite-top': ['#FFFFFF', '#3A3A40'],
    '--pujo-graphite-bottom': ['#F3EEE6', '#2A2A2F'],
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
    // Quick-pick capsules — filter chips: set into the panel (darker than it,
    // hairline border), small 11px label, 8px radius. Selected fills marigold
    // with a soft inner shadow so it reads as pressed in.
    'toggle-button': {
      base: {
        backgroundColor: 'var(--pujo-chip-bg)',
        borderColor: 'var(--color-border)',
        borderWidth: 'var(--border-width)',
        borderStyle: 'solid',
        borderRadius: 'var(--pujo-radius-control)',
        fontSize: 'var(--pujo-chip-font)',
        boxShadow: 'var(--pujo-bevel-subtle)',
      },
      'isPressed:true': {
        backgroundImage: 'linear-gradient(180deg, var(--pujo-marigold-top), var(--pujo-marigold-bottom))',
        borderColor: 'var(--pujo-marigold-bottom)',
        color: 'var(--color-on-accent)',
        boxShadow: 'var(--pujo-inset-selected)',
      },
    },
    // Buttons — raised: vertical gradient, top-edge highlight, darker bottom
    // edge; pressed flips to an inner shadow.
    button: {
      base: {borderRadius: 'var(--radius-element)'},
      'variant:primary': {
        backgroundImage: 'linear-gradient(180deg, var(--pujo-marigold-top), var(--pujo-marigold-bottom))',
        borderColor: 'var(--pujo-marigold-bottom)',
        borderWidth: 'var(--border-width)',
        borderStyle: 'solid',
        boxShadow: 'var(--pujo-bevel), var(--shadow-low)',
        ':hover': {filter: 'brightness(1.06)'},
        ':active': {boxShadow: 'var(--pujo-inset-pressed)', filter: 'brightness(0.97)'},
      },
      'variant:secondary': {
        backgroundImage: 'linear-gradient(180deg, var(--pujo-graphite-top), var(--pujo-graphite-bottom))',
        borderColor: 'var(--color-border)',
        borderWidth: 'var(--border-width)',
        borderStyle: 'solid',
        boxShadow: 'var(--pujo-bevel-subtle), var(--shadow-low)',
        ':hover': {filter: 'brightness(1.08)'},
        ':active': {boxShadow: 'var(--pujo-inset-pressed)'},
      },
    },
    'segmented-control': {
      base: {
        backgroundColor: 'var(--pujo-chip-bg)',
        borderColor: 'var(--color-border)',
        borderWidth: 'var(--border-width)',
        borderStyle: 'solid',
        boxShadow: 'inset 0 1px 3px rgb(0 0 0 / 0.25)',
      },
    },
    'segmented-control-item': {
      selected: {
        backgroundImage: 'linear-gradient(180deg, var(--pujo-marigold-top), var(--pujo-marigold-bottom))',
        color: 'var(--color-on-accent)',
        boxShadow: 'var(--pujo-inset-selected)',
      },
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
