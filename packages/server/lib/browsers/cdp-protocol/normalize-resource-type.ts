import type { ResourceType } from '@packages/proxy'

// the resource types passed through to request middleware / cy.intercept matching; any
// other type reported by the protocol (e.g. 'document', 'media', 'preflight') normalizes to 'other'
// CDP: https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-ResourceType
export const validResourceTypes: ResourceType[] = ['fetch', 'xhr', 'websocket', 'stylesheet', 'script', 'image', 'font', 'cspviolationreport', 'ping', 'manifest', 'other']

export const normalizeResourceType = (resourceType: string | undefined): ResourceType => {
  resourceType = resourceType ? resourceType.toLowerCase() : 'unknown'
  if (validResourceTypes.includes(resourceType as ResourceType)) {
    return resourceType as ResourceType
  }

  return 'other'
}
