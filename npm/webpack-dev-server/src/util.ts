import debug from 'debug'

export const WBADebugNamespace = 'cypress-verbose:webpack-dev-server:bundle-analyzer'

export const isWebpackBundleAnalyzerEnabled = () => {
  return debug.enabled(WBADebugNamespace)
}
