// Throwaway: converts the yarn workspace into a pnpm one for cache-timing only.
const fs = require('fs')
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
// Newer pnpm majors read settings only from pnpm-workspace.yaml; older ones from .npmrc/package.json
const overrides = Object.entries(o).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join('\n')

fs.writeFileSync('pnpm-workspace.yaml', `packages:\n${p.workspaces.packages.map((x) => `  - "${x}"`).join('\n')}\nlinkWorkspacePackages: true\noverrides:\n${overrides}\n`)
fs.appendFileSync('.npmrc', 'link-workspace-packages=true\nlockfile=true\npackage-lock=true\n')
const workspaceManifests = ['npm', 'packages', 'tooling']
.flatMap((dir) => fs.readdirSync(dir).map((name) => `${dir}/${name}/package.json`))
.concat('cli/package.json')
.filter((f) => fs.existsSync(f))

for (const f of workspaceManifests) {
  const q = JSON.parse(fs.readFileSync(f))

  if (q.resolutions) {
    delete q.resolutions
    fs.writeFileSync(f, JSON.stringify(q, null, 2))
  }
}
