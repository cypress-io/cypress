/* global sinon */
const questionsRemain = require('../../../binary/util/questions-remain')
const la = require('lazy-ass')
const snapshot = require('snap-shot-it')

describe('questions-remain', () => {
  const dontAsk = () => {
    throw new Error('Should not ask!')
  }

  it('is a function', () => {
    if (typeof questionsRemain !== 'function') throw new Error('questionsRemain is not a function')
  })

  it('returns object if all questions have been answered', () => {
    const propertiesToQuestions = {
      foo: dontAsk,
      bar: dontAsk,
    }
    const options = {
      foo: 'foo is specified',
      bar: 'so is bar',
    }

    // console.log(questionsRemain(propertiesToQuestions)(options))
    return questionsRemain(propertiesToQuestions)(options).then(snapshot)
  })

  it('asks questions for missing options', () => {
    const barStub = sinon.stub().resolves('bar user answer')
    const propertiesToQuestions = {
      foo: dontAsk,
      bar: barStub,
    }
    const options = {
      foo: 'foo is specified',
      // notice bar is missing!
    }

    return questionsRemain(propertiesToQuestions)(options)
    .then(snapshot)
    .then(() => {
      la(barStub.called, 'bar stub has not been called')
    })
  })
})
