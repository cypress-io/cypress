import { mount } from '@cypress/react'
import { mount as bundledMount } from 'cypress/react'

import { StyleOptions } from '@cypress/mount-utils'
import { StyleOptions as BundledStyleOptions } from 'cypress/mount-utils'

type StyleOptionsA = StyleOptions // $ExpectType StyleOptions
type StyleOptionsB = BundledStyleOptions // $ExpectType StyleOptions

type MountA = typeof mount // $ExpectType (jsx: ReactNode, options?: Partial<StyleOptions & MountReactComponentOptions> | undefined) => Chainable<MountReturn>
type MountB = typeof bundledMount // $ExpectType (jsx: ReactNode, options?: Partial<StyleOptions & MountReactComponentOptions> | undefined) => Chainable<MountReturn>
