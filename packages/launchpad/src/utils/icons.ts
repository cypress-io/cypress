import LogoWebpack from '../images/logos/webpack.svg'
import LogoVite from '../images/logos/vite.svg'
import LogoNext from '../images/logos/nextjs.svg'
import LogoNuxt from '../images/logos/nuxt.svg'
import LogoVue from '../images/logos/vue.svg'
import LogoReact from '../images/logos/react.svg'
import LogoAngular from '../images/logos/angular.svg'
import LogoSvelte from '../images/logos/svelte.svg'

import type { FrontendFrameworkEnum, SupportedBundlers } from '../generated/graphql'

export const FrameworkBundlerLogos: Record<FrontendFrameworkEnum | SupportedBundlers, string> = {
  webpack: LogoWebpack,
  vite: LogoVite,
  vue2: LogoVue,
  vue3: LogoVue,
  vueclivue2: LogoVue,
  vueclivue3: LogoVue,
  nextjs: LogoNext,
  nuxtjs: LogoNuxt,
  react: LogoReact,
  reactscripts: LogoReact,
  angular: LogoAngular,
  svelte: LogoSvelte,
}
