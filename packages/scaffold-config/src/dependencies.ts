export const WIZARD_DEPENDENCY_WEBPACK = {
  type: 'webpack',
  name: 'Webpack',
  package: 'webpack',
  installer: 'webpack',
  description: 'Webpack is a module bundler',
  minVersion: '>=4.0.0',
} as const

export const WIZARD_DEPENDENCY_VUE_2 = {
  type: 'vue',
  name: 'Vue.js 2',
  package: 'vue',
  installer: 'vue@2',
  description: 'The Progressive JavaScript Framework',
  minVersion: '^2.0.0',
} as const

export const WIZARD_DEPENDENCY_VUE_3 = {
  type: 'vue',
  name: 'Vue.js 3',
  package: 'vue',
  installer: 'vue',
  description: 'The Progressive JavaScript Framework',
  minVersion: '^3.0.0',
} as const

export const WIZARD_DEPENDENCY_REACT = {
  type: 'react',
  name: 'React.js',
  package: 'react',
  installer: 'react',
  description: 'A JavaScript library for building user interfaces',
  minVersion: '>=16.x',
} as const

export const WIZARD_DEPENDENCY_REACT_DOM = {
  type: 'react-dom',
  name: 'React DOM',
  package: 'react-dom',
  installer: 'react-dom',
  description: 'This package serves as the entry point to the DOM and server renderers for React',
  minVersion: '>=16.x',
} as const

export const WIZARD_DEPENDENCY_TYPESCRIPT = {
  type: 'typescript',
  name: 'TypeScript',
  package: 'typescript',
  installer: 'typescript',
  description: 'TypeScript is a language for application-scale JavaScript',
  minVersion: '>=3.0.0',
} as const

export const WIZARD_DEPENDENCY_REACT_SCRIPTS = {
  type: 'reactscripts',
  name: 'React Scripts',
  package: 'react-scripts',
  installer: 'react-scripts',
  description: 'Create React apps with no build configuration',
  minVersion: '>=4.0.0',
} as const

export const WIZARD_DEPENDENCY_VUE_CLI_SERVICE = {
  type: 'vuecliservice',
  name: 'Vue CLI',
  package: '@vue/cli-service',
  installer: '@vue/cli-service',
  description: 'Standard Tooling for Vue.js Development',
  minVersion: '>=4.0.0',
} as const

export const WIZARD_DEPENDENCY_VITE = {
  type: 'vite',
  name: 'Vite',
  package: 'vite',
  installer: 'vite',
  description: 'Vite is dev server that serves your source files over native ES modules',
  minVersion: '>=2.0.0',
} as const

export const WIZARD_DEPENDENCY_NUXT = {
  type: 'nuxt',
  name: 'Nuxt',
  package: 'nuxt',
  installer: 'nuxt@2',
  description: 'The Intuitive Vue Framework',
  minVersion: '^2.0.0',
} as const

export const WIZARD_DEPENDENCY_NEXT = {
  type: 'next',
  name: 'Next',
  package: 'next',
  installer: 'next',
  description: 'The React Framework for Production',
  minVersion: '>=10.0.0',
} as const

export const WIZARD_DEPENDENCIES = [
  WIZARD_DEPENDENCY_WEBPACK,
  WIZARD_DEPENDENCY_TYPESCRIPT,
  WIZARD_DEPENDENCY_REACT_SCRIPTS,
  WIZARD_DEPENDENCY_VUE_CLI_SERVICE,
  WIZARD_DEPENDENCY_VITE,
  WIZARD_DEPENDENCY_NUXT,
  WIZARD_DEPENDENCY_NEXT,
  WIZARD_DEPENDENCY_REACT,
  WIZARD_DEPENDENCY_REACT_DOM,
  WIZARD_DEPENDENCY_VUE_2,
  WIZARD_DEPENDENCY_VUE_3,
] as const

export const WIZARD_BUNDLERS = [
  WIZARD_DEPENDENCY_WEBPACK,
  WIZARD_DEPENDENCY_VITE,
] as const
