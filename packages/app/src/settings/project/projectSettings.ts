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
