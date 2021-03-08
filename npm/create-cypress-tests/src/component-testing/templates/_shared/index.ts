import { Template } from '../Template'
import { RollupTemplate } from './rollup'
import { ViteTemplate } from './vite'

export const frameworkAgnosticTemplates: Record<string, Template<any>> = {
  vite: ViteTemplate,
  rollup: RollupTemplate,
}
