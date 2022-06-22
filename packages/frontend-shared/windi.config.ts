/**
 * This file is used for vscode plugin autocompletion of windi colors
 */

import { colors } from '@cypress-design/css'
import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  theme: {
    extend: {
      colors,
    },
  },
})
