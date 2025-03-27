export const WIZARD_DEPENDENCY_WEBPACK = {
  type: 'webpack',
  name: 'Webpack',
  package: 'webpack',
  installer: 'webpack',
  description: 'Webpack is a module bundler',
  minVersion: '^4.0.0 || ^5.0.0',
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
  minVersion: '^18.0.0 || ^19.0.0',
} as const

export const WIZARD_DEPENDENCY_REACT_DOM = {
  type: 'react-dom',
  name: 'React DOM',
  package: 'react-dom',
  installer: 'react-dom',
  description: 'This package serves as the entry point to the DOM and server renderers for React',
  minVersion: '^18.0.0 || ^19.0.0',
} as const

export const WIZARD_DEPENDENCY_TYPESCRIPT = {
  type: 'typescript',
  name: 'TypeScript',
  package: 'typescript',
  installer: 'typescript',
  description: 'TypeScript is a language for application-scale JavaScript',
  minVersion: '^4.0.0 || ^5.0.0',
} as const

export const WIZARD_DEPENDENCY_VITE = {
  type: 'vite',
  name: 'Vite',
  package: 'vite',
  installer: 'vite',
  description: 'Vite is dev server that serves your source files over native ES modules',
  minVersion: '^4.0.0 || ^5.0.0 || ^6.0.0',
} as const

export const WIZARD_DEPENDENCY_NEXT = {
  type: 'next',
  name: 'Next',
  package: 'next',
  installer: 'next',
  description: 'The React Framework for Production',
  // next 15.0.0 -> 15.0.3 use the React 19 RC as a dependency
  // Since we do not support the React 19 RC and only the official React 19 release,
  // we will only be supporting Next.js 15.0.4 officially (the others previously mentioned should still work)
  minVersion: '^14.0.0 || ^15.0.4',
} as const

export const WIZARD_DEPENDENCY_ANGULAR_CLI = {
  type: 'angular',
  name: 'Angular CLI',
  package: '@angular/cli',
  installer: '@angular/cli',
  description: 'CLI tool that you use to initialize, develop, scaffold, and maintain Angular applications.',
  minVersion: '^17.2.0 || ^18.0.0 || ^19.0.0',
} as const

export const WIZARD_DEPENDENCY_ANGULAR_DEVKIT_BUILD_ANGULAR = {
  type: 'angular',
  name: 'Angular DevKit Build Angular',
  package: '@angular-devkit/build-angular',
  installer: '@angular-devkit/build-angular',
  description: 'Angular Webpack build facade',
  minVersion: '^17.2.0 || ^18.0.0 || ^19.0.0',
} as const

export const WIZARD_DEPENDENCY_ANGULAR_CORE = {
  type: 'angular',
  name: 'Angular Core',
  package: '@angular/core',
  installer: '@angular/core',
  description: 'The core of the Angular framework',
  minVersion: '^17.2.0 || ^18.0.0 || ^19.0.0',
} as const

export const WIZARD_DEPENDENCY_ANGULAR_COMMON = {
  type: 'angular',
  name: 'Angular Common',
  package: '@angular/common',
  installer: '@angular/common',
  description: 'Commonly needed Angular directives and services',
  minVersion: '^17.2.0 || ^18.0.0 || ^19.0.0',
} as const

export const WIZARD_DEPENDENCY_ANGULAR_PLATFORM_BROWSER_DYNAMIC = {
  type: 'angular',
  name: 'Angular Platform Browser Dynamic',
  package: '@angular/platform-browser-dynamic',
  installer: '@angular/platform-browser-dynamic',
  description: 'Library for using Angular in a web browser with JIT compilation',
  minVersion: '^17.2.0 || ^18.0.0 || ^19.0.0',
} as const

export const WIZARD_DEPENDENCY_SVELTE: Cypress.CypressComponentDependency = {
  type: 'svelte',
  name: 'Svelte.js',
  package: 'svelte',
  installer: 'svelte',
  description: 'Cybernetically enhanced web apps',
  minVersion: '^5.0.0',
} as const

export const WIZARD_DEPENDENCIES = [
  WIZARD_DEPENDENCY_WEBPACK,
  WIZARD_DEPENDENCY_TYPESCRIPT,
  WIZARD_DEPENDENCY_VITE,
  WIZARD_DEPENDENCY_NEXT,
  WIZARD_DEPENDENCY_REACT,
  WIZARD_DEPENDENCY_REACT_DOM,
  WIZARD_DEPENDENCY_VUE_3,
  WIZARD_DEPENDENCY_ANGULAR_CLI,
  WIZARD_DEPENDENCY_ANGULAR_DEVKIT_BUILD_ANGULAR,
  WIZARD_DEPENDENCY_ANGULAR_CORE,
  WIZARD_DEPENDENCY_ANGULAR_COMMON,
  WIZARD_DEPENDENCY_ANGULAR_PLATFORM_BROWSER_DYNAMIC,
  WIZARD_DEPENDENCY_SVELTE,
] as const

export const WIZARD_BUNDLERS = [
  WIZARD_DEPENDENCY_WEBPACK,
  WIZARD_DEPENDENCY_VITE,
] as const

const componentDependenciesOfInterest = [
  '@angular/cli',
  '@angular-devkit/build-angular',
  '@angular/core',
  '@angular/common',
  '@angular/platform-browser-dynamic',
  'react',
  'react-dom',
  'vue',
  '@vue/cli-service',
  'svelte',
  'solid-js',
  'lit',
  'preact',
  'preact-cli',
  'ember',
  '@stencil/core',
  '@builder.io/qwik',
  'alpinejs',
  '@glimmer/component',
  'typescript',
]

const bundlerDependenciesOfInterest = [
  'vite',
  'webpack',
  'parcel',
  'rollup',
  'snowpack',
]

const testingDependenciesOfInterest = [
  'jest',
  'jsdom',
  'jest-preview',
  'storybook',
  '@storybook/addon-interactions',
  '@storybook/addon-a11y',
  'chromatic',
  '@testing-library/react',
  '@testing-library/react-hooks',
  '@testing-library/dom',
  '@testing-library/jest-dom',
  '@testing-library/cypress',
  '@testing-library/user-event',
  '@testing-library/vue',
  '@testing-library/svelte',
  '@testing-library/preact',
  'happy-dom',
  'vitest',
  'vitest-preview',
  'selenium-webdriver',
  'nightwatch',
  'karma',
  'playwright',
  'playwright-core',
  '@playwright/experimental-ct-core',
  '@playwright/experimental-ct-react',
  '@playwright/experimental-ct-svelte',
  '@playwright/experimental-ct-vue',
  '@playwright/experimental-ct-solid',
  '@playwright/experimental-ct-react17',
  'axe-core',
  'jest-axe',
  'enzyme',
]

export const dependencyNamesToDetect = [
  ...componentDependenciesOfInterest,
  ...bundlerDependenciesOfInterest,
  ...testingDependenciesOfInterest,
]
