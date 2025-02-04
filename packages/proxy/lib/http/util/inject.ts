import { oneLine } from 'common-tags'
import { getRunnerInjectionContents, getRunnerCrossOriginInjectionContents } from '@packages/resolve-dist'
import type { SerializableAutomationCookie } from '@packages/server/lib/util/cookies'
import Debug from 'debug'

const debug = Debug('cypress:proxy:http:inject')

interface InjectionOpts {
  cspNonce?: string
  shouldInjectDocumentDomain: boolean
}
interface FullCrossOriginOpts {
  modifyObstructiveThirdPartyCode: boolean
  modifyObstructiveCode: boolean
  simulatedCookies: SerializableAutomationCookie[]
}

function injectCspNonce (options: InjectionOpts) {
  const { cspNonce } = options

  return cspNonce ? ` nonce="${cspNonce}"` : ''
}

export function partial (domain, options: InjectionOpts) {
  debug('partial injection', domain, options)
  let documentDomainInjection = `document.domain = '${domain}';`

  if (!options.shouldInjectDocumentDomain) {
    documentDomainInjection = ''
  }

  // With useDefaultDocumentDomain=true we continue to inject an empty script tag in order to be consistent with our other forms of injection.
  // This is also diagnostic in nature is it will allow us to debug easily to make sure injection is still occurring.
  return oneLine`
    <script type='text/javascript'${injectCspNonce(options)}>
      ${documentDomainInjection}
    </script>
  `
}

export function full (domain, options: InjectionOpts) {
  debug('full injection', domain, options)

  return getRunnerInjectionContents().then((contents) => {
    let documentDomainInjection = `document.domain = '${domain}';`

    if (!options.shouldInjectDocumentDomain) {
      documentDomainInjection = ''
    }

    return oneLine`
      <script type='text/javascript'${injectCspNonce(options)}>
        ${documentDomainInjection}

        ${contents}
      </script>
    `
  })
}

export async function fullCrossOrigin (domain, options: InjectionOpts & FullCrossOriginOpts) {
  debug('cross origin injection', domain, options)
  const contents = await getRunnerCrossOriginInjectionContents()
  const { cspNonce, ...crossOriginOptions } = options

  let documentDomainInjection = `document.domain = '${domain}';`

  if (!options.shouldInjectDocumentDomain) {
    documentDomainInjection = ''
  }

  return oneLine`
    <script type='text/javascript'${injectCspNonce(options)}>
      ${documentDomainInjection}

      (function (cypressConfig) {
        ${contents}
      }(${JSON.stringify(crossOriginOptions)}));
    </script>
  `
}
