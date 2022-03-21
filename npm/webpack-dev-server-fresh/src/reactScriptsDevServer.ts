/// <reference types="node" />
import path from 'path'

import type { StartFreshDevServerArgs } from './index'
import { sourceWebpackFrom } from './sourceWebpackFrom'

export function reactScriptsDevServer (args: StartFreshDevServerArgs) {
  const { options: { config: { projectRoot } } } = args

  try {
    return sourceWebpackFrom(
      args,
      path.dirname(require.resolve('react-scripts/package.json', {
        paths: [projectRoot],
      })),
    )

    // const final = buildReactScriptsTranform(...)

    // if (args.options.webpackConfig === 'function') {
    //   return args.options.webpackConfig(final)
    // }

    // return final
  } catch {
    // Ejected!!
    // try {
    // Load from ejected
    // } catch {
    // throw we can't find it, give us your webpack
    // }
    //
  }
}

// framework: react-scripts
//
