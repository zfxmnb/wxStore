import { storePage } from '../wxStore'
import store from './gameStore'
storePage({
  store,
  stateMap: {
    score: 'count'
  },
  data: {},
  onLoad () {},
})
