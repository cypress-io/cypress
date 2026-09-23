import type { expect as _expect } from 'chai'
import type _sinon from 'sinon'

declare global {
  // these are made global in `spec_helper`
  const expect: typeof _expect
  const sinon: typeof _sinon
}
