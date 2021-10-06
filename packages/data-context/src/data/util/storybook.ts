import * as path from 'path'
import * as fs from 'fs-extra'
import * as _glob from 'glob'
import { promisify } from 'util'
import endent from 'endent'

import { readCsfOrMdx, CsfFile } from '@storybook/csf-tools'

const glob = promisify(_glob.default)

export interface StorybookFile {
  name: string
  absolute: string
  relative: string
  content: string
}

export interface StorybookInfo {
  storybookRoot: string
  files: StorybookFile[]
  storyGlobs: string[]
  getStories: (
    storybookRoot: string,
    storyGlobs: string[]
  ) => Promise<string[]>
}

export function getStorybookInfo (
  projectRoots: readonly string[],
): Promise<(StorybookInfo | null)[]> {
  return Promise.all(projectRoots.map(detectStorybook))
}

const STORYBOOK_FILES = [
  'main.js',
  'preview.js',
  'preview-head.html',
  'preview-body.html',
]

const getStories = async (storybookRoot: string, storyGlobs: string[]) => {
  const files: string[] = []

  for (const storyPattern of storyGlobs) {
    const res = await glob(path.join(storybookRoot, storyPattern))

    files.push(...res)
  }

  // Don't currently support mdx
  return files.filter((file) => !file.endsWith('.mdx'))
}

async function detectStorybook (
  projectRoot: string,
): Promise<StorybookInfo | null> {
  const storybookRoot = path.join(projectRoot, '.storybook')
  const storybookInfo: StorybookInfo = {
    storybookRoot,
    files: [],
    storyGlobs: [],
    getStories,
  }

  try {
    await fs.access(storybookRoot, fs.constants.F_OK)
  } catch {
    return null
  }

  for (const fileName of STORYBOOK_FILES) {
    try {
      const absolute = path.join(storybookRoot, fileName)
      const file = {
        name: fileName,
        relative: path.relative(projectRoot, absolute),
        absolute,
        content: await fs.readFile(absolute, 'utf-8'),
      }

      storybookInfo.files.push(file)
    } catch (e) {
      // eslint-disable-line no-empty
    }
  }

  const mainJs = storybookInfo.files.find(({ name }) => name === 'main.js')

  if (mainJs) {
    try {
      // Does this need to be wrapped in IPC?
      const mainJsModule = require(mainJs.absolute)

      storybookInfo.storyGlobs = mainJsModule.stories
    } catch (e) {
      return null
    }
  } else {
    return null
  }

  return storybookInfo
}

export async function generateSpecFromStory (
  storyPath: string,
  projectRoot: string,
): Promise<Cypress.Cypress['spec'] | null> {
  const storyFile = path.parse(storyPath)
  const storyName = storyFile.name.split('.')[0]

  try {
    const raw = await readCsfOrMdx(storyPath, {
      defaultTitle: storyName || '',
    })
    const parsed = raw.parse()

    if (
      (!parsed.meta.title && !parsed.meta.component) ||
      !parsed.stories.length
    ) {
      return null
    }

    const newSpecContent = generateSpecFromCsf(parsed, storyFile)
    const newSpecPath = path.join(
      storyPath,
      '..',
      `${parsed.meta.component}.cy-spec${storyFile.ext}`,
    )

    // If this passes then the file exists and we don't want to overwrite it
    try {
      await fs.access(newSpecPath, fs.constants.F_OK)

      return null
    } catch (e) {
      // eslint-disable-line no-empty
    }

    await fs.outputFileSync(newSpecPath, newSpecContent)

    return {
      name: path.parse(newSpecPath).name,
      relative: path.relative(projectRoot, newSpecPath),
      absolute: newSpecPath,
    }
  } catch (e) {
    return null
  }
}

function generateSpecFromCsf (parsed: CsfFile, storyFile: path.ParsedPath) {
  const isReact = parsed._ast.program.body.some(
    (statement) => {
      return statement.type === 'ImportDeclaration' &&
      statement.source.value === 'react'
    },
  )
  // Vue can be supported, but additional deps and config setup are required
  const isVue = false

  // const isVue = parsed._ast.program.body.some(
  //   (statement) =>
  //     statement.type === "ImportDeclaration" &&
  //     statement.source.value.endsWith(".vue")
  // );
  if (!isReact && !isVue) {
    throw new Error('Provided story is not supported')
  }

  const getDependency = () => (isReact ? '@cypress/react' : '@cypress/vue')
  const getMountSyntax = (component: string) => {
    return isReact ? `<${component} />` : `${component}()`
  }
  const itContent = parsed.stories
  .map((story, i) => {
    const component = story.name.replace(/\s+/, '')
    let it = endent`
        it('should render ${component}', () => {
          const { ${component} } = composedStories
          mount(${getMountSyntax(component)})
        })`

    if (i !== 0) {
      it = it
      .split('\n')
      .map((line) => `// ${line}`)
      .join('\n')
    }

    return it
  })
  .join('\n\n')

  return endent`${isReact ? `import React from "react"` : ''}
    import * as stories from "./${storyFile.name}";
    import { mount, composeStories } from "${getDependency()}";

    const composedStories = composeStories(stories);

    describe('${parsed.meta.title || parsed.meta.component}', () => {
      ${itContent}
    })`
}
