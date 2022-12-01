import { getStorage, setStorage } from '../../../../src/cy/commands/sessions/storage'

describe('src/cy/commands/sessions/storage', () => {
  describe('setStorage()', () => {
    it('returns unique origins when requesting all origins', () => {
      cy.visit('http://localhost:3500/fixtures/generic.html')
      .then(() => {
        localStorage.key1 = 'val1'

        return setStorage(Cypress, { localStorage: [{ value: { key2: 'val2' } }] })
      })
      .then(() => {
        expect(window.localStorage.key2).equal('val2')
      })
      .then(() => {
        return setStorage(Cypress, {
          localStorage: [
            // set localStorage on different origin
            { origin: 'http://www.foobar.com:3500', value: { key2: 'val' }, clear: true },
            // set localStorage on current origin
            { value: { key3: 'val' }, clear: true },
          ],
        })
      })
      .then(() => getStorage(Cypress, { origin: ['current_url', 'http://www.foobar.com:3500'] }))
      .then((result) => {
        expect(result).deep.equal({
          localStorage: [
            { origin: 'http://localhost:3500', value: { key3: 'val' } },
            { origin: 'http://www.foobar.com:3500', value: { key2: 'val' } },
          ],
          sessionStorage: [],
        })
      })
    })
  })
})
