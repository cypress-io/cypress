import { defineConfig } from 'windicss/helpers'
import InteractionVariants from '@windicss/plugin-interaction-variants'
import { IconDuotoneColorsPlugin } from './.windicss/icon-color-plugins'
import { safelist } from './.windicss/safelist'
import { colors } from './.windicss/colors'
import path from 'path'
import type { WindiCssOptions } from '@windicss/config'

export const defaultConfig: WindiCssOptions = {
  // This adds !important to all utility classes. https://csswizardry.com/2016/05/the-importance-of-important/
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
    backgroundColor: ['group-focus-within', 'group-focus-visible', 'group-active', 'group-visited', 'group-disabled', 'hocus', 'group-hocus', 'can-hover', 'no-hover'],
  },
  plugins: [
    IconDuotoneColorsPlugin,
    InteractionVariants,
  ],
  shortcuts: {
    'focus-default': 'focus:border focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:outline-transparent transition transition-colors duration-100 disabled:hover:ring-0 disabled:hover:border-0',
    'hocus-default': 'hocus:border hocus:border-indigo-300 hocus:ring-2 hocus:ring-indigo-100 hocus:outline-transparent transition transition-colors duration-100 disabled:ring-0 disabled:border-0',
    'focus-within-default': 'focus-within:border focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:outline-transparent transition transition-colors duration-100 disabled:ring-0 disabled:border-0',
    'hocus-link-default': 'focus:outline-transparent hocus:underline',
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

export default defineConfig(defaultConfig)
