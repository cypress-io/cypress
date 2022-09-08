const cache = require('./cache')
import type { Cohort } from '@packages/types'
const debug = require('debug')('cypress:server:cohorts')

export = {
  get: (id: string) => {
    debug('Get cohort id:', id)

    return cache.getCohorts().then((cohorts) => {
      debug('Get cohort returning:', cohorts[id])

      return cohorts[id]
    })
  },
  set: (cohort: Cohort) => {
    debug('Set cohort', cohort)

    return cache.insertCohort(cohort)
  },
}
