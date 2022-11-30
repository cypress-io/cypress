import Bluebird from 'bluebird'
import { $Location } from '../../../cypress/location'

export async function mapOrigins (Cypress: Cypress.Cypress, origins: string | Array<string>): Promise<Array<string>> {
  const getOrigins = Bluebird.map(
    ([] as string[]).concat(origins), async (origin) => {
      if (origin === '*') {
        return await getAllHtmlOrigins(Cypress)
      }

      if (origin === 'currentOrigin') {
        return $Location.create(window.location.href).origin
      }

      return $Location.create(origin).origin
    },
  )

  return _.uniq(_.flatten(await getOrigins))
}

export async function getAllHtmlOrigins (Cypress: Cypress.Cypress) {
  const currentOrigin = $Location.create(window.location.href).origin
  const storedOrigins = await Cypress.backend('get:rendered:html:origins')
  const origins = [..._.keys(storedOrigins), currentOrigin]

  return _.uniq(origins)
}
