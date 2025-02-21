import { expect } from 'chai'
import { requireScript } from '../../../lib/cloud/require_script'

describe('require_script', () => {
  it('requires the script correctly', () => {
    const script = `
      module.exports = {
        StudioManager: class {
          constructor ({ studioPath }) {
            this.studioPath = studioPath
          }
        }
      }
    `
    const { StudioManager } = requireScript<{ StudioManager: any }>(script)

    const studio = new StudioManager({ studioPath: '/path/to/studio' })

    expect(studio.studioPath).to.equal('/path/to/studio')
  })
})
