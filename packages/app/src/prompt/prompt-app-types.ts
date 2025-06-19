// Note: This file is owned by the cloud delivered
// cy prompt bundle. It is downloaded and copied here.
// It should not be modified directly here.

export interface CypressInternal extends Cypress.Cypress {
  backendRequestHandler: (
    backendRequestNamespace: string,
    eventName: string,
    ...args: any[]
  ) => Promise<any>
}

export interface GetCodeModalContentsProps {
  Cypress: CypressInternal
  testId: string
  logId: string
  onClose: () => void
}

export type GetCodeModalContentsShape = (
  props: GetCodeModalContentsProps
) => JSX.Element

export interface CyPromptAppDefaultShape {
  // Purposefully do not use React in this signature to avoid conflicts when this type gets
  // transferred to the Cypress app
  GetCodeModalContents: GetCodeModalContentsShape
}
