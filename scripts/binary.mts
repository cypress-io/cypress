import '../packages/ts/register.js'

const command = process.argv[2]

if (!command) {
  console.error('Missing deploy command ⛔️')
  process.exit(1)
}

const { default: commands } = await import('./binary/index.js')
const fn = commands[command]

if (!fn) {
  console.error('Invalid deploy command %s 🚫', command)
  process.exit(1)
}

// TODO allow passing CLI arguments to each command

try {
  await fn()
  console.log('✅ %s completed', command)
} catch (err) {
  console.error('🔥 deploy error')
  console.error(err)
  process.exit(1)
}
