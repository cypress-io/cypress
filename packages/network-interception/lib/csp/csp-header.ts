import type { OutgoingHttpHeaders } from 'http'

const cspRegExp = /[; ]*([^\n\r; ]+) ?([^\n\r;]+)*/g

export const cspHeaderNames = ['content-security-policy', 'content-security-policy-report-only'] as const

export const nonceDirectives = ['script-src-elem', 'script-src', 'default-src']

export const problematicCspDirectives = [
  ...nonceDirectives,
  'child-src', 'frame-src', 'form-action',
]

export const unsupportedCSPDirectives = [
  'frame-ancestors',
  'navigate-to',
  'sandbox',
  'trusted-types',
  'require-trusted-types-for',
]

const caseInsensitiveGetAllHeaders = (headers: OutgoingHttpHeaders, lowercaseProperty: string): string[] => {
  return Object.entries(headers).reduce((acc: string[], [key, value]) => {
    if (key.toLowerCase() === lowercaseProperty) {
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

export function parseCspHeaders (headers: OutgoingHttpHeaders, headerName: string = 'content-security-policy', excludeDirectives: string[] = []): Map<string, string[]>[] {
  const cspHeaders = getCspHeaders(headers, headerName)

  return cspHeaders.reduce((acc: Map<string, string[]>[], cspHeader) => {
    const policies = new Map<string, string[]>()
    let policy = cspRegExp.exec(cspHeader)

    while (policy) {
      const [/* regExpMatch */, directive, values = ''] = policy

      if (!excludeDirectives.includes(directive)) {
        const currentDirective = policies.get(directive) || []

        policies.set(directive, [...currentDirective, ...values.split(' ').filter(Boolean)])
      }

      policy = cspRegExp.exec(cspHeader)
    }

    acc.push(policies)

    return acc
  }, [])
}

export function generateCspDirectives (policies: Map<string, string[]>): string {
  return Array.from(policies.entries()).map(([directive, values]) => `${directive} ${values.join(' ')}`).join('; ')
}
