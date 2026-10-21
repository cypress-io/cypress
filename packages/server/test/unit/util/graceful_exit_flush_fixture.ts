import { GracefulExit } from '../../../lib/util/graceful-exit'

const bytes = Number(process.argv[2])
const line = `${'x'.repeat(99)}\n`

for (let written = 0; written < bytes; written += line.length) {
  process.stdout.write(line)
}

void GracefulExit.exitGracefully(0)
