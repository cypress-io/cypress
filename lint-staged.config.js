// Routing lives in scripts/eslint-routing.js, shared with Claude Code's edit
// hook, so a package that has migrated to flat config is linted the same way
// here, there, and by `yarn lint`.

const { LINTABLE_EXTENSIONS, findWorkspace, isLintable } = require('./scripts/eslint-routing')

const LINTABLE_GLOB = `**/*.{${LINTABLE_EXTENSIONS.map((extension) => extension.slice(1)).join(',')}}`

const eslintCommands = (files) => {
  const groups = new Map()

  for (const file of files) {
    // __dirname, not process.cwd(): this config sits at the repo root, which is
    // what the routing resolves against however lint-staged was invoked.
    const workspace = isLintable(file) ? findWorkspace(file, __dirname) : null

    if (!workspace) {
      continue
    }

    const command = workspace.isFlatConfig && workspace.name
      ? `yarn workspace ${workspace.name} eslint --fix`
      : 'eslint --fix'

    groups.set(command, [...groups.get(command) ?? [], file])
  }

  return [...groups].map(([command, group]) => `${command} ${group.map((file) => JSON.stringify(file)).join(' ')}`)
}

module.exports = {
  [LINTABLE_GLOB]: eslintCommands,
  '.circleci/*.yml': 'circleci config validate',
}
