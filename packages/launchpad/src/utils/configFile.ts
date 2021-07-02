export const getCode = (lang: 'js'|'ts') => {
  const codes = {
    js:
        `// Component testing, Javascript, Vanilla JS, Webpack
module.exports = {
    component(on, config) {
        const { startDevServer } = require('@cypress/webpack-dev-server')
        const webpackConfig = require('./webpack.config')
        on('dev-server:start', (options) => {
            return startDevServer({ options, webpackConfig })
        })
        return config
    }
}`,
    ts: `// Component testing, TypeScript, Webpack
import { startDevServer } from '@cypress/webpack-dev-server'
import webpackConfig from './webpack.config'

export default {
    component(on, config) {
        on('dev-server:start', (options) => {
            return startDevServer({ options, webpackConfig })
        })
        return config
    }
}` }

  return codes[lang]
}

export const languages: Array<{id: 'js'|'ts', name: string}> = [
  {
    id: 'ts',
    name: 'TypeScript',
  },
  {
    id: 'js',
    name: 'JavaScript',
  },
]
