import '../../spec_helper'
import path from 'path'
import { trashAssets } from '../../../lib/modes/run'
import * as errors from '../../../lib/errors'
import trash from '../../../lib/util/trash'
import type { Cfg } from '../../../lib/project-base'

const projectRoot = path.join('/var', 'www', 'project')

const makeConfig = (overrides: Partial<Cfg> = {}): Cfg => {
  return {
    projectRoot,
    trashAssetsBeforeRuns: true,
    videosFolder: path.join(projectRoot, 'cypress', 'videos'),
    screenshotsFolder: path.join(projectRoot, 'cypress', 'screenshots'),
    downloadsFolder: path.join(projectRoot, 'cypress', 'downloads'),
    ...overrides,
  } as Cfg
}

describe('lib/modes/run', () => {
  context('.trashAssets', () => {
    let trashFolder: sinon.SinonStub
    let warning: sinon.SinonStub

    beforeEach(() => {
      trashFolder = sinon.stub(trash, 'folder').resolves()
      warning = sinon.stub(errors, 'warning')
    })

    const trashedFolders = () => trashFolder.getCalls().map((call) => call.args[0])

    it('trashes each asset folder', async () => {
      await trashAssets(makeConfig())

      expect(trashedFolders()).to.have.members([
        path.join(projectRoot, 'cypress', 'videos'),
        path.join(projectRoot, 'cypress', 'screenshots'),
        path.join(projectRoot, 'cypress', 'downloads'),
      ])

      expect(warning).not.to.be.called
    })

    it('does nothing when trashAssetsBeforeRuns is not true', async () => {
      await trashAssets(makeConfig({ trashAssetsBeforeRuns: false }))

      expect(trashFolder).not.to.be.called
    })

    it('skips folders set to false', async () => {
      await trashAssets(makeConfig({ screenshotsFolder: false as any }))

      expect(trashedFolders()).not.to.include(false)
      expect(trashedFolders()).to.have.lengthOf(2)
    })

    // https://github.com/cypress-io/cypress/issues/26393
    it('does not trash a folder that resolves to the project root', async () => {
      await trashAssets(makeConfig({ downloadsFolder: projectRoot }))

      expect(trashedFolders()).not.to.include(projectRoot)
      expect(trashedFolders()).to.have.lengthOf(2)

      expect(warning).to.be.calledWith(
        'CANNOT_TRASH_ASSETS_UNSAFE_FOLDER',
        [`downloadsFolder: ${projectRoot}`],
        projectRoot,
      )
    })

    it('does not trash a folder that is an ancestor of the project root', async () => {
      const parent = path.join('/var', 'www')

      await trashAssets(makeConfig({ videosFolder: parent }))

      expect(trashedFolders()).not.to.include(parent)
      expect(warning).to.be.calledWith(
        'CANNOT_TRASH_ASSETS_UNSAFE_FOLDER',
        [`videosFolder: ${parent}`],
        projectRoot,
      )
    })

    it('still trashes the remaining folders and warns once for all unsafe ones', async () => {
      await trashAssets(makeConfig({
        videosFolder: path.join('/var', 'www'),
        downloadsFolder: projectRoot,
      }))

      expect(trashedFolders()).to.eql([path.join(projectRoot, 'cypress', 'screenshots')])

      expect(warning).to.be.calledOnce
      expect(warning).to.be.calledWith(
        'CANNOT_TRASH_ASSETS_UNSAFE_FOLDER',
        [
          `videosFolder: ${path.join('/var', 'www')}`,
          `downloadsFolder: ${projectRoot}`,
        ],
        projectRoot,
      )
    })

    it('trashes folders outside of the project that do not contain it', async () => {
      const outside = path.join('/tmp', 'cypress-videos')

      await trashAssets(makeConfig({ videosFolder: outside }))

      expect(trashedFolders()).to.include(outside)
      expect(warning).not.to.be.called
    })

    it('warns but does not throw when trashing fails', async () => {
      const err = new Error('nope')

      trashFolder.rejects(err)

      await trashAssets(makeConfig())

      expect(warning).to.be.calledWith('CANNOT_TRASH_ASSETS', err)
    })
  })
})
