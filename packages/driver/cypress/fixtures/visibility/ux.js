document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.test-section').values().map((el) => {
    return {
      label: el.querySelector('h3')?.textContent ?? el.getAttribute('cy-section'),
      section: el.getAttribute('cy-section'),
    }
  })
  const nav = document.createElement('nav')

  const list = document.createElement('ul')

  nav.appendChild(list)
  sections.forEach(({ label, section }) => {
    const li = document.createElement('li')
    const a = document.createElement('a')

    a.href = `#${section}`
    a.textContent = label
    li.appendChild(a)
    list.appendChild(li)
  })

  document.body.appendChild(nav)
})

document.addEventListener('click', (ev) => {
  const [, section] = ev.target?.href?.split('#') ?? []

  if (!section) return

  document.querySelectorAll('.test-section.active').forEach((el) => {
    el.classList.remove('active')
  })

  document.querySelector(`[cy-section="${section}"]`)?.classList.add('active')
  document.querySelector(`[cy-section="${section}"]`)?.scrollIntoView()
})
