// import * as path from 'path'

export default function loader (source) {
  const config = this._cypress



  return `
  
  require(${JSON.stringify(require.resolve('./aut-runner'))})  

  export default {}`
}
