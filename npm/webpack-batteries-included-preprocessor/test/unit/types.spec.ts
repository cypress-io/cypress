import { expect, it } from 'vitest'
import path from 'node:path'
import ts from 'typescript'

it('exposes the resolved bundle path as a string in generated declarations', () => {
  const normalize = (filename: string) => filename.replace(/\\/g, '/')
  const packageRoot = normalize(path.resolve(__dirname, '../..'))
  const config = ts.readConfigFile(`${packageRoot}/tsconfig.json`, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, packageRoot)
  const source = ts.createProgram(parsed.fileNames, { ...parsed.options, emitDeclarationOnly: true, noEmitOnError: false })
  let declaration = ''

  source.emit(undefined, (filename, content) => {
    if (normalize(filename) === `${packageRoot}/dist/index.d.ts`) declaration = content
  }, undefined, true)

  expect(declaration).not.to.eq('')

  const root = `${packageRoot}/type-consumer`
  const consumer = `${root}/consumer.cts`
  const moduleRoot = `${root}/node_modules/@cypress/webpack-batteries-included-preprocessor`
  const files = new Map([
    [consumer, `import preprocessor = require('@cypress/webpack-batteries-included-preprocessor');
      declare const file: Parameters<ReturnType<typeof preprocessor>>[0];
      preprocessor()(file).then(outputPath => outputPath.startsWith('bundle'));
    `],
    [`${moduleRoot}/package.json`, JSON.stringify({ types: 'dist/index.d.ts' })],
    [`${moduleRoot}/dist/index.d.ts`, declaration],
  ])
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    esModuleInterop: true,
  }
  const host = ts.createCompilerHost(options)

  host.getCurrentDirectory = () => root
  host.fileExists = (filename) => files.has(normalize(filename)) || ts.sys.fileExists(filename)
  host.readFile = (filename) => files.get(normalize(filename)) ?? ts.sys.readFile(filename)
  host.directoryExists = (directory) => [...files.keys()].some((filename) => filename.startsWith(`${normalize(directory)}/`)) || ts.sys.directoryExists(directory)
  host.getSourceFile = (filename, version) => {
    const content = host.readFile(filename)

    return content === undefined ? undefined : ts.createSourceFile(filename, content, version, true)
  }

  // Check an actual consumer of emitted declarations, independently of the
  // separate full-package check-ts command and dependency implementation files.
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([consumer], options, host))
  .filter((diagnostic) => diagnostic.file && normalize(diagnostic.file.fileName) === consumer)
  .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))

  expect(diagnostics).to.deep.eq([])
})
