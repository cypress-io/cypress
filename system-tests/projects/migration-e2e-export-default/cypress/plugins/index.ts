export default async function (on, config) {
  // eslint-disable-next-line
  const foo: number = 123 // to make sure the parser handles TS

  const asyncViewport = () => Promise.resolve(1111)

  // make sure we consider that config can be mutated
  // asynchronously in plugins
  config.viewportWidth = await asyncViewport()

  return config
}
