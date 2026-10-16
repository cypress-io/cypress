// Marks a document request as originating from the AUT frame so downstream
// consumers (e.g. proxy request-middleware) can identify it for injection.
// Every automation layer (CDP, BiDi, WebKit) injects this header; the proxy
// strips it before the request goes upstream.
export const AUT_FRAME_HEADER = 'X-Cypress-Is-AUT-Frame'

// Marks a request as originating from an extra tab/window (not the main
// Cypress tab) so ExtractCypressMetadataHeaders can run only the minimal
// middleware (MaybeSetBasicAuthHeaders). Stripped before continueRequest.
export const EXTRA_TARGET_HEADER = 'X-Cypress-Is-From-Extra-Target'
