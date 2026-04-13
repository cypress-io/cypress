import Bluebird from 'bluebird'
import { $Location } from '../../../cypress/location'

export async function mapOrigins (Cypress: Cypress.Cypress, origins: string | string[]): Promise<string[]> {
  const getOrigins = Bluebird.map(
    ([] as string[]).concat(origins), async (origin) => {
      if (origin === '*') {
        return await getAllHtmlOrigins(Cypress)
      }

      if (origin === 'currentOrigin') {
        return window.location.origin
      }

      return $Location.create(origin).origin
    },
  )

  return [...new Set((await getOrigins).flat())]
}

export async function getAllHtmlOrigins (Cypress: Cypress.Cypress) {
  const currentOrigin = window.location.origin
  const storedOrigins = await Cypress.backend('get:rendered:html:origins')
  const origins = [...Object.keys(storedOrigins), currentOrigin]

  return [...new Set(origins)]
}
