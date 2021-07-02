export type BundlerId = 'webpack' | 'vite';

export type Bundler = {
  id: BundlerId
  name: string
  logo: string
};

export const SupportedBundlerWebpack: Bundler = {
  id: 'webpack',
  name: 'Webpack',
  logo: 'webpack',
}

export const SupportedBundlerVite: Bundler = {
  id: 'vite',
  name: 'ViteJs',
  logo: 'vite',
}

export const supportedBundlers: Bundler[] = [
  SupportedBundlerWebpack,
  SupportedBundlerVite,
]
