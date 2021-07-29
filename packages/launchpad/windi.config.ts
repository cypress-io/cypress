import { defineConfig } from 'windicss/helpers'
import Colors from 'windicss/colors'
import { map, reduce, kebabCase } from 'lodash'
import formPlugin from 'windicss/plugin/forms'

console.log(formPlugin)

const safelist = reduce(Colors, (acc, variants, colorName) => {
  const name = kebabCase(colorName)
  return `${acc}
    ${map(variants, (_, k) => `bg-${name}-${k} text-${name}-${k}`).join(' ')}`
}, '')

export default defineConfig({
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
  // plguins: [formPlugin],
  safelist,
  extract: {
    // accepts globs and file paths relative to project root
    include: ['index.html', 'src/**/*.{vue,html,tsx}'],
    exclude: ['node_modules/**/*', '.git/**/*'],
  },
})
