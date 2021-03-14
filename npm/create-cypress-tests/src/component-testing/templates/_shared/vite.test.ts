import { ViteTemplate } from './vite'
import { snapshotPluginsAstCode } from '../../../test-utils'

describe('vue: vite template', () => {
  it('correctly generates plugins config', () => snapshotPluginsAstCode(ViteTemplate))
})
