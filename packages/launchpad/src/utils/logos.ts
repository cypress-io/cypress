import LogoWebpack from '../images/logos/webpack.svg'
import LogoVite from '../images/logos/vite.svg'
import LogoNext from '../images/logos/nextjs.svg'
import LogoNuxt from '../images/logos/nuxt.svg'
import LogoVue from '../images/logos/vue.svg'
import LogoReact from '../images/logos/react.svg'

import { FrontendFramework } from '../generated/graphql'
import { BundlerId } from './bundler'

export const FrameworkBundlerLogos: Record<FrontendFramework | BundlerId, string> = {
  webpack: LogoWebpack,
  vite: LogoVite,
  vuejs: LogoVue,
  vuecli: LogoVue,
  nextjs: LogoNext,
  nuxtjs: LogoNuxt,
  reactjs: LogoReact,
  cra: LogoReact,
}
