import { BundlerId } from './bundler'

type Library = {
  id: string
  name: string
  package: string
};

export const SupportedLibraryVue = {
  id: 'vue',
  name: 'VueJs',
  package: '@cypress/vue',
}

export const SupportedLibraryReact = {
  id: 'react',
  name: 'ReactJs',
  package: '@cypress/react',
}

export type Framework = {
  id: string
  name: string
  bundler?: BundlerId
  library: Library
  logo: string
};

export const SupportedFrameworkNext: Framework = {
  id: 'nextjs',
  name: 'NextJs',
  bundler: 'webpack',
  library: SupportedLibraryReact,
  logo: 'nextjs',
}

export const SupportedFrameworkNuxt: Framework = {
  id: 'nuxt',
  name: 'NuxtJs',
  bundler: 'webpack',
  library: SupportedLibraryVue,
  logo: 'nuxt',
}

export const SupportedFrameworkVueCLI: Framework = {
  id: 'vuecli',
  name: 'Vue CLI',
  bundler: 'webpack',
  library: SupportedLibraryVue,
  logo: 'vue',
}

export const SupportedFrameworkCreateReactApp: Framework = {
  id: 'cra',
  name: 'Create React App',
  bundler: 'webpack',
  library: SupportedLibraryReact,
  logo: 'react',
}

export const SupportedFrameworkVue: Framework = {
  id: 'vue',
  name: 'VueJs',
  library: SupportedLibraryVue,
  logo: 'vue',
}

export const SupportedFrameworkReact: Framework = {
  id: 'react',
  name: 'ReactJs',
  library: SupportedLibraryReact,
  logo: 'react',
}

export const supportedFrameworks = [
  SupportedFrameworkNuxt,
  SupportedFrameworkNext,
  SupportedFrameworkCreateReactApp,
  SupportedFrameworkVueCLI,
  SupportedFrameworkReact,
  SupportedFrameworkVue,
]
