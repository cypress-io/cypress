import * as fs from 'fs-extra'
import { isBinaryFile } from 'isbinaryfile'
import * as path from 'path'
import * as ejs from 'ejs'
import fm from 'front-matter'

export interface Action {
  templateDir: string
  target: string
  overwrite?: boolean
}

export interface CodeGenResult {
  status: 'add' | 'overwrite' | 'skipped'
  type: 'text' | 'binary'
  file: string
  content: string
}

export interface CodeGenResults {
  files: Array<CodeGenResult>
  failed: Array<Error>
}

/**
 * Utility for generating files from ejs templates or for general scaffolding purposes.
 * Given a template directory, all files within will be moved to the target directory specified whilst
 * maintaining the folder hierarchy. It supports both text and binary files, with text files having the
 * additional ability to be rendered with .ejs support meaning any arguments passed in can be interpolated
 * into the file. For custom file naming, front-matter can be used to specify the output fileName.
 */
export async function codeGenerator (
  action: Action,
  args: { [key: string]: any },
): Promise<CodeGenResults> {
  const templateFiles = await allFilesInDir(action.templateDir)
  const codeGenResults: CodeGenResults = { files: [], failed: [] }

  for (const file of templateFiles) {
    const isBinary = await isBinaryFile(file)
    const parsedFile = path.parse(file)

    const processBinaryFile = async () => {
      const rawFileContent = await fs.readFile(file)
      const computedPath = computePath(
        action.templateDir,
        action.target,
        file,
        args,
      )

      return { computedPath, content: rawFileContent, type: 'binary' } as const
    }

    const processTextFile = async () => {
      const fileContent = (await fs.readFile(file)).toString()
      const { body, renderedAttributes } = frontMatter(fileContent, args)
      const computedPath = computePath(
        action.templateDir,
        action.target,
        path.join(
          parsedFile.dir,
          renderedAttributes.fileName || parsedFile.base,
        ),
        args,
      )
      const renderedTemplate = ejs.render(body, args)

      return { computedPath, content: renderedTemplate, type: 'text' } as const
    }

    try {
      const { content, computedPath, type } = isBinary
        ? await processBinaryFile()
        : await processTextFile()

      const exists = await fileExists(computedPath)
      const status = !exists
        ? 'add'
        : exists && action.overwrite
          ? 'overwrite'
          : 'skipped'

      if (status === 'add' || status === 'overwrite') {
        await fs.outputFile(computedPath, content)
      }

      codeGenResults.files.push({
        file: computedPath,
        type,
        status,
        content: content.toString(),
      })
    } catch (e) {
      codeGenResults.failed.push(e as Error)
    }
  }

  return codeGenResults
}

function computePath (
  srcFolder: string,
  target: string,
  filePath: string,
  substitutions: { [k: string]: any },
): string {
  const relativeFromSrcFolder = path.relative(srcFolder, filePath)
  let computedPath = path.join(target, relativeFromSrcFolder)

  Object.entries(substitutions).forEach(([propertyName, value]) => {
    computedPath = computedPath.split(`{{${propertyName}}}`).join(value)
  })

  return computedPath
}

async function allFilesInDir (parent: string): Promise<string[]> {
  let res: string[] = []

  for (const dir of await fs.readdir(parent)) {
    const child = path.join(parent, dir)
    const isDir = (await fs.stat(child)).isDirectory()

    if (!isDir) {
      res.push(child)
    } else {
      res = [...res, ...(await allFilesInDir(child))]
    }
  }

  return res
}

function frontMatter (content: string, args: { [key: string]: any }) {
  const { attributes, body } = fm(content, { allowUnsafe: true }) as {
    attributes: { [key: string]: string }
    body: string
  }
  const renderedAttributes = Object.entries(attributes).reduce(
    (acc, [key, val]) => ({ ...acc, [key]: ejs.render(val, args) }),
    {} as { [key: string]: string },
  )

  return { body, renderedAttributes }
}

async function fileExists (absolute: string) {
  try {
    await fs.access(absolute, fs.constants.F_OK)

    return true
  } catch (e) {
    return false
  }
}
