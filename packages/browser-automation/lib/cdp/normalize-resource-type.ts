import type { ResourceType } from '@packages/network-interception'

const validResourceTypes: ResourceType[] = [
  'document', 'fetch', 'xhr', 'websocket', 'stylesheet', 'script', 'image',
  'font', 'cspviolationreport', 'ping', 'manifest', 'other',
]

const resourceTypeAliases: Record<string, ResourceType> = {
  img: 'image',
  csp: 'cspviolationreport',
  webmanifest: 'manifest',
}

export function normalizeResourceType (resourceType: string | undefined): ResourceType {
  resourceType = resourceType ? resourceType.toLowerCase() : 'unknown'

  if (validResourceTypes.includes(resourceType as ResourceType)) {
    return resourceType as ResourceType
  }

  return resourceTypeAliases[resourceType] ?? 'other'
}
