import { createRouter as _createRouter, createWebHistory } from 'vue-router'
import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'virtual:generated-layouts'

export const createRouter = () => {
  const routes = setupLayouts(generatedRoutes)

  // TODO: clean this up
  const historyBase = window.location.href.includes('__vite__') ? '__vite__' : ''

  return _createRouter({
    history: createWebHistory(historyBase),
    routes,
  })
}
