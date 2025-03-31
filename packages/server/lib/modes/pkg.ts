import Promise from 'bluebird'
import pkg from '@packages/root'

export = () => {
  return Promise.resolve(pkg)
}
