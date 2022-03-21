import fs from 'fs-extra'
import path from 'path'
import _ from 'lodash'
import { parse } from '@babel/parser'
import * as t from '@babel/types'
import traverse from '@babel/traverse'

async function allFilesInDir (parent: string): Promise<string[]> {
  const dirs = await fs.readdir(parent)

  const result = await Promise.all(dirs.map(async (dir) => {
    const child = path.join(parent, dir)
    let isDir

    try {
      isDir = (await fs.stat(child)).isDirectory()
    } catch {
      return []
    }

    if (/(node_modules|__snapshots__|dist|\.cy|\.projects|system-tests|_fixtures|cypress-tests\.ts)$/.test(child)) {
      return []
    }

    return isDir ? await allFilesInDir(child) : child
  }))

  return _.flatten(result).filter((path) => /\.(ts|tsx|js|jsx)$/.test(path))
}

export async function crawlDeps () {
  const npmPackages = path.join(__dirname, '../../../npm')
  const result = await allFilesInDir(npmPackages)

  const fileImports: Record<string, string[]> = {}

  await Promise.all(result.map(async (file) => {
    const result = await fs.readFile(file, 'utf8')
    let parsed

    try {
      parsed = parse(result, {
        sourceType: 'unambiguous',
        plugins: file.endsWith('x') || file.includes('react') ? [
          'typescript',
          'decorators-legacy',
          'jsx',
        ] : [
          'typescript',
          'decorators-legacy',
        ],
      })
    } catch (e) {
      if (/(error|fails)/.test(file) || e.reasonCode === 'IllegalReturn') {
        return
      }

      console.error(`Error parsing ${file}\n`)
      console.error(e)

      return
    }

    // Is this something we'd expect to find in package.json / node_modules
    function isModuleRef (val: string) {
      return /^[A-z@]/.test(val)
    }

    traverse(parsed, {
      // import ... from 'some/path'
      ImportDeclaration (path) {
        if (isModuleRef(path.node.source.value)) {
          fileImports[file] = fileImports[file] || []
          fileImports[file].push(path.node.source.value)
        }
      },
      // require('some/path')
      CallExpression (path) {
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === 'require' &&
          path.node.arguments.length === 1 &&
          t.isStringLiteral(path.node.arguments[0]) &&
          isModuleRef(path.node.arguments[0].value)
        ) {
          fileImports[file] = fileImports[file] || []
          fileImports[file].push(path.node.arguments[0].value)
        }
      },
    })
  }))

  console.log(fileImports)
}
