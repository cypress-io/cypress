export const addExternalLinkClickListener = (mutation) => {
  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const anchor = target.closest('a[href]') as HTMLAnchorElement

    if (anchor) {
      const destination = anchor.href

      if (destination.startsWith('/') || destination.startsWith('#') || destination.startsWith('http://localhost')) {
        return
      }

      event.preventDefault()
      mutation.executeMutation({ url: anchor.href })
    }
  })
}
