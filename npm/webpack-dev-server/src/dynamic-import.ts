import { pathToFileURL } from 'url'

// tsc will compile `import(...)` calls to require unless a different tsconfig.module value
// is used (e.g. module=node16). To change this, we would also have to change the ts-node behavior when requiring the
// Cypress config file. This hack for keeping dynamic imports from being converted works across all
// of our supported node versions
const _dynamicImport = new Function('specifier', 'return import(specifier)')

export const dynamicImport = <T>(module: string) => _dynamicImport(module) as Promise<T>

export const dynamicAbsoluteImport = (filePath: string) => {
  return dynamicImport(pathToFileURL(filePath).href) as Promise<any>
}
