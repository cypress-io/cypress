import { BundlerId } from './bundler'

type Library = 'vue' | 'react';

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
  library: 'react',
  logo: 'nextjs',
}

export const SupportedFrameworkNuxt: Framework = {
  id: 'nuxt',
  name: 'NuxtJs',
  bundler: 'webpack',
  library: 'vue',
  logo: 'nuxt',
}

export const SupportedFrameworkVueCLI: Framework = {
  id: 'vuecli',
  name: 'Vue CLI',
  bundler: 'webpack',
  library: 'vue',
  logo: 'vue',
}

export const SupportedFrameworkCreateReactApp: Framework = {
  id: 'cra',
  name: 'Create React App',
  bundler: 'webpack',
  library: 'react',
  logo: 'react',
}

export const SupportedFrameworkVue: Framework = {
  id: 'vue',
  name: 'VueJs',
  library: 'vue',
  logo: 'vue',
}

export const SupportedFrameworkReact: Framework = {
  id: 'react',
  name: 'ReactJs',
  library: 'react',
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
