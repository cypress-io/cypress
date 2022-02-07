import { AllCypressErrors } from '@packages/errors'
import { enumType } from 'nexus'

export const ErrorTypeEnum = enumType({
  name: 'ErrorTypeEnum',
  members: Object.keys(AllCypressErrors),
})
