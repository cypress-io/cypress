/**
 * Cypress config flags for document rewrite / framebusting (`modifyObstructiveCode`).
 *
 * Enforced on the **proxy streaming response pipeline** via `ForDocumentPreparation`
 * (`SetInjectionLevel`, `MaybeInjectHtml`, `MaybeRemoveSecurity`) — not on `HttpIntercept`.
 */
export type DocumentRewriteConfig = {
  modifyObstructiveCode?: boolean
  experimentalModifyObstructiveThirdPartyCode?: boolean
}
