const res = require('./entry')

console.log(
  JSON.stringify({
    multiAssign: {
      first: res.multiAssign.first,
      second: res.multiAssign.second,
    },
    multiExport: {
      base: res.multiExport.base,
      Base: res.multiExport.Base,
    },
  })
)
