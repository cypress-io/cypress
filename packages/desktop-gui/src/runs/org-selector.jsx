import _ from 'lodash'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Select from 'react-select'
import { gravatarUrl } from '../lib/utils'

import authStore from '../auth/auth-store'

@observer
class OrgSelector extends Component {
  static propTypes = {
    orgs: PropTypes.object,
    isLoaded: PropTypes.bool,
    updateSelectedOrg: PropTypes.func,
  }

  constructor (...args) {
    super(...args)

    this.handleChange = this.handleChange.bind(this)
    this.state = {
      selectedOrgId: this.getSelectedOrg(this.props.orgs),
    }

    this.options = _.map(this.props.orgs, (org) => {
      return {
        value: org.id,
        default: org.default,
        label: org.default ?
          <div>
            <img
              className='user-avatar'
              height='13'
              width='13'
              src={`${gravatarUrl(authStore.user && authStore.user.email)}`}
            />
            Your personal organization
          </div> : org.name,
      }
    })
  }

  _hasDefaultOrg (orgs) {
    return _.find(orgs, { default: true })
  }

  getSelectedOrg (orgs) {
    if (!orgs.length) {
      return null
    }

    if (this._hasDefaultOrg(orgs)) {
      return this._hasDefaultOrg(orgs).id
    }

    return orgs[0].id
  }

  componentDidMount () {
    this.props.updateSelectedOrg(this.state.selectedOrgId)
  }

  handleChange (selectedOption) {
    this.setState({ selectedOrgId: selectedOption.value })
    this.props.updateSelectedOrg(this.state.selectedOrgId)
  }

  render () {
    return (
      <div className={!this.props.orgs.length ? 'hidden' : ''}>
        <Select
          className='organizations-select'
          classNamePrefix='organizations-select'
          value={this.options.filter(({ value }) => value === this.state.selectedOrgId)}
          onChange={this.handleChange}
          isLoading={!this.props.isLoaded}
          options={this.options}
        />
      </div>
    )
  }
}

export default OrgSelector
