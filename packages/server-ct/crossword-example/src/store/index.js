import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist'

const vuexPersist = new VuexPersistence({ storage: window.localStorage })

import { formatDate, addTime, oneDay } from '../utils/date'
import { hash, createCrossword } from '../utils'
import { range } from 'lodash'

window.range = range

Vue.use(Vuex)

const cleanDate = (date) => date.replace(/-+/g, '/')
const crosswordUrl = (date) => `https://raw.githubusercontent.com/doshea/nyt_crosswords/master/${cleanDate(date)}.json`

const makeState = () => {
  const startDate = formatDate(new Date('2/14/2012'))

  return {
    date: startDate,
    crossword: null,
    solved: false,
    completed: false,
    board: null,
    boardDate: null,
  }
}

export default new Vuex.Store({
  plugins: [vuexPersist.plugin],
  state: makeState,
  getters: {
    yesterday: (state) => {
      return formatDate(addTime(state.date, oneDay * -1))
    },
    tomorrow: (state) => {
      return formatDate(addTime(state.date, oneDay))
    },
    boardAsString: (state) => {
      return state.board.map((row) => row.join('.')).join('.')
    },
  },
  mutations: {
    setCrossword (state, crossword) {
      if (state.boardDate !== crossword.date) state.board = []

      state.boardDate = crossword.date
      state.crossword = crossword
    },
    setDate (state, date) {
      state.date = date
    },
    toggleAnswersVisible (state) {
      state.solved = !state.solved
    },
    setBoardState (state, newBoardState) {
      state.board = newBoardState
    },
    reset (state) {
      const newState = []

      for (let i = 0; i < state.board.length; i++) {
        const row = []

        for (let j = 0; j < state.board.length; j++) {
          row.push('')
        }
        newState.push(row)
      }
      state.board = newState
      state.crossword.id = hash(`${state.crossword.id}`, `${Date.now()}`)
    },
  },
  actions: {
    reset ({ commit }) {
      if (window.confirm('This will reset your progress. You sure?')) {
        commit('reset')
      }
    },
    setBoardState ({ commit }, boardState) {
      commit('setBoardState', boardState)
    },
    toggleAnswersVisible ({ commit }) {
      commit('toggleAnswersVisible')
    },
    getPreviousCrossword ({ getters, dispatch }) {
      return dispatch('fetchCrossword', getters.yesterday)
    },
    getNextCrossword ({ getters, dispatch }) {
      return dispatch('fetchCrossword', getters.tomorrow)
    },
    fetchCrossword ({ state, getters, commit }, date) {
      if (!date) date = state.date

      if (typeof date !== 'string') date = formatDate(date)

      return fetch(crosswordUrl(date))
      .then((response) => {
        if (response.status > 300) {
          return Promise.reject(response)
        }

        return response
      })
      .then((response) => response.json())
      .then((payload) => {
        commit('setCrossword', createCrossword(payload))
        commit('setDate', date)

        return payload
      })
    },
  },
})
