// @ts-check
const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const shell = require('shelljs')
const semver = require('semver')

/**
 * @param {string} minor
 * @returns {string[]} versions
 */
function getAllMinorsFrom (minor) {
  const { stdout: all } = shell.exec('npm view typescript versions --json', { silent: true })

  // all minors
  const minors = new Set([
    ...JSON.parse(all)
    .filter((x) => semver.gt(x, minor))
    .map((x) => x.slice(0, 3)),
  ])

  return Array.from(minors)
}

/**
 * @param {string} version
 */
function typeCheck (version) {
  const dir = fs.mkdtempSync(`${os.tmpdir()}/typescript-${version}`)

  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      dependencies: {
        typescript: `~${version}`,
      },
    }, null, 4),
  )

  console.log(`📦 Install TypeScript v${version}`)
  const { stderr, code } = shell.exec('yarn install', { cwd: dir, silent: true })

  // tried to install a minor ahead of the current latest
  // this means we've tested against the latest minor
  if (code > 0 && stderr.includes(`Couldn't find any versions for "typescript" that matches`)) {
    console.log('✅ Done - all types are correct!')
    process.exit(0)
  }

  const cmd = `${path.join(dir, 'node_modules', '.bin', 'tsc')} -p types/tests/tsconfig.json`

  console.log(`🏃‍♂️ Running type check against TypeScript v${version}: ${cmd}`)
  const res = shell.exec(cmd, { cwd: path.join(__dirname, '..') })

  const icon = res.code === 0 ? '✅' : '❌'

  console.log(`${icon} Finished with code ${res.code}\n`)

  if (res.code > 0) {
    console.error(res.stdout)
    process.exit(res.code)
  }
}

function main () {
  const minors = getAllMinorsFrom('3.4.0')

  for (const version of minors) {
    typeCheck(version)
  }
}

main()
