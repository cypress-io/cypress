export const sections = {
  project: [
    {
      title: 'Experiments',
      description: 'Enable or disable experiments',
    },
  ],
  user: {}
}

export interface Experiment {
  name: string
  description: string
  enabled: boolean
  key: string
}

export const experiments: Experiment[] = [
  {
    name: 'Studio Mode',
    description: 'Enable Studio Mode',
    enabled: true,
    key: 'experimentalStudio'
  },
  {
    name: 'Fetch Polyfill',
    description: 'Enable Fetch Polyfill',
    enabled: true,
    key: 'experimentalFetchPolyfill'
  },
  {
    name: 'Interactive Run Events',
    description: 'Enable Interactive Run Events',
    enabled: false,
    key: 'experimentalInteractiveRunEvents'
  }
]
