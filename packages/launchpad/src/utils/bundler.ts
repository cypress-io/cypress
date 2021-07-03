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
  logo: 'webpack',
  package: '@cypress/webpack-dev-server',
}

export const SupportedBundlerVite: Bundler = {
  id: 'vite',
  name: 'ViteJs',
  logo: 'vite',
  package: '@cypress/vite-dev-server',
}

export const supportedBundlers: Bundler[] = [
  SupportedBundlerWebpack,
  SupportedBundlerVite,
]
