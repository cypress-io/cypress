import LogoWebpack from '../images/logos/webpack.svg?url'
import LogoVite from '../images/logos/vite.svg?url'
import LogoNext from '../images/logos/nextjs.svg?url'
import LogoNuxt from '../images/logos/nuxt.svg?url'
import LogoVue from '../images/logos/vue.svg?url'
import LogoReact from '../images/logos/react.svg?url'

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
