/**
 * Recommended dependencies to install based on the framework/dev server selected.
 * Some of the framework/dev server combinations are listed here:
 * https://docs.cypress.io/guides/component-testing/framework-configuration
 */

type Library = 'react 16' | 'react 17' | 'vue 2' | 'vue 3'
type Bundler = 'vite' | 'webpack 4' | 'webpack 5'
type ProjectTemplate = 'react-scripts' | 'vue-cli' | 'next.js (webpack 4)' | 'next.js (webpack 5)' | 'nuxt (vue 2)'

interface SupportedBase {
  id: string
  displayName: string
  dependencies: string[]
}

interface SupportedLibraryCombination extends SupportedBase {
  type: 'libraries'
  library: Library
  bundler: Bundler
}

interface SupportedTemplate extends SupportedBase {
  type: 'template'
  template: ProjectTemplate
}

export type SupportedFramework = SupportedLibraryCombination | SupportedTemplate

export const frameworks: SupportedFramework[] = [
  {
    id: '1',
    type: 'libraries',
    displayName: 'React 16 x Webpack 4',
    library: 'react 16',
    bundler: 'webpack 4',
    dependencies: ['@cypress/react', '@cypress/webpack-dev-server', ' html-webpack-plugin@4'],
  },
  {
    id: '2',
    type: 'libraries',
    displayName: 'React 17 x Webpack 5',
    library: 'react 17',
    bundler: 'webpack 5',
    dependencies: ['@cypress/react', '@cypress/webpack-dev-server', ' html-webpack-plugin@5'],
  },
  {
    id: '3',
    type: 'libraries',
    displayName: 'Vue 3 x Webpack 3',
    library: 'vue 3',
    bundler: 'webpack 4',
    dependencies: ['@cypress/vue@next', '@cypress/webpack-dev-server', ' html-webpack-plugin@4'],
  },
]
