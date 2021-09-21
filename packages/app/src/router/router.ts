import { createWebHashHistory, createRouter as _createRouter } from 'vue-router'
import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'virtual:generated-layouts'

export const baseUrl = '__vite__'

export const createRouter = () => {
  const routes = setupLayouts(generatedRoutes)

  return _createRouter({
    history: createWebHashHistory(),
    routes,
  })
}
