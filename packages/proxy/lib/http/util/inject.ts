import { oneLine } from 'common-tags'
import { getRunnerInjectionContents, getRunnerCrossOriginInjectionContents } from '@packages/resolve-dist'

export function partial (domain) {
  return oneLine`
    <script type='text/javascript'>
      document.domain = '${domain}';
      delete window.snapshotResult;
      delete window.snapshotAuxiliaryData;
    </script>
  `
}

export function full (domain) {
  return getRunnerInjectionContents().then((contents) => {
    return oneLine`
      <script type='text/javascript'>
        document.domain = '${domain}';
        delete window.snapshotResult;
        delete window.snapshotAuxiliaryData;

        ${contents}
      </script>
    `
  })
}

export function fullCrossOrigin (domain) {
  return getRunnerCrossOriginInjectionContents().then((contents) => {
    return oneLine`
      <script type='text/javascript'>
        document.domain = '${domain}';
        delete window.snapshotResult;
        delete window.snapshotAuxiliaryData;

        ${contents}
      </script>
    `
  })
}
