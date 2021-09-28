import { makeConfig } from '../frontend-shared/vite.config'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'

export default makeConfig({}, {
  plugins: [
    Layouts(),
    Pages({ extensions: ['vue'] }),
  ],
})
