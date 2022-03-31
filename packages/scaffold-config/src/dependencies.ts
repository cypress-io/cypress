export const WIZARD_DEPENDENCY_WEBPACK = {
  type: 'webpack',
  name: 'Webpack',
  package: 'webpack',
  description: 'Webpack is a module bundler',
  minVersion: '>=4.0.0'
} as const

export const WIZARD_DEPENDENCY_TYPESCRIPT = {
  type: 'typescript',
  name: 'TypeScript',
  package: 'typescript',
  description: 'TypeScript is a language for application-scale JavaScript',
  minVersion: '>=3.0.0'
} as const

export const WIZARD_DEPENDENCY_REACT_SCRIPTS = {
  type: 'reactscripts',
  name: 'React Scripts',
  package: 'react-scripts',
  description: 'Create React apps with no build configuration',
  minVersion: '>=4.0.0'
} as const

export const WIZARD_DEPENDENCY_VUE_CLI_SERVICE = {
  type: 'vuecliservice',
  name: 'Vue CLI',
  package: '@vue/cli-service',
  description: 'Standard Tooling for Vue.js Development',
  minVersion: '>=4.0.0'
} as const

export const WIZARD_DEPENDENCY_VITE = {
  type: 'vite',
  name: 'Vite',
  package: 'vite',
  description: 'Vite is dev server that serves your source files over native ES modules',
  minVersion: '^2.0.0'
} as const

export const WIZARD_DEPENDENCY_NUXT = {
  type: 'nuxt',
  name: 'Nuxt',
  package: 'nuxt',
  description: 'The Intuitive Vue Framework',
  minVersion: '^2.0.0'
} as const

export const WIZARD_DEPENDENCY_NEXT = {
  type: 'next',
  name: 'Next',
  package: 'next',
  description: 'The React Framework for Production',
  minVersion: '>=10.0.0'
} as const

export const WIZARD_DEPENDENCIES = [
  WIZARD_DEPENDENCY_WEBPACK,
  WIZARD_DEPENDENCY_TYPESCRIPT,
  WIZARD_DEPENDENCY_REACT_SCRIPTS,
  WIZARD_DEPENDENCY_VUE_CLI_SERVICE,
  WIZARD_DEPENDENCY_VITE,
  WIZARD_DEPENDENCY_NUXT,
  WIZARD_DEPENDENCY_NEXT,
] as const