export const NON_RETRIABLE_CERT_ERROR_CODES = Object.freeze({
  // The leaf certificate signature can’t be verified
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  // The certificate is a self-signed certificate and not in trusted root store
  DEPTH_ZERO_SELF_SIGNED_CERT: 'DEPTH_ZERO_SELF_SIGNED_CERT',
  // A self-signed certificate exists somewhere in the chain
  SELF_SIGNED_CERT_IN_CHAIN: 'SELF_SIGNED_CERT_IN_CHAIN',
  // The issuer certificate is not available locally
  UNABLE_TO_GET_ISSUER_CERT_LOCALLY: 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
})

type NonRetriableCertErrorCode = typeof NON_RETRIABLE_CERT_ERROR_CODES[keyof typeof NON_RETRIABLE_CERT_ERROR_CODES]

export const isNonRetriableCertErrorCode = (errorCode: string | number): errorCode is NonRetriableCertErrorCode => {
  return Object.values(NON_RETRIABLE_CERT_ERROR_CODES).includes(errorCode as NonRetriableCertErrorCode)
}
