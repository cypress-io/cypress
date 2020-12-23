import savedState from '../saved_state'

export const setStudioModalShown = () => {
  return savedState.create()
  .then((state) => {
    state.set('showedStudioModal', true)
  })
}

export const getStudioModalShown = () => {
  return savedState.create()
  .then((state) => state.get())
  .then((state) => !!state.showedStudioModal)
}
