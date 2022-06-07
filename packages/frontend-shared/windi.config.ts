import { defineConfig } from 'windicss/helpers'
import InteractionVariants from '@windicss/plugin-interaction-variants'
import { IconDuotoneColorsPlugin } from './.windicss/icon-color-plugins'
import { safelist } from './.windicss/safelist'
import { colors } from './.windicss/colors'
import { shortcuts } from './.windicss/shortcuts'
import path from 'path'
import type { FullConfig } from 'windicss/types/interfaces'

export const defaultConfig: FullConfig = {
  // This adds !important to all utility classes.
  // https://csswizardry.com/2016/05/the-importance-of-important/
  important: true,
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '4px',
        md: '4px' },
      fontFamily: {
        mono: '"Fira Code", monospace',
      },
      colors,
      cursor: {
        'ew-resize': 'ew-resize',
      },
      boxShadow: {
        'dropdown': '0 1px 3px 0 rgba(0, 0, 0, 0.2)',
      },
    },
  },
  safelist,
  variants: {
    // What's hocus?
    // Hocus is a portmanteau of hover + focus. This is useful because
    // many of our styles are the same for both hover and focus.
    backgroundColor: ['group-focus-within', 'group-focus-visible', 'group-active', 'group-visited', 'group-disabled', 'hocus', 'group-hocus', 'can-hover', 'no-hover'],
  },
  plugins: [
    IconDuotoneColorsPlugin,
    InteractionVariants,
    require('windicss/plugin/filters'),
  ],
  shortcuts,
  extract: {
    // accepts globs and file paths relative to project root
    include: [
      'index.html',
      '**/*.{vue,html,tsx}',
      path.resolve(__dirname, '../frontend-shared/**/*.{vue,html,tsx,svg,ts}'),
      path.resolve(__dirname, '../app/**/*.{vue,html,tsx,svg}'),
      path.resolve(__dirname, '../launchpad/**/*.{vue,html,tsx,svg}'),
    ],
    exclude: ['node_modules/**/*', '.git/**/*'],
  },
}

export default defineConfig(defaultConfig)
