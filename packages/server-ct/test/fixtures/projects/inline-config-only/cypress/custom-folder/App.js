export function createApp(root) {
  const el = document.createElement('div')
  el.textContent = 'This is the app'
  root.appendChild(el)
}
