import fs from 'fs'
import path from 'path'

/**
 * Walks up from `filePath` to find the nearest `package.json` and returns its `"type"` field.
 *
 * Mirrors Node's package scope lookup: the closest `package.json` to the file determines
 * whether extensionless formats (`.js`, `.ts`) are treated as ESM or CJS.
 *
 * Returns `undefined` when no `"type"` is set (Node defaults to `"commonjs"`) or when no
 * `package.json` exists in any parent directory.
 */
const getNearestPackageJsonType = (filePath: string): string | undefined => {
  let dir = path.dirname(filePath)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pkgPath = path.join(dir, 'package.json')

    if (fs.existsSync(pkgPath)) {
      try {
        // eslint-disable-next-line no-restricted-syntax
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { type?: string }

        if (typeof pkg.type === 'string') {
          return pkg.type
        }
      } catch {
        // ignore invalid package.json
      }

      // package.json exists but has no "type" field — Node treats this scope as commonjs
      return undefined
    }

    const parent = path.dirname(dir)

    if (parent === dir) {
      // Reached filesystem root without finding a package.json
      return undefined
    }

    dir = parent
  }
}

/**
 * Determines whether a Cypress config file should be loaded via `import()` (ESM) or
 * `require()` (CJS), using Node.js module semantics — no fallback between the two.
 *
 * Extension always wins over package.json `"type"`:
 *   - `.mjs` / `.mts` → ESM
 *   - `.cjs` / `.cts` → CJS
 *   - `.js` / `.ts`   → ESM only when nearest `package.json` has `"type": "module"`
 *
 * @see https://github.com/cypress-io/cypress/issues/33892
 */
export const shouldLoadConfigAsEsm = (configFilePath: string): boolean => {
  const ext = path.extname(configFilePath).toLowerCase()

  // Explicit ESM extensions — always loaded via import(), regardless of package.json
  if (ext === '.mjs' || ext === '.mts') {
    return true
  }

  // Explicit CJS extensions — always loaded via require(), regardless of package.json
  if (ext === '.cjs' || ext === '.cts') {
    return false
  }

  // .js and .ts follow the nearest package.json "type" field (defaults to CJS)
  return getNearestPackageJsonType(configFilePath) === 'module'
}
