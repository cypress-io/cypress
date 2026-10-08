// Throwaway: sanity-checks a pnpm-linked tree on Windows.
const fs = require('fs')
const path = require('path')

const nlinks = {}
let sampled = 0
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (sampled >= 1000) return
    const p = path.join(dir, e.name)

    if (e.isDirectory()) walk(p)
    else if (e.isFile()) {
      const n = fs.statSync(p).nlink

      nlinks[n] = (nlinks[n] || 0) + 1
      sampled++
    }
  }
}

walk('node_modules/.pnpm')
console.log('nlink distribution of 1000 sampled files:', JSON.stringify(nlinks))
console.log('package dirs in node_modules/.pnpm:', fs.readdirSync('node_modules/.pnpm').length)
for (const name of ['@packages/ts', '@packages/server', 'cypress', 'internal-scripts']) {
  const p = path.join('node_modules', name)
  let kind = 'missing'

  try {
    const st = fs.lstatSync(p)

    kind = st.isSymbolicLink() ? 'symlink/junction' : st.isDirectory() ? 'directory' : 'other'
  } catch {}
  console.log(`${p}: ${kind}`)
}
for (const [mod, from] of [['@packages/ts/package.json', 'packages/server'], ['express/package.json', 'packages/server'], ['@packages/errors/package.json', 'packages/server']]) {
  try {
    console.log(`resolve ${mod} from ${from}: OK -> ${require.resolve(mod, { paths: [path.resolve(from)] })}`)
  } catch (e) {
    console.log(`resolve ${mod} from ${from}: FAIL ${e.code}`)
  }
}
