import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import Spec from './spec-model'

export class SpecsStore {
  @observable specs = []
  @observable error = null
  @observable isLoading = false
  @observable chosenSpecPath

  @computed get allSpecsChosen () {
    return this.chosenSpecPath === '__all'
  }

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setSpecs (specsByType) {
    this.specs = this._tree(specsByType)

    this.isLoading = false
  }

  @action setChosenSpec (specPath) {
    this.chosenSpecPath = specPath
  }

  isChosenSpec (spec) {
    return spec.name === this.chosenSpecPath || spec.path === this.chosenSpecPath
  }

  _tree (specsByType) {
    let specsTree = new SpecsStore()

    _.forEach(specsByType, (specs, type) => {
      const filesByDirectory = _.map(specs, (spec) => spec.name.split('/'))
      _.forEach(filesByDirectory, (segments, index) => {
        // add the 'type' to the beginning of the segment
        // so it prepend 'unit' or 'integration'
        segments.unshift(type)

        _.reduce(segments, (memo, segment) => {
          // grab the original object
          // at index so we can find its path
          let specPaths = specs[index]

          // attempt to find an existing spec
          // on the specs memo by its segment
          let spec = _.find(memo.specs, { displayName: segment })

          // if its not found then we know we need to
          // push a new spec into the specs memo
          if (!spec) {
            spec = new Spec({
              name: segments.join('/'),
              displayName: segment,
            })

            memo.specs.push(spec)
          }

          spec.path = specPaths.path

          // and always return the spec's children
          return spec.children

        }, specsTree)
      })
    })

    return specsTree.specs
  }
}

export default new SpecsStore()
