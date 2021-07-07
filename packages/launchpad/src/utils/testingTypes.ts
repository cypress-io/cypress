import componentLogo from '../images/testingTypes/component.svg'
import e2eLogo from '../images/testingTypes/e2e.svg'

export type TestingType = 'e2e' | 'component';

export const testingTypes: Array<{
    name: string
    icon: string
    description: string
    id: TestingType
  }> = [
    {
      name: 'Component Testing',
      icon: componentLogo,
      description:
        'Aenean lacinia bibendum nulla sed consectetur. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean lacinia bibendum nulla sed consectetur.',
      id: 'component',
    },
    {
      name: 'E2E Testing',
      icon: e2eLogo,
      description:
        'Aenean lacinia bibendum nulla sed consectetur. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean lacinia bibendum nulla sed consectetur.',
      id: 'e2e',
    },
  ]
