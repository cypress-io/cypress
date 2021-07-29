import { TestingTypeEnum } from '../generated/graphql'
import componentLogo from '../images/testingTypes/component.svg'
import e2eLogo from '../images/testingTypes/e2e.svg'

export const TestingTypeIcons: Record<TestingTypeEnum, string> = {
  e2e: e2eLogo,
  component: componentLogo,
}
