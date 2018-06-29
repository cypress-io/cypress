import _ from 'lodash'
import { action, computed, observable } from 'mobx'

import localData from '../lib/local-data'
import Spec from './spec-model'

const ALL_SPECS = '__all'

export class SpecsStore {
  @observable _specs = []
  @observable error = null
  @observable isLoading = false
  @observable filter = null

  constructor () {
    this.models = []

    this.allSpecsSpec = new Spec({
      name: null,
      path: ALL_SPECS,
      displayName: 'Run all specs',
      obj: {
        name: 'All Specs',
        relative: null,
        absolute: null,
      },
    })
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

  @action setChosenSpec (spec) {
    // set all the models to false
    _
    .chain(this.models)
    .concat(this.allSpecsSpec)
    .invokeMap('setChosen', false)
    .value()

    if (spec) {
      spec.setChosen(true)
    }
  }

  @action setExpandSpecFolder (spec) {
    spec.setExpanded(!spec.isExpanded)
  }

  @action setFilter (projectId, filter = null) {
    localData.set(`specsFilter-${projectId}`, filter)

    this.filter = filter
  }

  @action clearFilter (projectId) {
    localData.remove(`specsFilter-${projectId}`)

    this.filter = null
  }

  setChosenSpecByRelativePath (relativePath) {
    // TODO: currently this will always find nothing
    // because this data is sent from the driver when
    // a spec first opens. it passes the normalized url
    // which will no longer match any spec. we need to
    // change the logic to do this. it's barely worth it though.
    const found = this.findSpecModelByPath(relativePath)

    if (found) {
      this.setChosenSpec(found)
    }
  }

  findOrCreateSpec (file, segment) {
    const spec = new Spec({
      obj: file, // store the original obj
      name: file.name,
      path: file.relative,
      displayName: segment,
    })

    const found = this.findSpecModelByPath(file.relative)

    if (found) {
      spec.merge(found)
    }

    return spec
  }

  findSpecModelByPath (path) {
    return _.find(this.models, { path })
  }

  getAllSpecsSpec () {
    return this.allSpecsSpec
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

    const specModels = []

    const tree = _.reduce(specs, (root, file) => {
      let placeholder = root

      const segments = file.name.split('/')

      _.each(segments, (segment) => {
        let spec = _.find(placeholder, { displayName: segment })
        if (!spec) {
          spec = this.findOrCreateSpec(file, segment)

          specModels.push(spec)
          placeholder.push(spec)
        }

        placeholder = spec.children
      })

      return root
    }, [])

    this.models = specModels

    return tree
  }
}

export default new SpecsStore()
