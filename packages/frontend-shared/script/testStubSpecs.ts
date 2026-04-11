import JustMyLuck from 'just-my-luck'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import combineProperties from 'combine-properties'

dayjs.extend(relativeTime)

type TemplateFunction = (data: Record<string, any>) => string

function makeTemplate (templateStr: string): TemplateFunction {
  return (data: Record<string, any>) => {
    return templateStr.replace(/\{\{([\s\S]+?)\}\}/g, (_, key) => {
      const val = data[key.trim()]

      return val == null ? '' : String(val)
    })
  }
}

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
  rootDedicated: makeTemplate('tests'),
  rootSrc: makeTemplate('src'),
  monorepo: makeTemplate('packages/{{component}}/test'),
  jestRoot: makeTemplate('__test__'),
  jestNestedLib: makeTemplate('lib/{{component}}{{component2}}/__test__'),
  dedicatedNested: makeTemplate('lib/{{component}}/test'),
  jestNested: makeTemplate('src/{{component}}/__test__'),
  componentsNested: makeTemplate('src/components/{{component}}'),
  componentsFlat: makeTemplate('src/{{component}}'),
  viewsFlat: makeTemplate('src/views'),
  frontendFlat: makeTemplate('frontend'),
  frontendComponentsFlat: makeTemplate('frontend/components'),
}

type NameTemplate = {
  readonly [key: string]: TemplateFunction
}

const nameTemplates = {
  // Business Logic Components
  longDomain: makeTemplate(`{{prefix}}{{modifier}}{{domain}}{{component}}`),
  longDomain2: makeTemplate(`{{prefix}}{{domain}}{{component}}{{component2}}`),

  // App Components
  page1: makeTemplate(`{{domain}}Page`),
  layout: makeTemplate(`{{domain}}Layout`),

  presentationalShort: makeTemplate(`Base{{component}}`),
  presentationalLong: makeTemplate(`Base{{component}}{{component2}}`),
  medium1: makeTemplate(`{{prefix}}{{modifier}}{{component}}`),
  medium2: makeTemplate(`{{prefix}}{{component}}{{component2}}`),
  short: makeTemplate(`{{prefix}}{{component}}`),
} as const

const prefixes = ['I', 'V', 'Cy', null]

interface ComponentNameGeneratorOptions {
  template: TemplateFunction
  omit?: string[]
  overrides?: object
}

export const componentNameGenerator = (options: ComponentNameGeneratorOptions = { template: nameTemplates.medium1, omit: [], overrides: {} }) => {
  const withoutValues = (options.omit || []).reduce((acc, v) => {
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
  directory: Object.keys(directories),
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
        author: faker.internet.username(),
        lastModifiedHumanReadable: dayjs(lastModifiedTimestamp).fromNow(),
        lastModifiedTimestamp: lastModifiedTimestamp.toUTCString(),
      },
    }
  }, n)
}
