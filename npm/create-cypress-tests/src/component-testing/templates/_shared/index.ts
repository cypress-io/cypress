import { Template } from '../Template'
import { ViteTemplate } from './vite'

export const frameworkAgnosticTemplates: Record<string, Template<any>> = {
  vite: ViteTemplate,
}
