import LogoWebpack from '../images/logos/webpack.svg'
import LogoVite from '../images/logos/vite.svg'

export type BundlerId = 'webpack' | 'vite';

export type Bundler = {
  id: BundlerId
  name: string
  logo: string
  package: string
};

export const SupportedBundlerWebpack: Bundler = {
  id: 'webpack',
  name: 'Webpack',
  logo: LogoWebpack,
  package: '@cypress/webpack-dev-server',
}

export const SupportedBundlerVite: Bundler = {
  id: 'vite',
  name: 'ViteJs',
  logo: LogoVite,
  package: '@cypress/vite-dev-server',
}

export const supportedBundlers: Bundler[] = [
  SupportedBundlerWebpack,
  SupportedBundlerVite,
]
