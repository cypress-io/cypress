import type { OutgoingHttpHeaders } from 'http'

const cspRegExp = /[; ]*(.+?) +([^\n\r;]*)/g

const caseInsensitiveGetAllHeaders = (headers: OutgoingHttpHeaders, lowercaseProperty: string): string[] => {
  return Object.entries(headers).reduce((acc: string[], [key, value]) => {
    if (key.toLowerCase() === lowercaseProperty) {
      // It's possible to set more than 1 CSP header, and in those instances CSP headers
      // are NOT merged by the browser. Instead, the most **restrictive** CSP header
      // that applies to the given resource will be used.
      // https://www.w3.org/TR/CSP2/#content-security-policy-header-field
      //
      // Therefore, we need to return each header as it's own value so we can apply
      // injection nonce values to each one, because we don't know which will be
      // the most restrictive.
      acc.push.apply(
        acc,
        `${value}`.split(',')
        .filter(Boolean)
        .map((policyString) => `${policyString}`.trim()),
      )
    }

    return acc
  }, [])
}

function getCspHeaders (headers: OutgoingHttpHeaders, headerName: string = 'content-security-policy'): string[] {
  return caseInsensitiveGetAllHeaders(headers, headerName.toLowerCase())
}

export function hasCspHeader (headers: OutgoingHttpHeaders, headerName: string = 'content-security-policy') {
  return getCspHeaders(headers, headerName).length > 0
}

export function parseCspHeaders (headers: OutgoingHttpHeaders, headerName: string = 'content-security-policy'): Map<string, string[]>[] {
  const cspHeaders = getCspHeaders(headers, headerName)

  // We must make an policy map for each CSP header individually
  return cspHeaders.reduce((acc: Map<string, string[]>[], cspHeader) => {
    const policies = new Map<string, string[]>()
    let policy = cspRegExp.exec(cspHeader)

    while (policy) {
      const [/* regExpMatch */, directive, values] = policy
      const currentDirective = policies.get(directive) || []

      policies.set(directive, [...currentDirective, ...values.split(' ').filter(Boolean)])
      policy = cspRegExp.exec(cspHeader)
    }

    return [...acc, policies]
  }, [])
}

export function generateCspDirectives (policies: Map<string, string[]>): string {
  return Array.from(policies.entries()).map(([directive, values]) => `${directive} ${values.join(' ')}`).join('; ')
}
