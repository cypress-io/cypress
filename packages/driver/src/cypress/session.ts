import _ from 'lodash'

type LocalStorageResult = {domain: string, value: string}[]
export function create (Cypress) {
  const { Promise } = Cypress
  const session = {

    async clearCurrentSessionData () {
      window.localStorage.clear()
      window.sessionStorage.clear()
      await Cypress.automation('clear:cookies', {})
    },

    async getCurrentSessionData () {
      const LS = window.localStorage
      const SS = window.sessionStorage
      const cookies = await Cypress.automation('get:cookies', {})

      const ses = {
        name,
        localStorage: LS,
        sessionStorage: SS,
        cookies,
      }

      return ses
    },

    getSession (name) {
      return Cypress.backend('get:session', name)
    },

    async saveSession (name: string) {
      const ses = await session.getCurrentSessionData()

      return Cypress.backend('save:session', { ...ses, name })
    },

    async getCurrentSessionDataForUrls (urls) {
      const httpsDomains = _.filter(urls, (v) => v.startsWith('https'))

      const numDomains = urls.length

      if (httpsDomains.length) {
        const ret = Cypress.backend('stubDomainForAutomation', httpsDomains.map((v) => v.replace('https://', '')))

        await ret
      }

      Cypress.$(`<iframe style="display:none" src="${`${httpsDomains[0]}/__cypress/automation`}"></iframe>`).appendTo(Cypress.$('body', window.document))

      return new Promise((resolve) => {
        const results: LocalStorageResult = []

        window.addEventListener('message', ((event) => {
          results.push({ domain: event.origin, value: JSON.parse(event.data) })
          if (results.length === numDomains) {
            resolve(results)
          }
        }))
      }).timeout(10000)
    },
  }

  return session
}
