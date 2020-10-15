import { Template } from '../Template'
import { VueWebpackTemplate } from './vueWebpackFile'

export const vueTemplates: Record<string, Template<any>> = {
  webpack: VueWebpackTemplate,
}
