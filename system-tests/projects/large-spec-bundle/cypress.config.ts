import fs from 'fs/promises'
import path from 'path'
import ts from 'typescript'

const BUNDLE_BYTES = 80 * 1024 * 1024

// #34794: the served bundle must be too large to fit in a single CDP message once base64-encoded.
const preprocessor = async (file) => {
  const { outputPath, filePath } = file

  const [sourceStat, outputStat] = await Promise.all([
    fs.stat(filePath),
    fs.stat(outputPath).catch(() => null),
  ])

  if (outputStat && outputStat.size === BUNDLE_BYTES && outputStat.mtimeMs > sourceStat.mtimeMs) {
    return outputPath
  }

  const source = await fs.readFile(filePath, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2019, module: ts.ModuleKind.None },
  })

  const head = `${outputText}\n//`
  const padding = 'x'.repeat(BUNDLE_BYTES - Buffer.byteLength(head))

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, `${head}${padding}`)

  return outputPath
}

export default {
  hosts: {
    '*.foobar.com': '127.0.0.1',
    '*.barbaz.com': '127.0.0.1',
  },
  e2e: {
    supportFile: false,
    setupNodeEvents (on) {
      on('file:preprocessor', preprocessor)
    },
  },
}
