import simpleGit from 'simple-git'
import path from 'path'
import fs from 'fs-extra'

export async function initGitRepoForTestProject (projectPath: string) {
  const git = simpleGit({ baseDir: projectPath })

  if (process.env.CI) {
    // need to set a user on CI
    await Promise.all([
      git.addConfig('user.name', 'Test User', true, 'global'),
      git.addConfig('user.email', 'test-user@example.com', true, 'global'),
    ])
  }

  const e2eFolder = path.join(projectPath, 'cypress', 'e2e')
  const allSpecs = fs.readdirSync(e2eFolder)

  await git.init()
  await git.add(allSpecs.map((spec) => path.join(e2eFolder, spec)))
  await git.commit('add all specs')

  // create a file and modify a file to express all
  // git states we are interested in (created, unmodified, modified)
  const fooSpec = path.join(e2eFolder, 'foo.spec.js')
  const blankContentsSpec = path.join(e2eFolder, 'blank-contents.spec.js')

  fs.createFileSync(fooSpec)
  fs.writeFileSync(blankContentsSpec, 'it(\'modifies the file\', () => {})')

  return null
}

export async function resetGitRepoForTestProject (projectPath: string) {
  const git = simpleGit({ baseDir: projectPath })

  await git.reset(['--hard'])

  return null
}
