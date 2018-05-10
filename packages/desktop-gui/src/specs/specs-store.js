import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import localData from '../lib/local-data'
import Spec from './spec-model'

export class SpecsStore {
  @observable _specs = []
  @observable error = null
  @observable isLoading = false
  @observable chosenSpecPath
  @observable filter = null

  @computed get allSpecsChosen () {
    return this.chosenSpecPath === '__all'
  }

  @computed get specs () {
    return this._tree(this._specs)
  }

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setSpecs (specs) {
    this._specs = specs

    this.isLoading = false
  }

  @action setChosenSpec (specPath) {
    this.chosenSpecPath = specPath
  }

  @action setExpandSpecFolder (spec) {
    spec.setExpanded(!spec.isExpanded)
  }

  @action setFilter (projectId, filter) {
    localData.set(`specsFilter-${projectId}`, filter)

    this.filter = filter
  }

  @action clearFilter (projectId) {
    localData.remove(`specsFilter-${projectId}`)

    this.filter = null
  }

  isChosenSpec (spec) {
    return spec.name === this.chosenSpecPath || spec.path === this.chosenSpecPath
  }

  _tree (specsByType) {
    let specs = _.flatten(_.map(specsByType, (specs, type) => {
      return _.map(specs, (spec) => {
        // add type (unit, integration, etc) to beginning
        // and  change \\ to / for Windows
        return _.extend({}, spec, {
          name: `${type}/${spec.name.replace(/\\/g, '/')}`,
        })
      })
    }))

    if (this.filter) {
      specs = _.filter(specs, (spec) => {
        return spec.name.toLowerCase().includes(this.filter.toLowerCase())
      })
    }

    return _.reduce(specs, (root, file) => {
      let placeholder = root
      const segments = file.name.split('/')
      _.each(segments, (segment) => {
        let spec = _.find(placeholder, { displayName: segment })
        if (!spec) {
          spec = new Spec({
            name: file.name,
            displayName: segment,
            path: file.path,
          })
          placeholder.push(spec)
        }
        placeholder = spec.children
      })
      return root
    }, [])
  }
}

export default new SpecsStore()
