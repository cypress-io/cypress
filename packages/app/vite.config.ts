import { makeConfig } from '../frontend-shared/vite.config'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'
import react from '@vitejs/plugin-react'

export default makeConfig({}, {
  plugins: [
    Layouts(),
    Pages({ extensions: ['vue'] }),
    react({
      babel: {
        plugins: [
          ["@babel/plugin-proposal-decorators", { "legacy": true }],
          "@babel/plugin-proposal-class-properties"
        ]
      }
    })
  ],
})
