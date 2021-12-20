import type { Configuration } from 'webpack'

export function checkSWC (
  webpackConfig: Configuration,
  cypressConfig: Cypress.Config,
) {
  const hasSWCLoader = webpackConfig.module?.rules.some((rule) => {
    return rule.oneOf?.some(
      (oneOf) => (oneOf.use as any)?.loader === 'next-swc-loader'
    )
  })

  if (hasSWCLoader && cypressConfig.nodeVersion !== 'system') {
    throw new Error(`Cypress requires "nodeVersion" to be set to "system" in order to run Next.js with SWC optimizations.
Please add "nodeVersion": "system" to your Cypress configuration and try again.`)
  }

  return false
}
