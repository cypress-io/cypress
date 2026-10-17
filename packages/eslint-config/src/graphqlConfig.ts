import fs from 'fs'
import path from 'path'
import type { Linter } from 'eslint'
import { builtinRules } from 'eslint/use-at-your-own-risk'
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'
import graphqlPlugin from '@graphql-eslint/eslint-plugin'
import { gqlPluckFromCodeStringSync } from '@graphql-tools/graphql-tag-pluck'
import { parse as parseSFC } from '@vue/compiler-sfc'
import vue from 'eslint-plugin-vue'
import { specifiedRules } from 'graphql'

import { baseConfig } from './baseConfig'

const PACKAGES_DIR = path.resolve(__dirname, '../..')
const SCHEMA_PATH = path.join(PACKAGES_DIR, 'data-context/schemas/schema.graphql')

// Fragments are spread by name across these packages, so rules that follow a
// spread need all of their documents loaded, not just the file being linted.
const GQL_PACKAGES = ['app', 'frontend-shared', 'launchpad', 'data-context']

const CODE_FILES = ['**/*.{js,jsx,ts,tsx,vue}']

// The processor emits each `gql` template as a virtual `<n>_document.graphql`
// child of its source file. Matching only those keeps the GraphQL rules off
// real `.graphql` files such as the schema itself.
const VIRTUAL_DOCUMENTS = ['**/*.{js,jsx,ts,tsx,vue}/*_document.graphql']

// Each template is validated on its own, but fragments are defined in one
// template and spread by name in others. These would flag documents that are
// correct as a whole, such as an operation variable only a spread fragment uses.
const SKIPPED_VALIDATIONS = new Set([
  'KnownFragmentNamesRule',
  'NoUnusedFragmentsRule',
  'NoUnusedVariablesRule',
])

interface DocumentBlock {
  filename: string
  text: string
  lineOffset: number
  offset: number
}

function pluckDocuments (filePath: string, code: string, lineOffset = 0, offset = 0): DocumentBlock[] {
  const sources = gqlPluckFromCodeStringSync(filePath, code, {
    globalGqlIdentifierName: 'gql',
    // skip de-indenting, so the text is verbatim and columns and fix ranges
    // map 1:1 back onto the source file
    skipIndent: true,
  })

  return sources.map(({ body, locationOffset }) => {
    // graphql-tag-pluck sets `index`, the template's character offset, but
    // graphql's `Source` type does not declare it
    const index = 'index' in locationOffset && typeof locationOffset.index === 'number' ? locationOffset.index : 0

    return {
      filename: 'document.graphql',
      text: body,
      lineOffset: lineOffset + locationOffset.line - 1,
      // +1 skips the opening backtick
      offset: offset + index + 1,
    }
  })
}

// graphql-tag-pluck can read `.vue` files itself, but only with a newer
// `@vue/compiler-sfc` than the one this repo pins, and
// `@graphql-eslint/eslint-plugin` refuses `.vue` files under flat config. So
// split out the script blocks here and pluck each one as plain JS/TS.
function extractDocuments (filePath: string, code: string): DocumentBlock[] {
  if (!code.includes('gql')) {
    return []
  }

  if (!filePath.endsWith('.vue')) {
    return pluckDocuments(filePath, code)
  }

  const { descriptor } = parseSFC(code, { filename: filePath })

  return [descriptor.script, descriptor.scriptSetup].flatMap((block) => {
    if (!block) {
      return []
    }

    return pluckDocuments(`${filePath}.${block.lang ?? 'js'}`, block.content, block.loc.start.line - 1, block.loc.start.offset)
  })
}

// ESLint loads flat config synchronously, so this cannot use async fs calls
function loadDocuments (): string {
  // eslint-disable-next-line no-restricted-syntax
  const files = fs.globSync(`{${GQL_PACKAGES.join(',')}}/{src,cypress}/**/*.{js,jsx,ts,tsx,vue}`, {
    cwd: PACKAGES_DIR,
    exclude: (file) => /(^|\/)(generated|gen|node_modules)$/.test(file),
  })

  return files.flatMap((file) => {
    const filePath = path.join(PACKAGES_DIR, file)

    // eslint-disable-next-line no-restricted-syntax
    return extractDocuments(filePath, fs.readFileSync(filePath, 'utf8')).map((block) => block.text)
  }).join('\n')
}

const blocksByFile = new Map<string, DocumentBlock[]>()

function toFileLocation (message: Linter.LintMessage, block: DocumentBlock): Linter.LintMessage {
  const shifted = { ...message, line: message.line + block.lineOffset }

  if (typeof message.endLine === 'number') {
    shifted.endLine = message.endLine + block.lineOffset
  }

  if (message.fix) {
    shifted.fix = { ...message.fix, range: [message.fix.range[0] + block.offset, message.fix.range[1] + block.offset] }
  }

  if (message.suggestions) {
    shifted.suggestions = message.suggestions.map((suggestion) => {
      return { ...suggestion, fix: { ...suggestion.fix, range: [suggestion.fix.range[0] + block.offset, suggestion.fix.range[1] + block.offset] } }
    })
  }

  return shifted
}

// Wraps eslint-plugin-vue's processor for `.vue` files, so its
// `<!-- eslint-disable -->` handling keeps working and also covers the
// GraphQL messages.
const gqlProcessor: Linter.Processor = {
  meta: {
    name: '@packages/eslint-config/graphql',
  },
  supportsAutofix: true,
  preprocess (code, filePath) {
    const blocks = extractDocuments(filePath, code)

    blocksByFile.set(filePath, blocks)

    return [...blocks, code]
  },
  postprocess (messages, filePath) {
    const blocks = blocksByFile.get(filePath) ?? []

    blocksByFile.delete(filePath)

    const documentMessages = blocks.flatMap((block, i) => messages[i].map((message) => toFileLocation(message, block)))
    const sorted = [...documentMessages, ...messages[blocks.length]].sort((a, b) => a.line - b.line || a.column - b.column)

    return filePath.endsWith('.vue') ? vue.processors.vue.postprocess?.([sorted], filePath) ?? sorted : sorted
  },
}

// Configs without `files` also reach the virtual documents, and their
// line-based rules (blank lines, trailing spaces) misfire on GraphQL text.
function nonGraphqlRulesOff (): Linter.RulesRecord {
  const ruleNames = new Set(builtinRules.keys())

  for (const config of baseConfig) {
    if (Array.isArray(config) || !config.plugins) {
      continue
    }

    for (const [namespace, plugin] of Object.entries(config.plugins)) {
      for (const rule of Object.keys(plugin.rules ?? {})) {
        ruleNames.add(`${namespace}/${rule}`)
      }
    }
  }

  return Object.fromEntries([...ruleNames].map((name) => [name, 'off']))
}

/**
 * Validates `gql` template literals against the Cypress GraphQL schema. It
 * reads every document in the GraphQL packages when called, so only call it
 * from the config of a package that uses `gql`.
 */
export function graphqlConfig (): InfiniteDepthConfigWithExtends[] {
  const validationRuleNames = new Set(specifiedRules.map((rule) => rule.name).filter((name) => !SKIPPED_VALIDATIONS.has(name)))

  const validationRules = Object.fromEntries(
    Object.entries(graphqlPlugin.rules)
    .filter(([, rule]) => validationRuleNames.has(rule.meta.docs?.graphQLJSRuleName ?? ''))
    .map(([name]) => [`@graphql-eslint/${name}`, 'error']),
  )

  return [
    {
      files: CODE_FILES,
      processor: gqlProcessor,
    },
    {
      files: VIRTUAL_DOCUMENTS,
      languageOptions: {
        parser: graphqlPlugin.parser,
        parserOptions: {
          graphQLConfig: {
            schema: SCHEMA_PATH,
            documents: loadDocuments(),
          },
        },
      },
      plugins: {
        '@graphql-eslint': graphqlPlugin,
      },
      rules: {
        ...nonGraphqlRulesOff(),
        ...validationRules,
        '@graphql-eslint/no-deprecated': 'error',
        '@graphql-eslint/require-selections': ['error', { fieldName: 'id' }],
      },
    },
  ]
}
