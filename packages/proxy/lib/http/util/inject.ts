import { oneLine } from 'common-tags'
import { getRunnerInjectionContents, getRunnerMultidomainInjectionContents } from '@packages/resolve-dist'

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

export function fullMultidomain (domain) {
  return getRunnerMultidomainInjectionContents().then((contents) => {
    return oneLine`
      <script type='text/javascript'>
        document.domain = '127.0.0.1';

        ${contents}
      </script>
    `
  })
}
