import $ from 'jquery'

type DocumentAnimationState = {
  disablerCount: number
  pausedAnimations: Animation[]
}

const animationDisablerId = '__cypress-animation-disabler'
const animationDisablerSelector = `#${animationDisablerId}`
const animationStateByDocument = new WeakMap<Document, DocumentAnimationState>()

const addDisablerStyle = ($body: JQuery<HTMLBodyElement>) => {
  $(`
    <style id="${animationDisablerId}">
      *, *:before, *:after {
        transition-property: none !important;
        animation: none !important;
      }
    </style>
  `).appendTo($body)
}

const pauseDocumentAnimations = (doc: Document) => {
  const existingState = animationStateByDocument.get(doc)

  if (existingState) {
    existingState.disablerCount += 1

    return
  }

  const pausedAnimations = doc.getAnimations?.().filter(({ playState }) => {
    return playState === 'running'
  }) ?? []

  for (const animation of pausedAnimations) {
    animation.pause()
  }

  animationStateByDocument.set(doc, {
    disablerCount: 1,
    pausedAnimations,
  })
}

const resumeDocumentAnimations = (doc: Document) => {
  const animationState = animationStateByDocument.get(doc)

  if (!animationState) return

  animationState.disablerCount -= 1

  if (animationState.disablerCount > 0) return

  for (const animation of animationState.pausedAnimations) {
    if (animation.playState === 'paused') animation.play()
  }

  animationStateByDocument.delete(doc)
}

const addCssAnimationDisabler = ($body: JQuery<HTMLBodyElement>) => {
  const doc = $body[0]?.ownerDocument

  if (!doc) {
    addDisablerStyle($body)

    return
  }

  if (!animationStateByDocument.has(doc)) {
    addDisablerStyle($body)
  }

  pauseDocumentAnimations(doc)
}

const removeCssAnimationDisabler = ($body: JQuery<HTMLBodyElement>) => {
  const doc = $body[0]?.ownerDocument

  if (!doc) {
    $body.find(animationDisablerSelector).remove()

    return
  }

  resumeDocumentAnimations(doc)

  if (!animationStateByDocument.has(doc)) {
    $body.find(animationDisablerSelector).remove()
  }
}

export default {
  addCssAnimationDisabler,
  removeCssAnimationDisabler,
}
