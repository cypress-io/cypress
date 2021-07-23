import { objectType, enumType } from 'nexus'

const InitState = enumType({
  name: 'InitState',
  members: ['uninitialized', 'initializing', 'initialized', 'error'],
})

const InitStatus = objectType({
  name: 'InitStatus',
  definition (t) {
    t.nonNull.field('state', {
      type: InitState,
    }),
    t.string('message')
  },
})

export const Config = objectType({
  name: 'Config',
  definition (t) {
    t.string('baseUrl')
    t.string('clientRoute')
    t.string('namespace')
    t.string('xhrRoute')
    t.string('reporterRoute')
    t.string('proxyUrl')
    t.string('proxyServer')
    t.int('port')
  },
})

export const Project = objectType({
  name: 'Project',
  definition (t) {
    t.nonNull.string('projectRoot')
    t.nonNull.boolean('isOpen')
    t.nonNull.boolean('isCurrent')
    t.field('plugins', {
      type: InitStatus,
    })

    t.field('server', {
      type: InitStatus,
    })
  },
})
