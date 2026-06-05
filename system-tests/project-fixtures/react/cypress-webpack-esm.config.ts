import { createRequire } from 'module'

// ESM bridge for `"type": "module"` projects (e.g. react19). Loads the CJS-friendly fixture via require.
// @ts-expect-error — import.meta.url requires ESM; this file is only used from type:module projects
const require = createRequire(import.meta.url)

const cypressWebpackConfig = require('./cypress-webpack.config')

export default cypressWebpackConfig.default ?? cypressWebpackConfig
