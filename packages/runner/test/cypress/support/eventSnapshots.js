/**
 * @param {T=} obj
 * @return {{[key in keyof T]: {mocha:string, setRunnables:string}}}
 * @template T,K
 */
function Enum (obj) {
  const keysByValue = {}
  // const EnumLookup = (value) => keysByValue.get(value)

  for (const key of Object.keys(obj)) {
    keysByValue[key] = {
      mocha: `${key}.mocha`,
      setRunnables: `${key}.setRunnables`,
    }
  }

  // Return a function with all your enum properties attached.
  // Calling the function with the value will return the key.
  return Object.freeze(keysByValue)
}

const snapshots = Enum({
  FAIL_IN_AFTEREACH: true,
  FAIL_IN_AFTER: true,
  FAIL_IN_BEFOREEACH: true,
  FAIL_IN_BEFORE: true,
  FAIL_IN_TEST: true,
  PASS_IN_AFTEREACH: true,
  PASS_IN_AFTER: true,
  PASS_IN_BEFOREEACH: true,
  PASS_IN_BEFORE: true,
  PASS_IN_TEST: true,
  RETRY_PASS_IN_AFTEREACH: true,
  // RETRY_PASS_IN_AFTER: true,
  RETRY_PASS_IN_BEFOREEACH: true,
  // RETRY_PASS_IN_BEFORE: true,
  RETRY_PASS_IN_TEST: true,
  RETRY_FAIL_IN_AFTEREACH: true,
  // RETRY_FAIL_IN_AFTER: true,
  // RETRY_FAIL_IN_BEFOREEACH: true,
  // RETRY_FAIL_IN_BEFORE: true,
  // RETRY_FAIL_IN_TEST: true,
  PASS_WITH_ONLY: true,
  FAIL_WITH_ONLY: true,
  RETRY_PASS_WITH_ONLY: true,
  SIMPLE_SINGLE_TEST: true,
  THREE_TESTS_WITH_RETRY: true,
  THREE_TESTS_WITH_HOOKS: true,

})

module.exports = {
  EventSnapshots: snapshots,
}
