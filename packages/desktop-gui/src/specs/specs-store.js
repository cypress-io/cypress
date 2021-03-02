import _ from 'lodash'
import { action, computed, observable } from 'mobx'
import path from 'path'

import localData from '../lib/local-data'
import Spec from './spec-model'
import Folder from './folder-model'

const pathSeparatorRe = /[\\\/]/g

export const allIntegrationSpecsSpec = new Spec({
  name: 'All Integration Specs',
  absolute: '__all',
  relative: '__all',
  displayName: 'Run all specs',
  specType: 'integration',
})

export const allComponentSpecsSpec = new Spec({
  name: 'All Component Specs',
  absolute: '__all',
  relative: '__all',
  displayName: 'Run all component specs',
  specType: 'component',
})

const formRelativePath = (spec) => {
  return spec.relative
}

const pathsEqual = (path1, path2) => {
  if (!path1 || !path2) return false

  return path1.replace(pathSeparatorRe, '') === path2.replace(pathSeparatorRe, '')
}

/**
 * Filters give file objects by spec name substring
*/
const filterSpecs = (filter, files) => {
  if (!filter) {
    return files
  }

  const filteredFiles = _.filter(files, (spec) => {
    return spec.name.toLowerCase().includes(filter.toLowerCase())
  })

  return filteredFiles
}

export class SpecsStore {
  /**
   * All spec files
   *
   * @memberof SpecsStore
   */
  @observable _files = []
  @observable chosenSpecPath
  @observable error
  @observable isLoading = false
  @observable filter
  @observable selectedSpec

  @computed get specs () {
    return this._tree(this._files)
  }

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setSpecs (specsByType) {
    this._files = _.flatten(_.map(specsByType, (specs, type) => {
      return _.map(specs, (spec) => {
        return _.extend({}, spec, { specType: type })
      })
    }))

    this.isLoading = false
  }

  @action setChosenSpec (spec) {
    this.chosenSpecPath = spec ? formRelativePath(spec) : null
  }

  @action setChosenSpecByRelativePath (relativePath) {
    // find an actual spec using relative path
    if (relativePath === allIntegrationSpecsSpec.relative) {
      this.chosenSpecPath = relativePath
    } else if (relativePath === allComponentSpecsSpec.relative) {
      this.chosenSpecPath = relativePath
    } else {
      const foundSpec = this._files.find((file) => {
        return file.relative.endsWith(relativePath)
      })

      if (foundSpec) {
        this.chosenSpecPath = foundSpec.relative
      } else {
        // a problem: could not find chosen spec
        this.chosenSpecPath = null
      }
    }
  }

  @action setExpandSpecFolder (spec, isExpanded) {
    spec.setExpanded(isExpanded)
  }

  @action toggleExpandSpecFolder (spec) {
    spec.setExpanded(!spec.isExpanded)
  }

  @action setExpandSpecChildren (spec, isExpanded) {
    this._depthFirstIterateSpecs(spec, (specOrFolder) => {
      if (specOrFolder.isFolder) {
        specOrFolder.setExpanded(isExpanded)
      }
    })
  }

  @action setFilter (project, filter = null) {
    if (!filter) {
      return this.clearFilter(project)
    }

    localData.set(this.getSpecsFilterId(project), filter)

    this.filter = filter
  }

  @action clearFilter (project) {
    localData.remove(this.getSpecsFilterId(project))

    this.filter = null
  }

  @action setSelectedSpec (spec) {
    this.selectedSpec = spec
  }

  isChosen (spec) {
    return pathsEqual(this.chosenSpecPath, formRelativePath(spec))
  }

  getSpecsFilterId ({ id, path = '' }) {
    const shortenedPath = path.replace(/.*cypress/, 'cypress')

    return `specsFilter-${id || '<no-id>'}-${shortenedPath}`
  }

  specHasFolders (specOrFolder) {
    if (!specOrFolder.isFolder) {
      return false
    }

    return specOrFolder.children.some((child) => child.isFolder)
  }

  /**
   * Returns only specs matching the current filter
   *
   * @memberof SpecsStore
   */
  getFilteredSpecs () {
    return filterSpecs(this.filter, this._files)
  }

  _tree (files) {
    files = filterSpecs(this.filter, files)

    const tree = _.reduce(files, (root, file) => {
      const segments = [file.specType].concat(file.name.split(pathSeparatorRe))
      const segmentsPassed = []

      let placeholder = root

      _.each(segments, (segment, i) => {
        segmentsPassed.push(segment)
        const currentPath = path.join(...segmentsPassed)
        const isCurrentAFile = i === segments.length - 1

        const props = {
          path: currentPath,
          displayName: segment,
          specType: file.specType,
        }

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

  _depthFirstIterateSpecs (root, func) {
    _.each(root.children, (child) => {
      func(child)
      if (child.isFolder) {
        this._depthFirstIterateSpecs(child, func)
      }
    })
  }
}

export default new SpecsStore()
