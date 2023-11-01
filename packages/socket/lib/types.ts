import type { BurnInAction } from '@packages/types'
import type Emitter from 'component-emitter'

export type SocketShape = Emitter & { getBurnInActions(): BurnInAction[] }
