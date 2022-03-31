import * as mountUtils from '@cypress/mount-utils'
import * as bundledMountUtils from 'cypress/mount-utils'

import * as reactMount from '@cypress/react'
import * as bundledReactMount from 'cypress/react'

mountUtils // $ExpectType
bundledMountUtils // $ExpectType
reactMount // $ExpectType
bundledReactMount // $ExpectType
