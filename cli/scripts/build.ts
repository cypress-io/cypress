import _ from 'lodash'
import path from 'path'
import shell from 'shelljs'
import fs from 'fs-extra'

// grab the current version and a few other properties
// from the root package.json
import rootPkg from '@packages/root'

const {
  version,
  description,
  homepage,
  license,
  bugs,
  repository,
  keywords,
} = rootPkg as any

// the rest of properties should come from the package.json in CLI folder
const packageJsonSrc = path.join('package.json')
const packageJsonDest = path.join('build', 'package.json')

function getStdout (cmd: string): string {
  return shell.exec(cmd).trim()
}

function preparePackageForNpmRelease (json: any, branchName?: string): any {
  // modify the existing package.json
  // to prepare it for releasing to npm
  delete json.devDependencies
  delete json['private']
  // no need to include "nyc" code coverage settings
  delete json.nyc
  delete json.workspaces

  _.extend(json, {
    version,
    buildInfo: {
      commitBranch: branchName || process.env.CIRCLE_BRANCH || getStdout('git branch --show-current'),
      commitSha: getStdout('git rev-parse HEAD'),
      commitDate: new Date(getStdout('git show -s --format=%ci')).toISOString(),
      stable: false,
    },
    description,
    homepage,
    license,
    bugs,
    repository,
    keywords,
    types: 'types', // typescript types
    scripts: {
      postinstall: 'node dist/index.js --exec install',
      size: 't="$(npm pack .)"; wc -c "${t}"; tar tvf "${t}"; rm "${t}";',
    },
  })

  return json
}

async function makeUserPackageFile (branchName?: string): Promise<any> {
  const json = await fs.readJson(packageJsonSrc)
  const jsonPrepared = preparePackageForNpmRelease(json, branchName)

  await fs.outputJson(packageJsonDest, jsonPrepared, {
    spaces: 2,
  }) // returning package json object makes it easy to test

  return jsonPrepared
}

export default makeUserPackageFile

if (require.main === module) {
  makeUserPackageFile(process.env.BRANCH)
  .catch((err: any) => {
    /* eslint-disable no-console */
    console.error('Could not write user package file')
    console.error(err)
    /* eslint-enable no-console */
    process.exit(-1)
  })
}
