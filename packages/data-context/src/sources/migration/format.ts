import dedent from 'dedent'
import { MigrationTransformOptions, defaultMigrationTransformOptions } from './autoRename'

export type FilePart = {
  text: string
  group?: 'folder' | 'preExtension' | 'supportFileName' | 'fileName'
  highlight: boolean
}

export function formatMigrationFile (file: string, regexp: RegExp, options: MigrationTransformOptions = defaultMigrationTransformOptions): FilePart[] {
  const match = regexp.exec(file)

  if (!match?.groups) {
    throw new Error(dedent`
      Expected groups main,ext or file in ${file} using ${regexp} when matching ${file}
      Perhaps this isn't a spec file, or it is an unexpected format?`)
  }

  const { folder, fileName, preExtension, extension, supportFileName } = match.groups

  if (supportFileName && extension) {
    return [{
      text: `${file.slice(0, match.index)}cypress/support/`, // user/cypress/support/index.js -> user/cypress/support/
      highlight: false,
    }, {
      text: supportFileName, // user/cypress/support/index.js -> index
      highlight: true,
      group: 'supportFileName',
    },
    {
      text: extension, // user/cypress/support/index.js -> .js
      highlight: false,
    }]
  }

  return [{
    text: file.slice(0, match.index), // user/cypress/integration/file.spec.tsx -> user/
    highlight: false,
  },
  {
    text: folder ? 'cypress/' : '', // empty when using a custom integration folder or in component
    highlight: false,
  },
  {
    text: folder || '', // user/cypress/integration/file.spec.tsx -> integration
    highlight: true,
    group: 'folder',
  },
  {
    text: (folder ? '/' : '') + fileName, // user/cypress/integration/file.spec.tsx -> /file
    highlight: false,
    group: 'fileName',
  },
  {
    text: preExtension || '', // user/cypress/integration/file.spec.tsx -> .spec.
    highlight: options.shouldMigratePreExtension,
    group: 'preExtension',
  }, {
    text: extension || '', // user/cypress/integration/file.spec.tsx -> tsx
    highlight: false,
  }].filter((f) => f.text.length) as FilePart[]
}
