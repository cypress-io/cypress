// Separating this, so we don't pull all of the server side
// babel transforms, etc. into client-side usage of the config code
export * from './browser'

export { addProjectIdToCypressConfig, addToCypressConfig, addTestingTypeToCypressConfig, AddTestingTypeToCypressConfigOptions } from './ast-utils/addToCypressConfig'

export {
  detectRelativeWebpackConfig,
  detectRelativeViteConfig,
} from './detect/bundleConfig'
