import { createRouter as _createRouter, createWebHashHistory } from 'vue-router'
import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'virtual:generated-layouts'

/**
 * Generated Routes are created via https://github.com/hannoeru/vite-plugin-pages
 * The generates are based on the files contained in src/pages.
 * See README.md this package for more details
 */

export const createRouter = () => {
  const routes = setupLayouts(generatedRoutes)

  const defaultRoute = generatedRoutes.find((route) => route.meta?.default)

  if (defaultRoute) {
    routes.push({
      path: '/',
      redirect: defaultRoute.path,
    })
  }

  /**
   * Redirect route useful for passing page params when routing to a particular page
   *
   * @param name route name
   * @param params url encoded JSON object of page component params
   *
   * @example
   * // redirects to the Debug page passing a parameter of `from` set to `notification`
   * "/redirect?name=Debug&params=%7B%22from%22%3A%22notification%22%7D"
   *
   * @see changeUrlToDebug in packages/server/lib/open_project.ts
   */
  routes.push({
    path: '/redirect',
    redirect: (from) => {
      if (from.query.name) {
        if (typeof from.query.name !== 'string') {
          throw new Error(`name should be a single string but got: ${from.query.name}`)
        }

        let params = {}

        if (from.query.params) {
          if (typeof from.query.params !== 'string') {
            throw new Error(`params should be a string but got: ${from.query.params}`)
          }

          try {
            params = JSON.parse(from.query.params)
          } catch {
            throw new Error(`params was not valid JSON: ${from.query.params}`)
          }
        }

        return {
          name: from.query.name,
          params,
          query: {}, //reset query params so they do not get passed on
        }
      }

      return { path: '/' }
    },
  })

  return _createRouter({
    history: createWebHashHistory(),
    routes,
  })
}
