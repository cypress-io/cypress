import { stressNetwork } from '../support/intercepts'
import type { Style } from '../support/intercepts'
import { KB } from '../support/load'
import type { Load } from '../support/load'

describe('many small requests', () => {
  const parallel: Load = { count: 500, bytes: KB, concurrency: 6 }
  const styles: Style[] = ['none', 'spy', 'static-stub', 'reply-handler', 'response-handler']

  styles.forEach((style) => {
    it(`500 parallel fetches, ${style}`, () => {
      stressNetwork(parallel, style)
    })
  })

  it('500 parallel XHRs, none', () => {
    stressNetwork({ ...parallel, transport: 'xhr' }, 'none')
  })

  it('500 parallel XHRs, spy', () => {
    stressNetwork({ ...parallel, transport: 'xhr' }, 'spy')
  })

  it('200 sequential fetches, none', () => {
    stressNetwork({ count: 200, bytes: KB, concurrency: 1 }, 'none')
  })

  it('200 sequential fetches, response-handler', () => {
    stressNetwork({ count: 200, bytes: KB, concurrency: 1 }, 'response-handler')
  })

  it('100 parallel fetches, wait-each', () => {
    stressNetwork({ count: 100, bytes: KB, concurrency: 6 }, 'wait-each')
  })
})
