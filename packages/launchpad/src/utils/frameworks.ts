import { BundlerId } from './bundler'
import { Library, SupportedLibraryReact, SupportedLibraryVue } from './libraries'

import LogoNext from '../images/logos/nextjs.svg'
import LogoNuxt from '../images/logos/nuxt.svg'
import LogoVue from '../images/logos/vue.svg'
import LogoReact from '../images/logos/react.svg'
import ConfigNextTs from '../samples/next/ts.ts?raw'
import ConfigNextJs from '../samples/next/js.js?raw'
import ConfigNuxtTs from '../samples/nuxt/ts.ts?raw'
import ConfigNuxtJs from '../samples/nuxt/js.js?raw'
import { FrontendFramework } from '@packages/server/lib/graphql/constants'

export const FrameworkLogo: Record<FrontendFramework, string> = {
  nextjs: LogoNext,
  nuxtjs: LogoNuxt,
  vuejs: LogoVue,
  vuecli: LogoVue,
  reactjs: LogoReact,
  cra: LogoReact,
}

export type Framework = {
  id: string
  name: string
  bundler?: BundlerId
  library: Library
  logo: string
  configFile?: {
    ts: string
    js: string
  }
};

export const SupportedFrameworkNext: Framework = {
  id: 'nextjs',
  name: 'NextJs',
  bundler: 'webpack',
  library: SupportedLibraryReact,
  logo: LogoNext,
  configFile: {
    ts: ConfigNextTs,
    js: ConfigNextJs,
  },
}

export const SupportedFrameworkNuxt: Framework = {
  id: 'nuxt',
  name: 'NuxtJs',
  bundler: 'webpack',
  library: SupportedLibraryVue,
  logo: LogoNuxt,
  configFile: {
    ts: ConfigNuxtTs,
    js: ConfigNuxtJs,
  },
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
