import { oneLine } from 'common-tags'
import { getRunnerInjectionContents, getRunnerCrossOriginInjectionContents } from '@packages/resolve-dist'
import type { AutomationCookie } from '@packages/server/lib/automation/cookies'

interface InjectionOpts {
  cspNonce?: string
  shouldInjectDocumentDomain: boolean
}
interface FullCrossOriginOpts {
  modifyObstructiveThirdPartyCode: boolean
  modifyObstructiveCode: boolean
  simulatedCookies: AutomationCookie[]
}

export function partial (domain, options: InjectionOpts) {
  const { cspNonce } = options
  let documentDomainInjection = `document.domain = '${domain}';`

  if (!options.shouldInjectDocumentDomain) {
    documentDomainInjection = ''
  }

  // With useDefaultDocumentDomain=true we continue to inject an empty script tag in order to be consistent with our other forms of injection.
  // This is also diagnostic in nature is it will allow us to debug easily to make sure injection is still occurring.
  return oneLine`
    <script type='text/javascript'${
      cspNonce ? ` nonce="${cspNonce}"` : ''
    }>
      ${documentDomainInjection}
    </script>
  `
}

export function full (domain, options: InjectionOpts) {
  const { cspNonce } = options

  return getRunnerInjectionContents().then((contents) => {
    let documentDomainInjection = `document.domain = '${domain}';`

    if (!options.shouldInjectDocumentDomain) {
      documentDomainInjection = ''
    }

    return oneLine`
      <script type='text/javascript'${
        cspNonce ? ` nonce="${cspNonce}"` : ''
      }>
        ${documentDomainInjection}

        ${contents}
      </script>
    `
  })
}

export async function fullCrossOrigin (domain, options: InjectionOpts & FullCrossOriginOpts) {
  const contents = await getRunnerCrossOriginInjectionContents()
  const { cspNonce, ...crossOriginOptions } = options

  let documentDomainInjection = `document.domain = '${domain}';`

  if (!options.shouldInjectDocumentDomain) {
    documentDomainInjection = ''
  }

  return oneLine`
    <script type='text/javascript'${
      cspNonce ? ` nonce="${cspNonce}"` : ''
    }>
      ${documentDomainInjection}

      (function (cypressConfig) {
        ${contents}
      }(${JSON.stringify(crossOriginOptions)}));
    </script>
  `
}
