import _ from 'lodash'
import $ from 'jquery'
import $Location from '../cypress/location'

type LocalStorageResult = {origin: string, value: object}
type LocalStorageOptions = {origin: string, value: object, clear?: boolean}

export function create (Cypress, state) {
  const { Promise } = Cypress

  async function mapOrigins (origins) {
    const current_origin = $Location.create(window.location.href).originPolicy

    return _.uniq(_.flatten(await Promise.map(
      ([] as string[]).concat(origins), async (v) => {
        if (v === '*') {
          return _.keys(await Cypress.backend('get:fetchedHTMLOrigins'))
        }

        return v === 'current_origin' ? current_origin : $Location.create(v).originPolicy
      },
    )))
  }

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

    /**
     * 1) if we only need current_origin localStorage, access sync
     * 2) if cross-origin http, we need to load in iframe from our proxy that will intercept all http reqs at /__cypress/automation/*
     *      and postMessage() the localStorage value to us
     * 3) if cross-origin https, since we pass-thru https conntections in the proxy, we need to
     *      send a message telling our proxy server to intercept the next req to the https domain,
     *      then follow 2)
     */
    async getLocalStorage (options = {}) {
      const specWindow = state('specWindow')

      if (!_.isObject(options)) {
        throw new Error('getLocalStorage() takes an object')
      }

      const opts = _.defaults({}, options, {
        origin: 'current_origin',
      })

      const current_origin = $Location.create(window.location.href).originPolicy

      const urls = await mapOrigins(opts.origin)

      const results = [] as LocalStorageResult[]

      const currentOriginIndex = urls.indexOf(current_origin)

      if (currentOriginIndex !== -1) {
        urls.splice(currentOriginIndex, 1)
        results.push({ origin: current_origin, value: JSON.parse(JSON.stringify(window.localStorage)) })
      }

      if (_.isEmpty(urls)) {
        return results
      }

      const iframes: JQuery<HTMLElement>[] = []

      const $iframeContainer = $(`<div style="display:none"></div>`).appendTo($('body', specWindow.document))

      _.each(urls, (u) => {
        const $iframe = $(`<iframe src="${`${u}/__cypress/automation/getLocalStorage`}"></iframe>`)

        $iframe.appendTo($iframeContainer)
        iframes.push($iframe)
      })

      let onPostMessage
      const crossOriginResults = await new Promise((resolve) => {
        const crossOriginResults: LocalStorageResult[] = []

        onPostMessage = ((event) => {
          const data = event.data

          if (data.type !== 'localStorage') return

          crossOriginResults.push({ origin: event.origin, value: JSON.parse(data.value) })
          if (crossOriginResults.length === urls.length) {
            resolve(crossOriginResults)
          }
        })

        specWindow.addEventListener('message', onPostMessage)
      })
      .timeout(10000)
      .finally(() => {
        specWindow.removeEventListener('message', onPostMessage)
        $iframeContainer.remove()
      })

      return [...results, ...crossOriginResults]
    },

    async setLocalStorage (options: LocalStorageResult) {
      const specWindow = state('specWindow')

      const current_origin = $Location.create(window.location.href).originPolicy as string

      const originOptions = _.chain([] as LocalStorageResult[])
      .concat(options)
      .each((v) => v.origin = v.origin && v.origin !== 'current_origin' ? $Location.create(v.origin).originPolicy : current_origin)
      .value() as LocalStorageOptions[]

      const current_origin_options_index = _.findIndex(originOptions, { origin: current_origin })

      if (current_origin_options_index !== -1) {
        const currentOriginOptions = originOptions.splice(current_origin_options_index, 1)[0]

        if (currentOriginOptions.clear) {
          window.localStorage.clear()
        }

        _.each(currentOriginOptions.value, (val, key) => localStorage.setItem(key, val))
      }

      if (_.isEmpty(originOptions)) {
        return
      }

      const origins = originOptions.map((v) => v.origin)

      const iframes: JQuery<HTMLElement>[] = []

      const $iframeContainer = $(`<div style="display:none"></div>`).appendTo($('body', specWindow.document))

      _.each(origins, (u) => {
        const $iframe = $(`<iframe src="${`${u}/__cypress/automation/setLocalStorage`}"></iframe>`)

        $iframe.appendTo($iframeContainer)
        iframes.push($iframe)
      })

      let onPostMessage

      await new Promise((resolve) => {
        let count = 0

        onPostMessage = (event) => {
          const data = event.data

          if (data.type === 'set:localStorage:load') {
            if (!event.source) {
              throw new Error('failed to get localStorage')
            }

            const opts = _.find(originOptions, { origin: event.origin })!

            event.source.postMessage({ type: 'set:localStorage:data', value: opts.value, clear: opts.clear }, '*')
          } else if (data.type === 'set:localStorage:complete') {
            count++
            if (count === origins.length) {
              resolve()
            }
          }
        }

        specWindow.addEventListener('message', onPostMessage)
      })
      .timeout(10000)
      .finally(() => {
        specWindow.removeEventListener('message', onPostMessage)
        $iframeContainer.remove()
      })
    },

  }

  return session
}
