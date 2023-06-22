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
          query: {}, //reset query params
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
