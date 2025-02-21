import { expect } from 'chai'
import { requireScript } from '../../../lib/cloud/require_script'

describe('require_script', () => {
  it('requires the script correctly', () => {
    const script = `
      module.exports = {
        AppStudio: class {
          constructor ({ studioPath }) {
            this.studioPath = studioPath
          }
        }
      }
    `
    const { AppStudio } = requireScript(script)

    const studio = new AppStudio({ studioPath: '/path/to/studio' })

    expect(studio.studioPath).to.equal('/path/to/studio')
  })
})
