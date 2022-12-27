import { oneLine } from 'common-tags'
import { getRunnerInjectionContents, getRunnerCrossOriginInjectionContents } from '@packages/resolve-dist'
import type { AutomationCookie } from '@packages/server/lib/automation/cookies'

interface FullCrossOriginOpts {
  modifyObstructiveThirdPartyCode: boolean
  modifyObstructiveCode: boolean
  simulatedCookies: AutomationCookie[]
}

export function partial (domain) {
  return oneLine`
    <script type='text/javascript'>
      document.domain = '${domain}';
    </script>
  `
}

export function full (domain) {
  return getRunnerInjectionContents().then((contents) => {
    return oneLine`
      <script type='text/javascript'>
        document.domain = '${domain}';

        ${contents}
      </script>
    `
  })
}

export async function fullCrossOrigin (domain, options: FullCrossOriginOpts) {
  const contents = await getRunnerCrossOriginInjectionContents()

  return oneLine`
    <script type='text/javascript'>
      document.domain = '${domain}';

      (function (cypressConfig) {
        ${contents}
      }(${JSON.stringify(options)}));
    </script>
  `
}
