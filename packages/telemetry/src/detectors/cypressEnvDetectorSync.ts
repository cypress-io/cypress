import type { DetectorSync, ResourceAttributes, IResource } from '@opentelemetry/resources'
import { Resource } from '@opentelemetry/resources'

/**
 * CypressEnvDetectorSync can be used to detect the presence of and create a Resource
 * from Cypress env variables.
 */
class CypressEnvDetectorSync implements DetectorSync {
  /**
   * Returns a {@link Resource} populated with attributes from the
   * Cypress environment variable.
   *
   * @param config The resource detection config -- ignored
   */
  detect (): IResource {
    const attributes: ResourceAttributes = {}

    Object.entries(process.env).forEach(([key, val]) => {
      if (key.startsWith('CYPRESS_') && val) {
        const attrName = key.replace('CYPRESS_', 'cypress.env.').toLowerCase().replaceAll('_', '.')

        if (key === 'CYPRESS_RECORD_KEY') {
          attributes[attrName] = '<redacted>'
        } else if (key === 'CYPRESS_EXPERIMENT') {
          attributes['experiment'] = val
        } else {
          attributes[attrName] = `${val.slice(0, 3)}***`
        }
      }
    })

    return new Resource(attributes)
  }
}

export const cypressEnvDetectorSync = new CypressEnvDetectorSync()
