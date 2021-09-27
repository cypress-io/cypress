// @ts-nocheck
// @ts-ignore
import * as JustMyLuck from 'just-my-luck'
import faker from 'faker'
import { template, keys, reduce, templateSettings } from 'lodash'
import combineProperties from 'combine-properties'
templateSettings.interpolate = /{{([\s\S]+?)}}/g;

let jml
const setupSeeds = () => {
  const seed = 2
  faker.seed(seed)
  jml = new JustMyLuck(JustMyLuck.MersenneTwister(seed))  
}

setupSeeds()

beforeEach(() => setupSeeds)


/**
 * Component Naming Fixtures
 */
export const modifiers = [
  'Async',
  'Dynamic',
  'Static',
  'Virtual',
  'Lazy'
]

export const domainModels = [
  'Person',
  'Product',
  'Spec',
  'Settings',
  'Account',
  'Login',
  'Logout',
  'Launchpad',
  'Wizard'
]

export const componentNames = [
  'List',
  'Table',
  'Header',
  'Footer',
  'Button',  
  'Cell',
  'Row',
  'Sekeleton',
  'Loader',
  'Layout',
]

export const specPattern = ['.spec', '_spec']
export const fileExtension = ['.tsx', '.jsx', '.ts', '.js']
export const directories = {
  rootDedicated: template('tests'),
  rootSrc: template('src'),
  monorepo: template('packages/{{component}}/test'),
  jestRoot: template('__test__'),
  jestNestedLib: template('lib/{{component}}{{component2}}/__test__'),
  dedicatedNested: template('lib/{{component}}/test'),
  jestNested: template('src/{{component}}/__test__'),
  componentsNested: template('src/components/{{component}}'),
  componentsFlat: template('src/{{component}}'),
  viewsFlat: template('src/views'),
  frontendFlat: template('frontend'),
  fontendComponentsFlat: template('frontend/components'),
}

const nameTemplates = {
  // Business Logic Components
  longDomain: template(`{{prefix}}{{modifier}}{{domain}}{{component}}`),
  longDomain2: template(`{{prefix}}{{domain}}{{component}}{{component2}}`),

  // App Components
  page1: template(`{{domain}}Page`),
  layout: template(`{{domain}}Layout`),

  presentationalShort: template(`Base{{component}}`),
  presentationalLong: template(`Base{{component}}{{component2}}`),
  medium1: template(`{{prefix}}{{modifier}}{{component}}`),
  medium2: template(`{{prefix}}{{component}}{{component2}}`),
  short: template(`{{prefix}}{{component}}`),
}

const prefixes = ['I', 'V', 'Cy', null]

export const componentNameGenerator = (options: { template: any, omit: any, overrides: any } = {template: nameTemplates.medium1, omit: [], overrides: {}}) => {
  const withoutValues = reduce(options.omit, (acc, v) => {
    acc[v] = null
    return acc
  }, {})

  const components = jml.pickCombination(componentNames, 2)
  const defaultOptions = {
    modifier: jml.pick(modifiers),
    domain: jml.pick(domainModels),
    prefix: jml.pick(prefixes),
    component: components[0],
    component2: components[1]
  }

  return options.template({
    ...defaultOptions,
    ...withoutValues,
    ...options.overrides
  })
}

const allRandomComponents = combineProperties({
  domain: domainModels,
  modifier: modifiers,
  prefix: prefixes,
  component: componentNames,
  component2: componentNames,
  fileExtension,
  specPattern,
  directory: keys(directories)
})

export const randomComponents = (n = 200) => {
  return faker.random.arrayElements(allRandomComponents, n).map(d => {
    const name = componentNameGenerator({
      overrides: d,
      template: faker.random.objectElement(nameTemplates)
    })

    const gitFileState = jml.pick(['modified', 'unmodified', 'added', 'deleted'])
    return {
      componentName: name,
      relativePath: directories[d.directory](d),
      specExtension: d.specPattern,
      fileExtension: d.fileExtension,
      name: `${name}${d.specPattern}${d.fileExtension}`,
      id: faker.datatype.uuid(),
      gitInfo: {
        comitter: gitFileState ? faker.internet.userName() : undefined,
        timeAgo: gitFileState ? faker.datatype.datetime() : undefined,
        fileState: gitFileState
      }
    }
  }, n)
}
