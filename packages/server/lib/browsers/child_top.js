const util = require('util')
const exec = util.promisify(require('child_process').exec)

const pid = parseInt(process.argv[2])
let stats = []

exec(`top -stats pid,mem,rprvt,purg,vsize,vprvt,kprvt,kshrd -pid ${pid} -s 1 -S -r -n 1 -l 1 | tail -n 1`, { encoding: 'utf-8' }).then(({ stdout, stderr }) => {
  stats = stdout.split(/\s+/).filter(Boolean)
})

setInterval(() => {
  exec(`top -stats pid,mem,rprvt,purg,vsize,vprvt,kprvt,kshrd -pid ${pid} -s 1 -S -r -n 1 -l 1 | tail -n 1`, { encoding: 'utf-8' }).then(({ stdout, stderr }) => {
    stats = stdout.split(/\s+/).filter(Boolean)
  })
}, 500)

process.on('message', (msg) => {
  if (msg === 'stats') {
    process.send(stats)
  }
})
