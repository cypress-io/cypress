import _ from 'lodash'
import { action, computed, observable } from 'mobx'
import path from 'path'

import localData from '../lib/local-data'
import Spec from './spec-model'
import Folder from './folder-model'

const pathSeparatorRe = /[\\\/]/g

export const allSpecsSpec = new Spec({
  name: 'All Specs',
  absolute: '__all',
  relative: '__all',
  displayName: 'Run all specs',
})

const formRelativePath = (spec) => {
  return spec === allSpecsSpec ? spec.relative : path.join(spec.type, spec.name)
}

const pathsEqual = (path1, path2) => {
  if (!path1 || !path2) return false

  return path1.replace(pathSeparatorRe, '') === path2.replace(pathSeparatorRe, '')
}

export class SpecsStore {
  @observable _files = []
  @observable chosenSpecPath
  @observable chosenSpec
  @observable error
  @observable isLoading = false
  @observable filter

  @computed get specs () {
    return this._tree(this._files)
  }

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setSpecs (specsByType) {
    this._files = _.flatten(_.map(specsByType, (specs, type) => {
      return _.map(specs, (spec) => {
        return _.extend({}, spec, { type })
      })
    }))

    this.isLoading = false
  }

  @action setChosenSpec (spec) {
    this.chosenSpecPath = spec ? formRelativePath(spec) : null
    this.chosenSpec = spec
  }

  @action setChosenSpecByRelativePath (relativePath) {
    this.chosenSpecPath = relativePath
  }

  @action setExpandSpecFolder (spec) {
    spec.setExpanded(!spec.isExpanded)
  }

  @action setFilter (project, filter = null) {
    if (!filter) return this.clearFilter(project)

    localData.set(this.getSpecsFilterId(project), filter)

    this.filter = filter
  }

  @action clearFilter (project) {
    localData.remove(this.getSpecsFilterId(project))

    this.filter = null
  }

  isChosen (spec) {
    return pathsEqual(this.chosenSpecPath, formRelativePath(spec))
  }

  getSpecsFilterId ({ id = '<no-id>', path = '' }) {
    const shortenedPath = path.replace(/.*cypress/, 'cypress')

    return `specsFilter-${id}-${shortenedPath}`
  }

  _tree (files) {
    if (this.filter) {
      files = _.filter(files, (spec) => {
        return spec.name.toLowerCase().includes(this.filter.toLowerCase())
      })
    }

    const tree = _.reduce(files, (root, file) => {
      const segments = [file.type].concat(file.name.split(pathSeparatorRe))
      const segmentsPassed = []

      let placeholder = root

      _.each(segments, (segment, i) => {
        segmentsPassed.push(segment)
        const currentPath = path.join(...segmentsPassed)
        const isCurrentAFile = i === segments.length - 1
        const props = { path: currentPath, displayName: segment }

        let existing = _.find(placeholder, (file) => {
          return pathsEqual(file.path, currentPath)
        })

        if (!existing) {
          existing = isCurrentAFile ? new Spec(_.extend(file, props)) : new Folder(props)

          placeholder.push(existing)
        }

        if (!isCurrentAFile) {
          placeholder = existing.children
        }
      })

      return root
    }, [])

    return tree
  }
}

export default new SpecsStore()
