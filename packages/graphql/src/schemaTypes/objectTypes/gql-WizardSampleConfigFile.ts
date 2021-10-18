import { objectType } from 'nexus'
import { WizardConfigFileStatusEnum } from '../enumTypes'

export const WizardSampleConfigFile = objectType({
  name: 'WizardSampleConfigFile',
  description: 'Each config file suggestion given by the wizard',
  node: 'filePath',
  definition (t) {
    t.nonNull.string('filePath')
    t.nonNull.field('status', {
      type: WizardConfigFileStatusEnum,
    })

    t.nonNull.string('content')

    t.string('description')
  },
})
