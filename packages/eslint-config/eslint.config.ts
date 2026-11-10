import { baseConfig } from './src/baseConfig'
import { jsonConfig } from './src/jsonConfig'
import { nodeConfig } from './src/nodeConfig'

export default [
  ...baseConfig,
  ...jsonConfig,
  ...nodeConfig,
]
