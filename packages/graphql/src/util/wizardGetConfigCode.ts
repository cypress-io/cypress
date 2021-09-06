import { FRAMEWORK_CONFIG_FILE, WizardCodeLanguage } from '../constants/wizardConstants'
import type { WizardBundler } from '../entities/WizardBundler'
import type { WizardFrontendFramework } from '../entities/WizardFrontendFramework'

interface GetCodeOptsE2E {
  type: 'e2e'
  lang: WizardCodeLanguage
}

interface GetCodeOptsCt {
  type: 'component'
  framework: WizardFrontendFramework
  bundler: WizardBundler
  lang: WizardCodeLanguage
}

type GetCodeOpts = GetCodeOptsCt | GetCodeOptsE2E

const LanguageNames: Record<WizardCodeLanguage, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
}

export const wizardGetConfigCodeE2E = (opts: GetCodeOptsE2E): string | null => {
  return `{
  e2e: {
    viewportHeight: 660,
    viewportWidth: 1000,
}`
}

export const wizardGetConfigCode = (opts: GetCodeOpts): string | null => {
  if (opts.type === 'component') {
    return wizardGetConfigCodeCt(opts)
  }

  if (opts.type === 'e2e') {
    return wizardGetConfigCodeE2E(opts)
  }

  return null
}

export const wizardGetConfigCodeCt = (opts: GetCodeOptsCt): string | null => {
  const { framework, bundler, lang } = opts

  const comments = `Component testing, ${LanguageNames[opts.lang]}, ${framework.name}, ${bundler.name}`
  const frameworkConfig = FRAMEWORK_CONFIG_FILE[framework.id]

  if (frameworkConfig) {
    return `// ${comments}

${frameworkConfig[lang]}`
  }

  const exportStatement =
    lang === 'js' ? 'module.exports = {' : 'export default {'

  const importStatements =
    lang === 'js'
      ? ''
      : [
          `import { startDevServer } from \'${bundler.package}\'`,
          `import webpackConfig from './webpack.config'`,
          '',
      ].join('\n')

  const requireStatements =
    lang === 'ts'
      ? ''
      : [
          `const { startDevServer } = require('${bundler.package}')`,
          `const webpackConfig = require('./webpack.config')`,
          '',
      ].join('\n  ')

  const startServerReturn = `return startDevServer({ options, webpackConfig })`

  return `// ${comments}
${importStatements}
${exportStatement}
  ${requireStatements}component(on, config) {
    on('dev-server:start', (options) => {
      ${startServerReturn}
    })
  }
}`
}
