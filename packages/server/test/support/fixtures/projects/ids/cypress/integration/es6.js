const numbers = [1, 2, 3]
const sameNumbers = [...numbers]

async function resolvePromise () {
  await Promise.resolve('foo')
}
