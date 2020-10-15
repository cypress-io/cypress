import { Template } from '../Template'
import { NextTemplate } from './next'
import { WebpackTemplate } from './reactWebpackFile'
import { ReactScriptsTemplate } from './react-scripts'
import { BabelTemplate } from './babel'
import { WebpackOptions } from './webpack-options'

export const reactTemplates: Record<string, Template<any>> = {
  'next.js': NextTemplate,
  'create-react-app': ReactScriptsTemplate,
  webpack: WebpackTemplate,
  babel: BabelTemplate,
  'default (webpack options)': WebpackOptions,
}
