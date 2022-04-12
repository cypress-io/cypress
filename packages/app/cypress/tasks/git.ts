import simpleGit from 'simple-git'
import path from 'path'
import fs from 'fs-extra'

async function teardownGit (projectPath: string) {
  const gitDir = path.join(projectPath, '.git')

  try {
    if (await fs.stat(gitDir)) {
      return fs.remove(gitDir)
    }
  } catch (e) {
    // git not initialized - no need to do anything
  }
}

export async function initGitRepoForTestProject (projectPath: string) {
  /**
    * There's a potential race condition the task executes
  * before the domain is updated in cypress-in-cypress e2e tests,
  * and we end up in an incorrect state where the test project
  * is not in a pristine, deterministic state.
    *
    * For this reason we check if the git repo
  * exists, and if it does, remove it and re-create it,
    * to ensure the test runs on a pristine project.
    */
  await teardownGit(projectPath)

  const git = simpleGit({ baseDir: projectPath })

  if (process.env.CI) {
    // need to set a user on CI
    await Promise.all([
      git.addConfig('user.name', 'Test User', true, 'global'),
      git.addConfig('user.email', 'test-user@example.com', true, 'global'),
    ])
  }

  const e2eFolder = path.join(projectPath, 'cypress', 'e2e')
  const fooSpec = path.join(e2eFolder, 'foo.spec.js')

  // Ensure that foo.spec.js file does not exist.
  // As described above, it's possible that during e2e testing:
  // 1. execute this task
  // 2. create foo.spec.js
  // 3. change domain (for e2e testing)
  // 4. re-execute this task (foo.spec.js now exists)
  // 5. foo.spec.js is incorrectly added to the git repo
  // foo.spec.js is supposed to represent an untracked file,
  // so we ensure it does not exist before initializing the
  // git repo for the test project.
  try {
    await fs.stat(fooSpec)
    await fs.remove(fooSpec)
  } catch (e) {
    // it doesn't exist, no problem
  }

  const allSpecs = fs.readdirSync(e2eFolder)

  await git.init()
  await git.add(allSpecs.map((spec) => path.join(e2eFolder, spec)))
  await git.commit('add all specs')

  // create a file and modify a file to express all
  // git states we are interested in (created, unmodified, modified)
  const blankContentsSpec = path.join(e2eFolder, 'blank-contents.spec.js')

  fs.createFileSync(fooSpec)
  fs.writeFileSync(blankContentsSpec, 'it(\'modifies the file\', () => {})')

  return null
}
