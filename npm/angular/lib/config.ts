import { StyleOptions } from '@cypress/mount-utils'

interface Config {
  detectChanges?: boolean

  log?: boolean
}

export type CypressAngularConfig = Partial<StyleOptions> & Partial<Config>;
