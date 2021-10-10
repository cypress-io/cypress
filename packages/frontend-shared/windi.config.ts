import { defineConfig } from 'windicss/helpers'
import InteractionVariants from '@windicss/plugin-interaction-variants'
import { IconDuotoneColorsPlugin } from './.windicss/icon-color-plugins'
import { safelist } from './.windicss/safelist'
import { colors } from './.windicss/colors'
import path from 'path'
import type { WindiCssOptions } from '@windicss/config'

export const defaultConfig: WindiCssOptions = {
  // This adds !important to all utility classes.
  // https://csswizardry.com/2016/05/the-importance-of-important/
  important: true,
  theme: {
    extend: {
      gridTemplateColumns: {
        launchpad: '64px 1fr',
      },
      gridTemplateRows: {
        launchpad: '64px 1fr',
      },
      colors,
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
  ],
  shortcuts: {
    // Not working? Make sure that you have border-1 set on the non-hocus
    // state. If you don't want a gray outline with that, do
    // border-transparent for the non-hocus state.
    'focus-default': 'outline-none focus:border focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:outline-transparent transition duration-150 disabled:hover:ring-0 disabled:hover:border-0',
    'hocus-default': 'outline-none hocus:border hover:border-indigo-300 focus:border-indigo-300 hocus:ring-2 hocus:ring-indigo-100 hocus:outline-transparent transition duration-150 disabled:ring-0 disabled:border-0',
  },
  extract: {
    // accepts globs and file paths relative to project root
    include: [
      'index.html',
      '**/*.{vue,html,tsx}',
      path.join(__dirname, '../frontend-shared/**/*.{vue,html,tsx,svg}'),
      path.join(__dirname, '../app/**/*.{vue,html,tsx,svg}'),
      path.join(__dirname, '../launchpad/**/*.{vue,html,tsx,svg}'),
    ],
    exclude: ['node_modules/**/*', '.git/**/*'],
  },
}

export default defineConfig(defineConfig)
