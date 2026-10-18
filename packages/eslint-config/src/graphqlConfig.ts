import fs from 'fs'
import path from 'path'
import type { Linter } from 'eslint'
import { builtinRules } from 'eslint/use-at-your-own-risk'
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint'
import graphqlPlugin from '@graphql-eslint/eslint-plugin'
import { gqlPluckFromCodeStringSync } from '@graphql-tools/graphql-tag-pluck'
import { parse as parseSFC } from '@vue/compiler-sfc'
import vue from 'eslint-plugin-vue'
import { parse as parseGraphql, specifiedRules } from 'graphql'

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

interface SourcePosition {
  lineOffset: number
  columnOffset: number
  offset: number
}

interface DocumentBlock extends SourcePosition {
  filename: string
  text: string
}

const FILE_START: SourcePosition = { lineOffset: 0, columnOffset: 0, offset: 0 }

function pluckDocuments (filePath: string, code: string, start: SourcePosition): DocumentBlock[] {
  const sources = gqlPluckFromCodeStringSync(filePath, code, {
    globalGqlIdentifierName: 'gql',
    // skip de-indenting, so positions map 1:1 back onto the source file. Pluck
    // still drops `${...}` interpolations, which would shift them, but these
    // packages spread fragments by name instead of interpolating them.
    skipIndent: true,
  })

  return sources.map(({ body, locationOffset }) => {
    // graphql-tag-pluck sets `index`, the template's character offset, but
    // graphql's `Source` type does not declare it
    const index = 'index' in locationOffset && typeof locationOffset.index === 'number' ? locationOffset.index : 0
    const isFirstLine = locationOffset.line === 1

    return {
      filename: 'document.graphql',
      text: body,
      lineOffset: start.lineOffset + locationOffset.line - 1,
      // `column` is where the backtick sits; the text starts one past it
      columnOffset: locationOffset.column + 1 + (isFirstLine ? start.columnOffset : 0),
      offset: start.offset + index + 1,
    }
  })
}

// graphql-tag-pluck can read `.vue` files itself, but only with a newer
// `@vue/compiler-sfc` than the one this repo pins, and
// `@graphql-eslint/eslint-plugin` refuses `.vue` files under flat config. So
// split out the script blocks here and pluck each one as plain JS/TS.
function pluckFile (filePath: string, code: string): DocumentBlock[] {
  if (!filePath.endsWith('.vue')) {
    return pluckDocuments(filePath, code, FILE_START)
  }

  const { descriptor } = parseSFC(code, { filename: filePath })

  return [descriptor.script, descriptor.scriptSetup].flatMap((block) => {
    if (!block) {
      return []
    }

    return pluckDocuments(`${filePath}.${block.lang ?? 'js'}`, block.content, {
      lineOffset: block.loc.start.line - 1,
      columnOffset: block.loc.start.column - 1,
      offset: block.loc.start.offset,
    })
  })
}

function extractDocuments (filePath: string, code: string): DocumentBlock[] {
  if (!code.includes('gql')) {
    return []
  }

  try {
    return pluckFile(filePath, code)
  } catch {
    // The file does not parse as JS/TS, typically mid-edit. Its own lint run
    // reports that, so skip it rather than fail the whole run.
    return []
  }
}

function isParsable (text: string): boolean {
  try {
    parseGraphql(text)

    return true
  } catch {
    return false
  }
}

// Reused by the processor, so a file that has not changed since the config
// loaded is not plucked a second time
const documentsAtLoad = new Map<string, { code: string, blocks: DocumentBlock[] }>()

// ESLint loads flat config synchronously, so this cannot use async fs calls
function loadDocuments (): string {
  // eslint-disable-next-line no-restricted-syntax
  const files = fs.globSync(`{${GQL_PACKAGES.join(',')}}/{src,cypress}/**/*.{js,jsx,ts,tsx,vue}`, {
    cwd: PACKAGES_DIR,
    exclude: (file) => /(^|[\\/])(generated|gen|node_modules)$/.test(file),
  })

  return files.flatMap((file) => {
    const filePath = path.join(PACKAGES_DIR, file)
    // eslint-disable-next-line no-restricted-syntax
    const code = fs.readFileSync(filePath, 'utf8')
    const blocks = extractDocuments(filePath, code)

    if (blocks.length > 0) {
      documentsAtLoad.set(filePath, { code, blocks })
    }

    // The templates are joined into one document, so a single unparsable one
    // would fail every file's lint. Its own file still reports it.
    return blocks.map((block) => block.text).filter(isParsable)
  }).join('\n')
}

const blocksByFile = new Map<string, DocumentBlock[]>()

function shiftRange ([start, end]: [number, number], block: DocumentBlock): [number, number] {
  return [start + block.offset, end + block.offset]
}

function toFileLocation (message: Linter.LintMessage, block: DocumentBlock): Linter.LintMessage {
  // A fatal parse error can come back without a position; anchor it at the
  // start of its template
  const line = Number.isFinite(message.line) ? message.line : 1
  const column = Number.isFinite(message.column) ? message.column : 1

  const shifted = {
    ...message,
    line: line + block.lineOffset,
    column: line === 1 ? column + block.columnOffset : column,
  }

  if (typeof message.endLine === 'number') {
    shifted.endLine = message.endLine + block.lineOffset

    if (message.endLine === 1 && typeof message.endColumn === 'number') {
      shifted.endColumn = message.endColumn + block.columnOffset
    }
  }

  if (message.fix) {
    shifted.fix = { ...message.fix, range: shiftRange(message.fix.range, block) }
  }

  if (message.suggestions) {
    shifted.suggestions = message.suggestions.map((suggestion) => {
      return { ...suggestion, fix: { ...suggestion.fix, range: shiftRange(suggestion.fix.range, block) } }
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
    const atLoad = documentsAtLoad.get(filePath)
    const blocks = atLoad?.code === code ? atLoad.blocks : extractDocuments(filePath, code)

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

function addPluginRuleNames (configs: InfiniteDepthConfigWithExtends[], ruleNames: Set<string>): void {
  for (const config of configs) {
    if (Array.isArray(config)) {
      addPluginRuleNames(config, ruleNames)
      continue
    }

    for (const [namespace, plugin] of Object.entries(config.plugins ?? {})) {
      for (const rule of Object.keys(plugin.rules ?? {})) {
        ruleNames.add(`${namespace}/${rule}`)
      }
    }
  }
}

// Configs without `files` also reach the virtual documents, and their
// line-based rules (blank lines, trailing spaces) misfire on GraphQL text.
function nonGraphqlRulesOff (): Linter.RulesRecord {
  const ruleNames = new Set(builtinRules.keys())

  addPluginRuleNames(baseConfig, ruleNames)

  return Object.fromEntries([...ruleNames].map((name) => [name, 'off']))
}

/**
 * Validates `gql` template literals against the Cypress GraphQL schema. It
 * reads every document in the GraphQL packages when called, so only call it
 * from the config of a package that uses `gql`.
 */
export function graphqlConfig (): InfiniteDepthConfigWithExtends[] {
  const validationRuleNames = new Set(specifiedRules.map((rule) => rule.name).filter((name) => !SKIPPED_VALIDATIONS.has(name)))

  // graphql-eslint has no per-document counterpart for UniqueOperationNames and
  // UniqueFragmentNames, so those two drop out here. Codegen still rejects
  // duplicate names across all documents.
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
