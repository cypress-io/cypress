import { Template } from '../Template'
import { VueCliTemplate } from './vueCli'
import { VueViteTemplate } from './vueVite'
import { VueWebpackTemplate } from './vueWebpackFile'

export const vueTemplates: Record<string, Template<any>> = {
  webpack: VueWebpackTemplate,
  'vue-cli': VueCliTemplate,
  vite: VueViteTemplate,
}
