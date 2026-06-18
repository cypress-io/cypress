import type { OutgoingHttpHeaders } from 'http'
import {
  cspHeaderNames,
  generateCspDirectives,
  parseCspHeaders,
  problematicCspDirectives,
  unsupportedCSPDirectives,
} from './csp-header'

export type CspAllowListConfig = {
  experimentalCspAllowList?: boolean | string[] | null
}

const removeHeaderCaseInsensitive = (
  headers: Record<string, string | string[]>,
  headerName: string,
): void => {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === headerName) {
      delete headers[key]
    }
  }
}

/**
 * Strip or rewrite CSP headers on a materialized response (proxy + CDP).
 */
export function applyCspAllowListToHeaders (
  headers: Record<string, string | string[]>,
  config: CspAllowListConfig,
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = { ...headers }

  if (config.experimentalCspAllowList) {
    const allowedDirectives = config.experimentalCspAllowList === true
      ? []
      : config.experimentalCspAllowList

    const stripDirectives = [
      ...unsupportedCSPDirectives,
      ...problematicCspDirectives.filter((directive) => !allowedDirectives.includes(directive)),
    ]

    for (const headerName of cspHeaderNames) {
      const modifiedCspHeaders = parseCspHeaders(result as OutgoingHttpHeaders, headerName, stripDirectives)
      .map(generateCspDirectives)
      .filter(Boolean)

      removeHeaderCaseInsensitive(result, headerName)

      if (modifiedCspHeaders.length) {
        result[headerName] = modifiedCspHeaders
      }
    }
  } else {
    for (const headerName of cspHeaderNames) {
      removeHeaderCaseInsensitive(result, headerName)
    }
  }

  return result
}
