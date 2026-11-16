import type { Editor } from '@packages/types'

// The preferred editor can be set from the browser, so it must name an editor Cypress detected
export const isLaunchableEditor = (availableEditors: readonly Editor[], binary: string | null | undefined): binary is string => {
  return !!binary && availableEditors.some((editor) => editor.binary === binary)
}
