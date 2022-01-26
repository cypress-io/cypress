import { enumType } from 'nexus'
import { AllCypressErrors } from '@packages/errors'

export const ErrorTypeEnum = enumType({
  name: 'ErrorTypeEnum',
  members: Object.keys(AllCypressErrors),
})
