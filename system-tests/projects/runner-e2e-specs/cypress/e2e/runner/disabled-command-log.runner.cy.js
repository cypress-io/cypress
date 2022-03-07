it('disabled command log with NO_COMMAND_LOG', {
  env: { NO_COMMAND_LOG: '1' },
}, () => {
  assert(true)
})
