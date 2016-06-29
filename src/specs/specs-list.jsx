import _ from 'lodash'
import React, { Component } from 'react'
import { getSpecs } from './specs-api'
import specsStore from './specs-store'
import { observer } from 'mobx-react'

@observer
class Specs extends Component {
  constructor (props) {
    super(props)
    getSpecs(this.props.project)
  }

  render () {
    if (!specsStore.isLoaded) return null

    return (
      <div id="tests-list-page">
        <ul className="outer-files-container list-as-table">
          <li className="folder">
            <div>
              <div>
                <i className="fa fa-folder-open-o"></i>
                Integration{" "}
              </div>
              <div>
                <ul className="list-as-table">
                  { _.map(specsStore.specs, (spec) => (
                    <li key={spec.id} className='li'>
                      { spec.id }
                    </li>
                  ))}
                  <li className="file">
                    <div>
                      <div>
                        <i className="fa fa-file-o"></i>
                        Baz.coffee
                      </div>
                    </div>
                    <div>
                      <div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </li>
        </ul>
      </div>
    )
  }
}

export default Specs
