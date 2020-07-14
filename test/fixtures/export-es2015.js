const es2015Export = {
  es2015Key: 'es2015Value',
}

class SampleClass {
  static staticProp = 'staticProp'
  prop = 'prop'
}

const returnsPromise = () => {
  return new Promise((resolve) => {
    resolve('value')
  })
}

const asyncFn = async () => {
  const value = await returnsPromise()

  return value
}

export default {
  es2015Export,
  SampleClass,
  asyncFn,
}
