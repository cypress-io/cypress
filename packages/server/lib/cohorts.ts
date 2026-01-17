import { cache } from './cache'
import type { Cohort } from '@packages/types'
import debugModule from 'debug'
const debug = debugModule('cypress:server:cohorts')

export const get = async (): Promise<Record<string, Cohort>> => {
  debug('Get cohorts')

  return cache.getCohorts()
}

export const getByName = async (name: string): Promise<Cohort> => {
  debug('Get cohort name:', name)

  return cache.getCohorts().then((cohorts) => {
    debug('Get cohort returning:', cohorts[name])

    return cohorts[name]
  })
}

export const set = async (cohort: Cohort): Promise<void> => {
  debug('Set cohort', cohort)

  return cache.insertCohort(cohort)
}
