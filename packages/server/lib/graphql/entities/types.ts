import { objectType, enumType } from 'nexus'

const PluginsState = enumType({
  name: 'PluginsState',
  members: ['uninitialized', 'initializing', 'initialized', 'error'],
})

const InitPluginsStatus = objectType({
  name: 'InitPluginsStatus',
  definition (t) {
    t.nonNull.field('state', {
      type: PluginsState,
    }),
    t.string('message')
  },
})

export const Project = objectType({
  name: 'Project',
  definition (t) {
    t.nonNull.string('projectRoot')
    t.nonNull.boolean('isOpen')
    t.nonNull.boolean('isCurrent')
    t.field('plugins', {
      type: InitPluginsStatus,
    })
  },
})
