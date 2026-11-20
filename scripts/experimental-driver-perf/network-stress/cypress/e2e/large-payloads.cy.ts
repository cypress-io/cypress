import { stressNetwork } from '../support/intercepts'
import type { Style } from '../support/intercepts'
import { MB } from '../support/load'

describe('large payloads', () => {
  const downloadStyles: Style[] = ['none', 'wait-each', 'static-stub', 'response-handler']

  ;[1, 10, 25].forEach((megabytes) => {
    downloadStyles.forEach((style) => {
      it(`one ${megabytes}MB JSON response, ${style}`, () => {
        stressNetwork({ count: 1, bytes: megabytes * MB }, style)
      })
    })
  })

  it('one 25MB text response, none', () => {
    stressNetwork({ count: 1, bytes: 25 * MB, kind: 'text' }, 'none')
  })

  it('one 25MB text response, response-handler', () => {
    stressNetwork({ count: 1, bytes: 25 * MB, kind: 'text' }, 'response-handler')
  })

  const uploadStyles: Style[] = ['none', 'wait-each', 'request-handler']

  ;[1, 10].forEach((megabytes) => {
    uploadStyles.forEach((style) => {
      it(`one ${megabytes}MB upload, ${style}`, () => {
        stressNetwork({ count: 1, bytes: megabytes * MB, upload: true }, style)
      })
    })
  })
})
