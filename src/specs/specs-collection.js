import _ from 'lodash'
import { observable, action } from 'mobx'

import Spec from './spec-model'

export class SpecsCollection {
  @observable specs = []
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false
  @observable allSpecsChosen = false

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setSpecs (specs) {
    this.specs = this.resetToTreeView(specs)

    this.isLoading = false
    this.isLoaded = true
  }

  @action setChosenSpec (specId) {
    if (specId === '__all') {
      this.allSpecsChosen = true
    } else {
      this.allSpecsChosen = false
    }

    function setChosen (specs) {
      _.forEach(specs, (spec) => {
        // we're a file if we have no child specs
        if (!spec.children.specs.length && (spec.id === specId)) {
          spec.isChosen = true
        } else {
          spec.isChosen = false
          setChosen(spec.children.specs)
        }
      })
    }

    setChosen(this.specs)
  }


  findByName (specs, path) {
    return _.find(specs, (spec) => (spec.name === path))
  }

  getFilesSplitByDirectory (specs) {
    return _.map(specs, (spec) => (spec.name.split("/")))
  }

  resetToTreeView (specs) {
    let specsTree = new SpecsCollection([])

    _.forEach(this.getFilesSplitByDirectory(specs), (segments) => {
      _.reduce(segments, (memo, segment) => {
        // attempt to find an existing spec
        // on the specs memo by its segment name
        let spec = memo.findByName(memo.specs, segment)

        // if its not found then we know we need to
        // push a new spec into the specs memo
        if (!spec) {
          memo.specs.push(new Spec({ name: segment }))

          spec = memo.specs[memo.specs.length - 1]
        }

        // set the full segment if its the spec model
        if (_.last(segments) === segment) {
          spec.fullPath = segments.join("/")
        }

        spec.id = segments.join("/")

        // and always return the spec's children
        return spec.children

      }, specsTree)
    })

    return specsTree.specs
  }
}

export default new SpecsCollection()
