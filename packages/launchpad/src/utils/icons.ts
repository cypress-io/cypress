import LogoWebpack from '../images/logos/webpack.svg'
import LogoVite from '../images/logos/vite.svg'
import LogoNext from '../images/logos/nextjs.svg'
import LogoNuxt from '../images/logos/nuxt.svg'
import LogoVue from '../images/logos/vue.svg'
import LogoReact from '../images/logos/react.svg'

import type { FrontendFrameworkEnum, SupportedBundlers } from '../generated/graphql'

export const FrameworkBundlerLogos: Record<FrontendFrameworkEnum | SupportedBundlers, string> = {
  webpack: LogoWebpack,
  vite: LogoVite,
  vue: LogoVue,
  vuecli: LogoVue,
  nextjs: LogoNext,
  nuxtjs: LogoNuxt,
  react: LogoReact,
  cra: LogoReact,
}
