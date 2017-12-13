const { curry, set, view } = require('ramda');

/**
 * Async version of Ramda's `over` lens utility.
 */
const overA = curry(async (lens, f, x) => {
  const value = await f(view(lens, x));
  return set(lens, value, x);
});

/**
 * Specialization of `overA`, using another lens as the source of the
 * data for the `over` transformation.
 */
const overFromA = curry(async (lens1, lens2, f, x) => {
  const value = await f(view(lens2, x));
  return set(lens1, value, x);
});

module.exports = {
  overA,
  overFromA,
};
