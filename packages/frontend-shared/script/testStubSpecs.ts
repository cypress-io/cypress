import JustMyLuck from 'just-my-luck'
import { faker } from '@faker-js/faker'
import { template, keys, reduce, templateSettings } from 'lodash'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { TemplateExecutor } from 'lodash'
import combineProperties from 'combine-properties'

dayjs.extend(relativeTime)

templateSettings.interpolate = /{{([\s\S]+?)}}/g

let jml
const setupSeeds = () => {
  const seed = 2

  faker.seed(seed)
  jml = new JustMyLuck(JustMyLuck.MersenneTwister(seed))
}

setupSeeds()

/**
 * Component Naming Fixtures
 */
export const modifiers = [
  'Async',
  'Dynamic',
  'Static',
  'Virtual',
  'Lazy',
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
  'Wizard',
]

export const componentNames = [
  'List',
  'Table',
  'Header',
  'Footer',
  'Button',
  'Cell',
  'Row',
  'Skeleton',
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
  frontendComponentsFlat: template('frontend/components'),
}

type NameTemplate = {
  readonly [key: string]: TemplateExecutor
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
} as const

const prefixes = ['I', 'V', 'Cy', null]

interface ComponentNameGeneratorOptions {
  template: TemplateExecutor
  omit?: string[]
  overrides?: object
}

export const componentNameGenerator = (options: ComponentNameGeneratorOptions = { template: nameTemplates.medium1, omit: [], overrides: {} }) => {
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
    component2: components[1],
  }

  return options.template({
    ...defaultOptions,
    ...withoutValues,
    ...options.overrides,
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
  directory: keys(directories),
})

export const randomComponents = <T extends 'Spec' | 'FileParts'>(n = 200, baseTypename: T) => {
  return faker.helpers.arrayElements(allRandomComponents, n).map((d: ReturnType<typeof combineProperties>) => {
    const componentName = componentNameGenerator({
      overrides: d,
      template: faker.helpers.objectValue<NameTemplate>(nameTemplates),
    })

    const name = `${componentName}${d.specPattern}${d.fileExtension}`

    const lastModifiedTimestamp = new Date(faker.helpers.arrayElement([
      faker.date.recent({ days: 8 }),
      faker.date.past({ years: 1 }),
      faker.date.between({
        from: new Date(Date.now() - 6000000).toUTCString(),
        to: new Date().toUTCString(),
      }),
    ]))

    return {
      id: faker.string.uuid(),
      baseName: name,
      relative: `${directories[d.directory](d)}/${name}`,
      absolute: `${faker.system.directoryPath()}/${directories[d.directory](d)}/${name}`,
      name: `${componentName}${d.specPattern}`,
      specFileExtension: `${d.specPattern}${d.fileExtension}`,
      fileExtension: d.fileExtension,
      specType: 'component' as const,
      fileName: componentName,
      __typename: baseTypename,
      gitInfo: {
        __typename: 'GitInfo' as const,
        statusType: 'unmodified' as const,
        id: faker.string.uuid(),
        author: faker.internet.userName(),
        lastModifiedHumanReadable: dayjs(lastModifiedTimestamp).fromNow(),
        lastModifiedTimestamp: lastModifiedTimestamp.toUTCString(),
      },
    }
  }, n)
}
