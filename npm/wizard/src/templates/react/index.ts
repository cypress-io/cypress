import { Template } from '../Template'
import { NextTemplate } from './next'
import { WebpackTemplate } from './reactWebpackFile'
import { ReactScriptsTemplate } from './react-scripts'
import { BabelTemplate } from './babel'
import { WebpackOptions } from './webpack-options'

export const reactTemplates: Record<string, Template<any>> = {
  'create-react-app': ReactScriptsTemplate,
  'next.js': NextTemplate,
  webpack: WebpackTemplate,
  babel: BabelTemplate,
  'default (webpack options)': WebpackOptions,
}
