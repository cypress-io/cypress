import type { Bundler } from '../types'

export const isWebpack = (bundler: Bundler) => ['webpack4', 'webpack5'].includes(bundler)
