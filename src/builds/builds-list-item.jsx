import React, { Component } from 'react'
import { Link } from 'react-router'
import { observer } from 'mobx-react'

@observer
class Build extends Component {
  render () {
    let build = this.props.build
    return (
      <Link
        className={`build`}
        to={`${build.num}`}
        >
        <div className='row-column-wrapper'>
          <div className='row-column'>
            {build.num}
          </div>
        </div>
      </Link>
    )
  }
}

export default Build
