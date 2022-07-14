import type { Plugin } from 'vite'
import path from 'path'
import debugLib from 'debug'

const debug = debugLib('cypress:vite-dev-server:plugins:react18')

/**
 * React 18 has changed it's API.
 * https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#updates-to-client-rendering-apis
 * We need to conditionally import `react-dom/client` in our React adapter:
 *
 *   import('react-dom/client', (mod) => {...})
 *
 * In a browser environment, we can just try/catch, however Vite does some optimizations
 * and will fail during this step if react-dom/client does not exist (React <= 17).
 *
 * To avoid this error and seamlessly support React 17 and 18 side by side we simply
 * stub out the dynamic react-dom/client import and return a placeholder module.
 */
export const React18 = (projectRoot: string): Plugin => {
  return {
    name: 'cypress:missing-react-dom-client',
    resolveId (source: string) {
      debug('source is %s', source)
      if (source === 'react-dom/client') {
        try {
          return require.resolve('react-dom/client', { paths: [projectRoot] })
        } catch (e) {
          debug('error resolving %s, falling back to client/reactDomClientPlaceholder.js', source)

          // This is not a react 18 project, need to stub out to avoid error
          return path.resolve(__dirname, '..', '..', 'client', 'reactDomClientPlaceholder.js')
        }
      }
    },
  }
}
