import path from 'path'
import type { Linter } from 'eslint'
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'
import graphqlPlugin from '@graphql-eslint/eslint-plugin'
import { parse as parseSfc } from '@vue/compiler-sfc'
import vue from 'eslint-plugin-vue'
import { baseConfig } from './baseConfig'

const packagesDir = path.resolve(__dirname, '../..')

// Every package that runs these rules validates against the one schema the
// Cypress app serves, so the paths are fixed rather than passed in
const graphQLConfig = {
  schema: path.join(packagesDir, 'data-context/schemas/schema.graphql'),
  // `require-selections` follows fragment spreads into other files, and app
  // and launchpad spread fragments defined in frontend-shared
  documents: [
    ...['app', 'frontend-shared', 'launchpad', 'data-context'].map((pkg) => {
      return path.join(packagesDir, pkg, 'src/**/*.{vue,ts,tsx,js,jsx}')
    }),
    `!${path.join(packagesDir, '*/src/{gen,generated}/**')}`,
  ],
}

// Plucking parses the whole file with Babel, so skip files with no `gql` template
const GQL_TEMPLATE = /\bgql\s*`/

/**
 * Wraps graphql-eslint's processor, which plucks each `gql` template into a
 * virtual `.graphql` block. With `lintHostCode: false` the host file itself is
 * dropped, for the `<script>` blocks extracted from a `.vue` file: the `.vue`
 * file is already linted whole by vue-eslint-parser, and linting the extracted
 * script again would report every JS problem twice.
 */
const gqlTemplateProcessor = ({ lintHostCode }: { lintHostCode: boolean }): Linter.Processor => {
  const plucked = new Set<string>()

  return {
    meta: {
      name: `@packages/eslint-config/gql-template${lintHostCode ? '' : '-only'}`,
    },
    supportsAutofix: true,
    preprocess (code, filename) {
      plucked.delete(filename)
      const host = lintHostCode ? [code] : []

      if (!GQL_TEMPLATE.test(code)) {
        return host
      }

      // The last entry is always the host code
      const blocks = graphqlPlugin.processor.preprocess(code, filename).slice(0, -1)

      if (blocks.length === 0) {
        return host
      }

      plucked.add(filename)

      return [...blocks, ...host]
    },
    postprocess (messages, filename) {
      if (!plucked.delete(filename)) {
        return messages.flat()
      }

      return graphqlPlugin.processor.postprocess(lintHostCode ? messages : [...messages, []], filename)
    },
  }
}

const ruleIds = (config: InfiniteDepthConfigWithExtends): string[] => {
  return Array.isArray(config) ? config.flatMap(ruleIds) : Object.keys(config.rules ?? {})
}

// Many `baseConfig` blocks set rules without a `files` glob, so they also reach
// the virtual `.graphql` blocks, where JS and layout rules mean nothing
const baseRulesOff = Object.fromEntries(ruleIds(baseConfig).map((ruleId) => [ruleId, 'off'] as const))

const vueProcessor = vue.processors.vue

/**
 * Keeps eslint-plugin-vue's processor, which applies `<!-- eslint-disable -->`
 * comments in templates, and adds each `<script>` block that holds a `gql`
 * template as a virtual file for `gqlTemplateProcessor` to pluck.
 * graphql-eslint's own processor refuses `.vue` files under flat config.
 *
 * `pad: 'space'` blanks out everything before the block, so a position in the
 * virtual file is the same position in the `.vue` file and no message needs
 * remapping.
 */
const vueScriptProcessor: Linter.Processor = {
  meta: {
    name: '@packages/eslint-config/vue-gql-scripts',
  },
  supportsAutofix: true,
  preprocess (text, filename) {
    const sfc = vueProcessor.preprocess(text, filename)

    if (!GQL_TEMPLATE.test(text)) {
      return sfc
    }

    const { descriptor } = parseSfc(text, { filename, pad: 'space' })
    const scripts = [descriptor.script, descriptor.scriptSetup].flatMap((block) => {
      return block ? [{ text: block.content, filename: `${block.type}.${block.lang ?? 'js'}` }] : []
    })

    return [...sfc, ...scripts]
  },
  postprocess ([sfcMessages, ...scriptMessages], filename) {
    return [...vueProcessor.postprocess([sfcMessages], filename), ...scriptMessages.flat()]
  },
}

/** The blocks behind `graphqlConfig()`, which documents how to use them */
export const graphqlBlocks = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    processor: gqlTemplateProcessor({ lintHostCode: true }),
  },
  {
    files: ['**/*.vue'],
    processor: vueScriptProcessor,
  },
  {
    files: ['**/*.vue/*.{js,jsx,ts,tsx}'],
    processor: gqlTemplateProcessor({ lintHostCode: false }),
  },
  {
    // Only the virtual blocks plucked from `gql` templates. Physical `.graphql`
    // files, such as the schema itself, are left alone
    files: ['**/*.{js,jsx,ts,tsx}/*.graphql'],
    languageOptions: {
      parser: graphqlPlugin.parser,
      parserOptions: {
        graphQLConfig,
      },
    },
    plugins: {
      '@graphql-eslint': graphqlPlugin,
    },
    rules: {
      ...baseRulesOff,

      // graphql-js's `specifiedRules`, less the three that need the whole
      // document set to judge: a fragment may be defined or used in another file
      '@graphql-eslint/executable-definitions': 'error',
      '@graphql-eslint/fields-on-correct-type': 'error',
      '@graphql-eslint/fragments-on-composite-type': 'error',
      '@graphql-eslint/known-argument-names': 'error',
      '@graphql-eslint/known-directives': 'error',
      '@graphql-eslint/known-type-names': 'error',
      '@graphql-eslint/lone-anonymous-operation': 'error',
      '@graphql-eslint/no-fragment-cycles': 'error',
      '@graphql-eslint/no-undefined-variables': 'error',
      '@graphql-eslint/one-field-subscriptions': 'error',
      '@graphql-eslint/overlapping-fields-can-be-merged': 'error',
      '@graphql-eslint/possible-fragment-spread': 'error',
      '@graphql-eslint/provided-required-arguments': 'error',
      '@graphql-eslint/scalar-leafs': 'error',
      '@graphql-eslint/unique-argument-names': 'error',
      '@graphql-eslint/unique-directive-names-per-location': 'error',
      '@graphql-eslint/unique-input-field-names': 'error',
      '@graphql-eslint/unique-variable-names': 'error',
      '@graphql-eslint/value-literals-of-correct-type': 'error',
      '@graphql-eslint/variables-are-input-types': 'error',
      '@graphql-eslint/variables-in-allowed-position': 'error',

      '@graphql-eslint/no-deprecated': 'error',
      '@graphql-eslint/require-selections': ['error', { fieldName: 'id' }],
    },
  },
] satisfies InfiniteDepthConfigWithExtends[]
