var isModern =
  typeof Buffer.alloc === 'function' &&
  typeof Buffer.allocUnsafe === 'function' &&
  typeof Buffer.from === 'function'

module.exports = isModern
