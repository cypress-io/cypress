import { defineConfig } from 'windicss/helpers'

export default defineConfig({
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
  extract: {
    // accepts globs and file paths relative to project root
    include: ['index.html', 'src/**/*.{vue,html,tsx}'],
    exclude: ['node_modules/**/*', '.git/**/*'],
  },
})
