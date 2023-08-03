it('should work', async () => {
  const { default: lazyModule } = await import('./lazy.js')

  expect(lazyModule.hello).eq('world')
})
