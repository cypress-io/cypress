import { defineConfig } from 'windicss/helpers'
import InteractionVariants from '@windicss/plugin-interaction-variants'
import { IconDuotoneColorsPlugin } from './.windicss/icon-color-plugins'
import { safelist } from './.windicss/safelist'
import { colors } from './.windicss/colors'

export default defineConfig({
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
    InteractionVariants,
    IconDuotoneColorsPlugin,
  ],
  shortcuts: {
    'focus-default': 'focus:border focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:outline-transparent',
  },
  extract: {
    // accepts globs and file paths relative to project root
    include: ['index.html', '**/*.{vue,html,tsx}', '../frontend-shared/**/*.{vue,html,tsx}'],
    exclude: ['node_modules/**/*', '.git/**/*'],
  },
})
