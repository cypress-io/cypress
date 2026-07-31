// Run via `electron` with ELECTRON_RUN_AS_NODE=1 (plain Node, no Chromium).
// Write with a flush callback so piped stdout isn't truncated before exit.
process.stdout.write(`${process.version.replace('v', '')}\n`, () => {
  process.exit(0)
})
