import _ from 'lodash'
import {
  CYPRESS_ENV_PREFIX,
  CYPRESS_ENV_PREFIX_LENGTH,
  CYPRESS_RESERVED_ENV_VARS,
} from '../config'
import coerce from './coerce'

export const isDefault = (config: Record<string, any>, prop: string) => {
  return config.resolved[prop].from === 'default'
}

export const getProcessEnvVars = (obj: NodeJS.ProcessEnv) => {
  return _.reduce(obj, (memo, value, key) => {
    if (isCypressEnvLike(key)) {
      memo[removeEnvPrefix(key)] = coerce(value)
    }

    return memo
  }
  , {})
}

const isCypressEnvLike = (key) => {
  return _.chain(key)
  .invoke('toUpperCase')
  .startsWith(CYPRESS_ENV_PREFIX)
  .value() &&
  !_.includes(CYPRESS_RESERVED_ENV_VARS, key)
}

const removeEnvPrefix = (key: string) => {
  return key.slice(CYPRESS_ENV_PREFIX_LENGTH)
}
