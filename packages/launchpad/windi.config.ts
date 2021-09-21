import { defineConfig } from 'windicss/helpers'
import Colors from 'windicss/colors'
import { customColors } from './src/design/colors'
import { map, reduce, kebabCase } from 'lodash'

const colors = Object.assign(Colors, customColors)

const safelist = reduce(colors, (acc, variants, colorName) => {
  const name = kebabCase(colorName)

  return `${acc}
    ${map(variants, (_: string, k: string) => `bg-${name}-${k} text-${name}-${k}`).join(' ')}`
}, '')

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
      colors: {
        primary: colors.indigo[500],
        'secondary-light': colors.jade[300],
        secondary: colors.indigo[50],
        error: colors.red[400],
        'warning-light': colors.orange[400],
        warning: colors.orange[500],
        success: colors.jade[400],
        confirm: colors.jade[500],
        caution: colors.red[500],
      },
    },
  },
  safelist,
  extract: {
    // accepts globs and file paths relative to project root
    include: ['index.html', 'src/**/*.{vue,html,tsx}'],
    exclude: ['node_modules/**/*', '.git/**/*'],
  },
  shortcuts: {
    'body-text': 'text-gray-600',
  },
})
