import { publishStagingToFinal } from '../../lib/cloud/bundles/publish_staging_to_final'

const [staging, finalDir] = process.argv.slice(2)

if (!staging || !finalDir) {
  // eslint-disable-next-line no-console
  console.error('usage: cross_process_publish_worker.ts <staging> <finalDir>')
  process.exit(2)
}

publishStagingToFinal(staging, finalDir).then(
  () => process.exit(0),
  (err) => {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  },
)
