export default {
  name: 'custom',
  bind (el, binding) {
    el.dataset['custom'] = binding.value
  },
  unbind (el) {
    el.removeAttribute('data-custom')
  },
}
