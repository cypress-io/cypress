import { enumType } from 'nexus'

export const PLUGINS_STATE = ['uninitialized', 'initialized'] as const

export type PluginsState = typeof PLUGINS_STATE[number]

export const PluginsStateEnum = enumType({
  name: 'PluginsState',
  members: PLUGINS_STATE,
})
