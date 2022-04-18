import path from 'path'
import ts from 'typescript'

function compile (files: string[], options: ts.CompilerOptions) {
  for (const file of files) {
    let program = ts.createProgram(files, options)
    let emitResult = program.emit()

    let allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics)

    if (allDiagnostics.length) {
      // eslint-disable-next-line no-console
      console.log(allDiagnostics)
      throw Error(`Could not compile ${file}. See terminal console for more info`)
    }

    // eslint-disable-next-line no-console
    console.log(`Compiled ${file}`)
  }

  return null
}

export function tsCheck (payload: { projectPath: string, specs: string[] }) {
  const specPaths = payload.specs.map((spec) => path.join(payload.projectPath, spec))
  const typeRoots = [path.join(__dirname, '..', '..', '..', '..', 'cli', 'types', 'cypress')]

  return compile(specPaths, {
    allowJs: true,
    noEmit: true,
    target: 2, // 'ES2015'
    module: 1, // 'commonjs',
    typeRoots,
    resolveJsonModule: true,
    esModuleInterop: true,
  })
}
