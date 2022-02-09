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

  // "resolvedNodePath" is only set when using the user's Node.js, which is required to compile Next.js with SWC optimizations
  // If it is not set, they have either explicitly set "nodeVersion" to "bundled" or are are using Cypress < 9.0.0 where it was set to "bundled" by default
  if (hasSWCLoader && !cypressConfig.resolvedNodePath) {
    throw new Error(`Cannot compile Next.js application with configured Node.js.
If you are on Cypress version >= \`9.0.0\`, remove the "nodeVersion" property from your Cypress config. Otherwise, please add "nodeVersion": "system" to your Cypress config and try again.`)
  }

  return false
}
