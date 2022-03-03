import { oneLine } from 'common-tags'
import { getRunnerInjectionContents, getRunnerMultiDomainInjectionContents } from '@packages/resolve-dist'

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

export function fullMultiDomain (domain) {
  return getRunnerMultiDomainInjectionContents().then((contents) => {
    return oneLine`
      <script type='text/javascript'>
        document.domain = '${domain}';

        ${contents}
      </script>
    `
  })
}
