import { baseConfig } from './src/baseConfig'
import { jsonConfig } from './src/jsonConfig'
import { nodeConfig } from './src/nodeConfig'
import { regexpConfig } from './src/regexpConfig'

export default [
  ...baseConfig,
  ...regexpConfig,
  ...jsonConfig,
  ...nodeConfig,
]
