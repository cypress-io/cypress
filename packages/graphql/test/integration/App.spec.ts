import { expect } from 'chai'
import { initGraphql, makeRequest, TestContext } from './utils'

describe('App', () => {
  describe('authenticate', () => {
    it('assigns a new user', async () => {
      const context = new TestContext()
      const { endpoint } = await initGraphql(context)

      const result = await makeRequest(endpoint, `
        mutation Login {
          login {
            email
            name
            authToken
          }
        }
      `)

      expect(result).to.eql({
        login: {
          email: 'test@cypress.io',
          name: 'cypress test',
          authToken: 'test-auth-token',
        },
      })
    })
  })
})
