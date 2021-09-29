import { defineConfig } from 'windicss/helpers'
import InteractionVariants from '@windicss/plugin-interaction-variants'
import { IconDuotoneColorsPlugin } from './.windicss/icon-color-plugins'
import { safelist } from './.windicss/safelist'
import { colors } from './.windicss/colors'
import path from 'path'

export const defaultConfig = {
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
  extract: {
    // accepts globs and file paths relative to project root
    include: [
      'index.html',
      '**/*.{vue,html,tsx}',
      path.join(__dirname, '../frontend-shared/**/*.{vue,html,tsx,svg}'),
      path.join(__dirname, '../app/**/*.{vue,html,tsx,svg}'),
      path.join(__dirname, '../launchpad/**/*.{vue,html,tsx,svg}')
    ],
    exclude: ['node_modules/**/*', '.git/**/*'],
  },
}

export default defineConfig(defineConfig)
