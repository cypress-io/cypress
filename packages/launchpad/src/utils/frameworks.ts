import { BundlerId } from './bundler'
import LogoNext from '../assets/logos/nextjs.svg'
import LogoNuxt from '../assets/logos/nuxt.svg'
import LogoVue from '../assets/logos/vue.svg'
import LogoReact from '../assets/logos/react.svg'
import { Library, SupportedLibraryReact, SupportedLibraryVue } from './libraries'

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
  logo: LogoNext,
}

export const SupportedFrameworkNuxt: Framework = {
  id: 'nuxt',
  name: 'NuxtJs',
  bundler: 'webpack',
  library: SupportedLibraryVue,
  logo: LogoNuxt,
}

export const SupportedFrameworkVueCLI: Framework = {
  id: 'vuecli',
  name: 'Vue CLI',
  bundler: 'webpack',
  library: SupportedLibraryVue,
  logo: LogoVue,
}

export const SupportedFrameworkCreateReactApp: Framework = {
  id: 'cra',
  name: 'Create React App',
  bundler: 'webpack',
  library: SupportedLibraryReact,
  logo: LogoReact,
}

export const SupportedFrameworkVue: Framework = {
  id: 'vue',
  name: 'VueJs',
  library: SupportedLibraryVue,
  logo: LogoVue,
}

export const SupportedFrameworkReact: Framework = {
  id: 'react',
  name: 'ReactJs',
  library: SupportedLibraryReact,
  logo: LogoReact,
}

export const supportedFrameworks = [
  SupportedFrameworkNuxt,
  SupportedFrameworkNext,
  SupportedFrameworkCreateReactApp,
  SupportedFrameworkVueCLI,
  SupportedFrameworkReact,
  SupportedFrameworkVue,
]
