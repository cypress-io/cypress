/// <reference types="node" />
import path from 'path'

import type { StartFreshDevServerArgs } from './index'
import { sourceWebpackFrom } from './sourceWebpackFrom'

export function reactScriptsDevServer (args: StartFreshDevServerArgs) {
  const { options: { config: { projectRoot } } } = args

  const result = sourceWebpackFrom(
    args,
    path.dirname(require.resolve('react-scripts/package.json', {
      paths: [projectRoot],
    })),
  )

  // result
  //
  //
  //
}
