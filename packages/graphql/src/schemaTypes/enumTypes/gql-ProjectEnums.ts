import { PLUGINS_STATE } from '@packages/types'
import { enumType } from 'nexus'

export const PluginsStateEnum = enumType({
  name: 'PluginsState',
  members: PLUGINS_STATE,
})
