// Throwaway: converts the yarn workspace into a pnpm one for cache-timing only.
const fs = require('fs')
const { execSync } = require('child_process')
const p = JSON.parse(fs.readFileSync('package.json'))

delete p.packageManager
const o = {}

for (const [k, v] of Object.entries(p.resolutions || {})) {
  const key = k.replace(/^\*\*\//, '')
  const m = key.match(/^(@[^/]+\/[^/]+|[^@/][^/]*)\/(.+)$/)

  o[m ? `${m[1]}>${m[2]}` : key] = v
}

delete p.resolutions
p.pnpm = { overrides: o }
fs.writeFileSync('package.json', JSON.stringify(p, null, 2))
fs.writeFileSync('pnpm-workspace.yaml', `packages:\n${p.workspaces.packages.map((x) => `  - "${x}"`).join('\n')}\n`)
fs.appendFileSync('.npmrc', 'link-workspace-packages=true\n')
for (const f of execSync('ls npm/*/package.json packages/*/package.json cli/package.json tooling/*/package.json').toString().trim().split('\n')) {
  const q = JSON.parse(fs.readFileSync(f))

  if (q.resolutions) {
    delete q.resolutions
    fs.writeFileSync(f, JSON.stringify(q, null, 2))
  }
}
