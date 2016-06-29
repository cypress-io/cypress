import _ from 'lodash'
import React, { Component } from 'react'
import { getSpecs } from './specs-api'
import specsCollection from './specs-collection'
import { observer } from 'mobx-react'

@observer
class Specs extends Component {
  constructor (props) {
    super(props)
    getSpecs(this.props.project)
  }

  render () {
    if (!specsCollection.isLoaded) return null

    return (
      <div id='tests-list-page'>
        <ul className='outer-files-container list-as-table'>
          { _.map(specsCollection.specs, (spec) => (
            this.specItem(spec)
          ))}
        </ul>
      </div>
    )
  }

  specItem (spec) {
    if (spec.children.specs && spec.children.specs.length) {
      return (
        <li key={spec.id} className='folder'>
          <div>
            <div>
              <i className='fa fa-folder-o'></i>
              { spec.name }{' '}
            </div>
          </div>
          <div>
            <div>
              <ul className='list-as-table'>
                { _.map(spec.children.specs, (spec) => (
                  this.specItem(spec)
                ))}
              </ul>
            </div>
          </div>
        </li>
      )
    } else {
      return (
        <li key={spec.id} className='file'>
          <a href='#'>
            <div>
              <div>
                <i className='fa fa-file-o'></i>
                { spec.name }
              </div>
            </div>
            <div>
              <div></div>
            </div>
          </a>
        </li>
      )
    }
  }
}

export default Specs
