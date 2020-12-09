/// <reference path="../../../cli/types/cypress.d.ts" />

import chokidar, { FSWatcher } from 'chokidar'
import _ from 'lodash'
import { findSpecsOfType } from '@packages/server/lib/util/specs'

type SpecFile = Cypress.Cypress['spec']
type SpecFiles = SpecFile[]

interface SpecsControllerOptions {
  onSpecListChanged: (specFiles?: SpecFiles) => {}
}

const defaultOptions = {
  onSpecListChanged () {},
} as SpecsControllerOptions

export class SpecsController {
  watcher: FSWatcher | null = null
  specFiles: SpecFiles = []

  constructor (private cypressConfig, private options) {
    this.options = _.defaultsDeep(options, defaultOptions)
  }

  get specDirectory () {
    return this.cypressConfig.componentFolder || '.'
  }

  get watchOptions (): chokidar.WatchOptions {
    return {
      cwd: this.specDirectory,
      ignored: this.cypressConfig.ignoreTestFiles,
      ignoreInitial: true,
    }
  }

  private async onChange () {
    const newSpecs = await this.getSpecFiles()

    if (_.isEqual(newSpecs, this.specFiles)) return

    this.specFiles = newSpecs
    this.options.onSpecListChanged(this.specFiles)
  }

  async getSpecFiles (): Promise<SpecFiles> {
    const commonSearchOptions = ['fixturesFolder', 'supportFile', 'projectRoot', 'javascripts', 'testFiles', 'ignoreTestFiles']
    const searchOptions = _.pick(this.cypressConfig, commonSearchOptions)

    searchOptions.searchFolder = this.specDirectory

    return findSpecsOfType(searchOptions)
  }

  watch () {
    const debounce = (fn) => _.debounce(fn, 250, { leading: true })

    this.watcher = chokidar.watch(this.cypressConfig.testFiles, this.watchOptions)

    this.watcher.on('add', debounce(this.onChange.bind(this)))
    this.watcher.on('unlink', debounce(this.onChange.bind(this)))
  }
}
