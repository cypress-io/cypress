import { createRouter as _createRouter, createWebHashHistory } from 'vue-router'
import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'virtual:generated-layouts'

export const createRouter = () => {
  const routes = setupLayouts(generatedRoutes)

  const defaultRoute = generatedRoutes.find((route) => route.meta?.default)

  if (defaultRoute) {
    routes.push({
      path: '/',
      redirect: defaultRoute.path,
    })
  }

  return _createRouter({
    history: createWebHashHistory(),
    routes,
  })
}
