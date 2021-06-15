/**
 * Recommended dependencies to install based on the framework/dev server selected.
 * Some of the framework/dev server combinations are listed here:
 * https://docs.cypress.io/guides/component-testing/framework-configuration
 */

type Library = 'react 16' | 'react 17' | 'vue 2' | 'vue 3'
type Bundler = 'vite' | 'webpack 4' | 'webpack 5'
type ProjectTemplate = 'react-scripts' | 'vue-cli' | 'next.js (webpack 4)' | 'next.js (webpack 5)' | 'nuxt (vue 2)'

export interface Dependency {
  packageName: string
  description: string
  link: string
}

interface SupportedBase {
  id: string
  displayName: string
  images: string[]
  dependencies: Dependency[]
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

const cypressReact: Dependency = {
  packageName: '@cypress/react',
  description: 'All component tests must start with a mount command.',
  link: '?',
}

const cypressVue: Dependency = {
  packageName: '@cypress/vue',
  description: 'All component tests must start with a mount command.',
  link: '?',
}

export const cypressWebpackDevServer: Dependency = {
  packageName: '@cypress/webpack-dev-server',
  description: 'Cypress will use your existing build configuration to bundle and run your tests.',
  link: '?',
}

const htmlWebpackPlugin = (version: number): Dependency => {
  return {
    packageName: `html-webpack-plugin@${version}`,
    description: 'Ensure all your bundled code is correct injected into the base html template.',
    link: '?',
  }
}

export const frameworks: SupportedFramework[] = [
  {
    id: '1',
    type: 'libraries',
    displayName: 'React 16 x Webpack 4',
    library: 'react 16',
    bundler: 'webpack 4',
    images: ['react', 'webpack'],
    dependencies: [cypressReact, cypressWebpackDevServer, htmlWebpackPlugin(4)],
  },
  {
    id: '2',
    type: 'libraries',
    displayName: 'React 17 x Webpack 5',
    library: 'react 17',
    bundler: 'webpack 5',
    images: ['react', 'webpack'],
    dependencies: [cypressReact, cypressWebpackDevServer, htmlWebpackPlugin(5)],
  },
  {
    id: '3',
    type: 'libraries',
    displayName: 'Vue 3 x Webpack 4',
    library: 'vue 3',
    bundler: 'webpack 4',
    images: ['webpack', 'vue'],
    dependencies: [cypressVue, cypressWebpackDevServer, htmlWebpackPlugin(4)],
  },
  {
    id: '4',
    type: 'template',
    displayName: 'ReactJs 17 x NextJs 10 (Webpack 4)',
    template: 'next.js (webpack 4)',
    images: ['react', 'nextjs'],
    dependencies: [cypressReact, cypressWebpackDevServer, htmlWebpackPlugin(4)],
  },
  {
    id: '5',
    type: 'template',
    displayName: 'ReactJs 17 x NextJs 10 (Webpack 5)',
    template: 'next.js (webpack 5)',
    images: ['react', 'nextjs'],
    dependencies: [cypressReact, cypressWebpackDevServer, htmlWebpackPlugin(5)],
  },
  {
    id: '6',
    type: 'template',
    displayName: 'Vue 2 x Nuxt',
    template: 'nuxt (vue 2)',
    images: ['vue', 'nuxt'],
    dependencies: [cypressVue, cypressWebpackDevServer, htmlWebpackPlugin(4)],
  },
  {
    id: '7',
    type: 'libraries',
    displayName: 'Vue 3 x Vite',
    library: 'vue 3',
    bundler: 'vite',
    images: ['vue', 'vite'],
    dependencies: [cypressVue, cypressWebpackDevServer, htmlWebpackPlugin(4)],
  },
]
