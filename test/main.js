require('./instance')
import assert from 'assert'
import {
	storePage
} from '../wxStore'
// store配置
const store = {
	debug: true,
	state: {
		x: [1, 2, 3],
		y: {
			a: {
				b: [2]
			},
			c: 3
		}
	},
	actions: {
		change_x(cb) {
			this.state.x.push(5)
			this.update({
				x: [1, 2, 3, 4]
			}, cb)
		},
		add_y(cb) {
			this.state.y.a.b.push(this.state.y.c)
			this.state.y.c++
			this.update({}, cb)
		}
	}
}

describe('store', function () {
	// 设置单个state
	it('单个state改变', function () {
		storePage({
			store,
			stateMap: {
				X: 'x',
				Y: 'y'
			},
			onLoad() {
				this.store.actions.change_x((diff) => {
					// 最终diff对象比对
					assert.notDeepEqual(diff, {
						'x[3]': 4
					})
				})
				this.onUnload()
			}
		})

	})
	// 设置两个state
	it('多个state改变', function () {
		storePage({
			store,
			stateMap: {
				X: 'x',
				Y: 'y'
			},
			onLoad() {
				this.store.actions.add_y()
				this.store.actions.change_x((diff) => {
					// 最终diff对象比对
					assert.notDeepEqual(diff, {
						'x[3]': 4,
						'y.a.b[1]': 3,
						'y.a.c': 4
					})
				})
				this.onUnload()
			}
		})
	})
	// 连续设置state
	it('连续改变state', function () {
		storePage({
			store,
			stateMap: {
				X: 'x',
				Y: 'y'
			},
			onLoad() {
				this.store.actions.add_y()
				let c = store.state.y.c
				// 连续设置
				for (var i = store.state.y.a.b.length; i < 1e2; i++) {
					this.store.actions.add_y()
				}
				// 最后一次设置
				this.store.actions.add_y((diff) => {
					// 最终diff对象比对
					assert.notDeepEqual(diff, {
						[`y.a.b[${ i }]`]: c,
						'y.a.c': c + i
					})
				})
				this.onUnload()
			}
		})
	})
})