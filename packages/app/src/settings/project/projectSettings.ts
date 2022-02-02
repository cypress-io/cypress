export const sections = {
  project: [
    {
      title: 'Experiments',
      description: 'Enable or disable experiments',
    },
  ],
  user: {},
}

export interface Experiment {
  name: string
  description: string
  enabled: boolean
  key: string
}

export type CypressResolvedConfig = Array<{
  field: string
  from: 'default'| 'config' | 'plugin' | 'env'
  value: string | number | boolean | Record<string, string> | Array<string>
}>
