export const Mod = {
  async fetcher () {
    import('./mod_2').then((mod) => {
      document.querySelector(`[data-cy-root]`)!.innerHTML = `<h1>${mod.greeting}</h1>`
    })
  },

  run () {
    window.setTimeout(() => {
      this.fetcher()
    }, 2000)
  },
}
