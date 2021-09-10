import { defineConfig } from 'windicss/helpers'
import Colors from 'windicss/colors'
import { map, reduce, kebabCase } from 'lodash'

const safelist = reduce(Colors, (acc, variants, colorName) => {
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
    },
  },
  safelist,
  extract: {
    // accepts globs and file paths relative to project root
    include: ['index.html', 'src/**/*.{vue,html,tsx}'],
    exclude: ['node_modules/**/*', '.git/**/*'],
  },
})
