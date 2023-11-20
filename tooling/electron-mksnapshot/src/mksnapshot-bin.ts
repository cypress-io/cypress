import { runMksnapshot } from './mksnapshot-run'

const args = process.argv.slice(2)

try {
  runMksnapshot(args)
  process.exit(0)
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
}
