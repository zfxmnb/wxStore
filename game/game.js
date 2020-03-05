import { storePage } from '../wxStore'
import globel from '../store.js'
import store from './gameStore'
storePage({
  store,
  stateMap: {
    score: 'count'
  },
  stores: [{
    store: globel,
    stateMap: {
      maxScore: 'scores.maxScore'
    }
  }],
  data: {},
  onLoad () {},
})
