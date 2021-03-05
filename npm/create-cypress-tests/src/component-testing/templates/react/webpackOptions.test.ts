import { WebpackOptions } from './webpack-options'
import { snapshotPluginsAstCode } from '../../../test-utils'

describe('webpack-options template', () => {
  it('correctly generates plugins config', () => snapshotPluginsAstCode(WebpackOptions))
})
