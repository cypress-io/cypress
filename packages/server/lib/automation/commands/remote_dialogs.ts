import type { RemoteDialog } from '@packages/types'
import type { Automation } from '../automation'

const DIALOG_TYPES = ['alert', 'confirm', 'prompt', 'beforeunload'] as const

export const isRemoteDialogType = (type: string): type is RemoteDialog['type'] => DIALOG_TYPES.some((dialogType) => dialogType === type)

// A dialog in the AUT blocks every page in its renderer process, which includes the runner when the
// AUT is on the runner's site, so the driver can't decide the answer. It's answered here as Cypress
// answers a patched window's dialogs, and the driver is told afterwards. A prompt gets no answer: null.
export const answerRemoteDialog = async (automation: Automation, type: RemoteDialog['type'], message: string, answer: (accept: boolean) => Promise<unknown>) => {
  const accepted = type !== 'prompt'

  await answer(accepted)
  await automation.push('remote:dialog', { type, message, accepted })
}
