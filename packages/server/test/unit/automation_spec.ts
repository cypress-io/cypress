import '../spec_helper'
import _ from 'lodash'
import { Automation } from '../../lib/automation'

describe('lib/automation', () => {
  beforeEach(function () {
    // @ts-expect-error
    this.automation = new Automation({})
  })

  describe('.reset', () => {
    it('resets middleware', function () {
      const m = this.automation.getMiddleware()

      // all props are null by default
      expect(_.omitBy(m, _.isNull)).to.deep.eq({})

      const onRequest = function () {}
      const onPush = function () {}

      this.automation.use({ onRequest, onPush })

      expect(this.automation.getMiddleware().onRequest).to.eq(onRequest)
      expect(this.automation.getMiddleware().onPush).to.eq(onPush)

      this.automation.reset()

      expect(this.automation.getMiddleware().onRequest).to.be.null

      // keep around onPush
      expect(this.automation.getMiddleware().onPush).to.eq(onPush)
    })
  })

  describe('clear:all:cookies', () => {
    it('enumerates matching cookies then clears them in a single request', async function () {
      const requested: Array<[string, any]> = []

      this.automation.use({
        onRequest: (message, data) => {
          requested.push([message, data])

          if (message === 'get:cookies') {
            return Promise.resolve([
              { name: 'foo', domain: 'localhost' },
              { name: 'bar', domain: 'localhost' },
            ])
          }

          // the browser echoes back the cleared cookies
          return Promise.resolve(data)
        },
      })

      const cleared = await this.automation.request('clear:all:cookies', { domain: 'localhost' }, () => {})

      // the driver issues a single `clear:all:cookies` request; the server
      // fans it out into `get:cookies` + `clear:cookies` against the browser
      expect(requested.map((r) => r[0])).to.deep.eq(['get:cookies', 'clear:cookies'])
      expect(requested[0][1]).to.deep.eq({ domain: 'localhost' })
      expect(cleared).to.have.length(2)
      expect(cleared[0]).to.include({ name: 'foo' })
      expect(cleared[1]).to.include({ name: 'bar' })
    })

    it('does not issue clear:cookies when there are no matching cookies', async function () {
      const requested: string[] = []

      this.automation.use({
        onRequest: (message) => {
          requested.push(message)

          if (message === 'get:cookies') {
            return Promise.resolve([])
          }

          return Promise.resolve()
        },
      })

      const cleared = await this.automation.request('clear:all:cookies', {}, () => {})

      expect(requested).to.deep.eq(['get:cookies'])
      expect(cleared).to.deep.eq([])
    })
  })
})
