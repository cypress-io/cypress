const execa = require('execa')
const path = require('path')

// lists all packages that have changed from develop
// and all packages that depend on those

const main = async () => {
  const { stdout: root } = await execa('git', ['rev-parse', '--show-toplevel'])
  const { stdout: diff } = await execa('git', ['merge-base', 'origin/develop', 'HEAD'])
  const { stdout: filesChanged } = await execa('git', ['diff', '--name-only', diff])
  const { stdout: depGraph } = await execa('npx', ['lerna', 'la', '--graph'])
  const { stdout: packs } = await execa('npx', ['lerna', 'la', '--json'])

  const files = filesChanged.split('\n')
  const packages = JSON.parse(packs)
  const dependencies = JSON.parse(depGraph)

  const findDependents = (packs) => {
    const output = [...packs]

    for (let d of Object.keys(dependencies)) {
      if (!packs.includes(d) && packs.some((p) => dependencies[d].includes(p))) {
        output.push(d)
      }
    }

    return output.length === packs.length ? output : findDependents(output)
  }

  const isChanged = ({ location }) => {
    const dir = path.relative(root, location)

    return !!files.find((f) => f.includes(dir))
  }

  const changed = []

  for (let pack of packages) {
    const dependents = findDependents([pack.name])

    for (let dep of dependents) {
      if (!changed.includes(dep) && isChanged((packages.find((p) => p.name === dep)))) {
        changed.push(dep)
      }
    }
  }

  /* eslint-disable-next-line no-console */
  console.log(changed.join('\n'))
}

main()
