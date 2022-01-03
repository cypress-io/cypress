import { objectType } from 'nexus'
import { FileParts } from './gql-FileParts'
import { WizardConfigFileStatusEnum } from '../enumTypes'

export const ScaffoldedFile = objectType({
  name: 'ScaffoldedFile',
  description: 'A file that we just added to the filesystem during project setup',
  definition (t) {
    t.nonNull.field('status', {
      description: 'Info about the field',
      type: WizardConfigFileStatusEnum,
    })

    t.nonNull.string('description', {
      description: 'Info about the file we just scaffolded',
    })

    t.nonNull.field('file', {
      type: FileParts,
      description: 'Info about the file',
    })
  },
})
