import _ from 'lodash'
import cs from 'classnames'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Select from 'react-select'

import authStore from '../auth/auth-store'
import { gravatarUrl } from '../lib/utils'

@observer
class OrgSelector extends Component {
  static propTypes = {
    orgs: PropTypes.array.isRequired,
    selectedOrgId: PropTypes.string,
    onCreateOrganization: PropTypes.func.isRequired,
    onUpdateSelectedOrgId: PropTypes.func.isRequired,
  }

  render () {
    const { orgs } = this.props

    if (!orgs.length) {
      return (
        <div className='empty-select-orgs well'>
          <p>You don't have any organizations yet.</p>
          <p>Organizations can help you manage projects, including billing.</p>
          <p>
            <a
              href='#'
              className='btn btn-link'
              onClick={this.props.onCreateOrganization}>
              <i className='fas fa-plus' />{' '}
              Create organization
            </a>
          </p>
        </div>
      )
    }

    const options = this._options()
    const selectedOption = _.find(options, { value: this.props.selectedOrgId })

    return (
      <div className={cs({ hidden: !orgs.length })}>
        <Select
          className='organizations-select'
          classNamePrefix='organizations-select'
          value={selectedOption}
          onChange={this._handleChange}
          options={options}
        />
      </div>
    )
  }

  _options () {
    return _.map(this.props.orgs, (org) => {
      return {
        value: org.id,
        default: org.default,
        label: this._getOptionLabel(org),
      }
    })
  }

  _getOptionLabel (org) {
    if (!org.default) return org.name

    return (
      <div>
        <img
          className='user-avatar'
          height='13'
          width='13'
          src={`${gravatarUrl(authStore.user && authStore.user.email)}`}
        />
        Your personal organization
      </div>
    )
  }

  _handleChange = (selectedOption) => {
    const selectedOrgId = selectedOption.value

    this.props.onUpdateSelectedOrgId(selectedOrgId)
  }
}

export default OrgSelector
