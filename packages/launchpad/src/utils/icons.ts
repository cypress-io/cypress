import LogoWebpack from '../images/logos/webpack.svg'
import LogoVite from '../images/logos/vite.svg'
import LogoNext from '../images/logos/nextjs.svg'
import LogoNuxt from '../images/logos/nuxt.svg'
import LogoVue from '../images/logos/vue.svg'
import LogoReact from '../images/logos/react.svg'

import componentLogo from '../images/testingTypes/component.svg'
import e2eLogo from '../images/testingTypes/e2e.svg'

import type { FrontendFramework, SupportedBundlers, TestingTypeEnum } from '../generated/graphql'

export const FrameworkBundlerLogos: Record<FrontendFramework | SupportedBundlers, string> = {
  webpack: LogoWebpack,
  vite: LogoVite,
  vue: LogoVue,
  vuecli: LogoVue,
  nextjs: LogoNext,
  nuxtjs: LogoNuxt,
  react: LogoReact,
  cra: LogoReact,
}

export const TestingTypeIcons: Record<TestingTypeEnum, string> = {
  e2e: e2eLogo,
  component: componentLogo,
}
