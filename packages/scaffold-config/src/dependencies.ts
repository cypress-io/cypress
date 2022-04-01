export const WIZARD_DEPENDENCY_WEBPACK = {
  type: 'webpack',
  name: 'Webpack',
  package: 'webpack',
  description: 'Webpack is a module bundler',
  minVersion: '^4.0.0',
} as const

export const WIZARD_DEPENDENCY_VUE_2 = {
  type: 'vue',
  name: 'Vue.js 2',
  package: 'vue@2',
  description: 'The Progressive JavaScript Framework',
  minVersion: '2.x',
} as const

export const WIZARD_DEPENDENCY_VUE_3 = {
  type: 'vue',
  name: 'Vue.js 3',
  package: 'vue',
  description: 'The Progressive JavaScript Framework',
  minVersion: '3.x',
} as const

export const WIZARD_DEPENDENCY_REACT = {
  type: 'react',
  name: 'React.js',
  package: 'react',
  description: 'A JavaScript library for building user interfaces',
  minVersion: '16.x',
} as const

export const WIZARD_DEPENDENCY_TYPESCRIPT = {
  type: 'typescript',
  name: 'TypeScript',
  package: 'typescript',
  description: 'TypeScript is a language for application-scale JavaScript',
  minVersion: '>=3.0.0',
} as const

export const WIZARD_DEPENDENCY_REACT_SCRIPTS = {
  type: 'reactscripts',
  name: 'React Scripts',
  package: 'react-scripts',
  description: 'Create React apps with no build configuration',
  minVersion: '>=4.0.0',
} as const

export const WIZARD_DEPENDENCY_VUE_CLI_SERVICE = {
  type: 'vuecliservice',
  name: 'Vue CLI',
  package: '@vue/cli-service',
  description: 'Standard Tooling for Vue.js Development',
  minVersion: '>=4.0.0',
} as const

export const WIZARD_DEPENDENCY_VITE = {
  type: 'vite',
  name: 'Vite',
  package: 'vite',
  description: 'Vite is dev server that serves your source files over native ES modules',
  minVersion: '>=2.0.0',
} as const

export const WIZARD_DEPENDENCY_NUXT = {
  type: 'nuxt',
  name: 'Nuxt',
  package: 'nuxt',
  description: 'The Intuitive Vue Framework',
  minVersion: '2.x',
} as const

export const WIZARD_DEPENDENCY_NEXT = {
  type: 'next',
  name: 'Next',
  package: 'next',
  description: 'The React Framework for Production',
  minVersion: '>=10.0.0',
} as const

export const WIZARD_DEPENDENCY_STORYBOOK_REACT = {
  type: 'storybook',
  name: ' Testing React',
  package: '@storybook/testing-react',
  description: 'Testing utilities that allow you to reuse your stories in your unit tests',
  minVersion: '>=1.0.0'
} as const

export const WIZARD_DEPENDENCY_STORYBOOK_VUE_2 = {
  type: 'storybook',
  name: ' Testing Vue 2',
  package: '@storybook/testing-vue',
  description: 'Testing utilities that allow you to reuse your stories in your unit tests',
  minVersion: '>=0.0.2'
} as const

export const WIZARD_DEPENDENCY_STORYBOOK_VUE_3 = {
  type: 'storybook',
  name: ' Testing Vue 3',
  package: '@storybook/testing-vue3',
  description: 'Testing utilities that allow you to reuse your stories in your unit tests',
  minVersion: '>=0.0.2'
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
  WIZARD_DEPENDENCY_VUE_2,
  WIZARD_DEPENDENCY_VUE_3,
  WIZARD_DEPENDENCY_STORYBOOK_VUE_3,
  WIZARD_DEPENDENCY_STORYBOOK_VUE_2,
  WIZARD_DEPENDENCY_STORYBOOK_REACT,
] as const