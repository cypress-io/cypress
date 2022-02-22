import type $Log from '../../cypress/log'
import $utils from '../../cypress/utils'
import $errUtils from '../../cypress/error_utils'
import isValidDomain from 'is-valid-domain'

export class Validator {
  log: typeof $Log
  onFailure: () => {}

  constructor ({ log, onFailure }) {
    this.log = log
    this.onFailure = onFailure
  }

  validate ({ callbackFn, data, domain, done, doneReference }) {
    if (typeof domain !== 'string' || !(isValidDomain(domain, { allowUnicode: true, subdomain: false }))) {
      this.onFailure()

      $errUtils.throwErrByPath('switchToDomain.invalid_domain_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(domain) },
      })
    }

    if (data && !Array.isArray(data)) {
      this.onFailure()

      $errUtils.throwErrByPath('switchToDomain.invalid_data_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(data) },
      })
    }

    if (typeof callbackFn !== 'function') {
      this.onFailure()

      $errUtils.throwErrByPath('switchToDomain.invalid_fn_argument', {
        onFail: this.log,
        args: { arg: $utils.stringify(callbackFn) },
      })
    }

    // verifies the done argument is actually the done fn
    if (done && done !== doneReference) {
      this.onFailure()

      $errUtils.throwErrByPath('switchToDomain.done_reference_mismatch', {
        onFail: this.log,
      })
    }
  }
}
