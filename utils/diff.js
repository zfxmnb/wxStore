import {
	type,
	OBJECT,
	ARRAY
} from './utils'
/**
 * diff
 * @param {*} current 当前数据
 * @param {*} pre 原数据
 * @param {*} prefix diff key 前缀
 * @param {*} performance 是否开始数组performance模式，开始后可对push类型数组diff优化，若非push改变的数组可能会出现数据错误
 */
export default function diff(current, pre, prefix = '', performance) {
	const diffObj = {}
	if (type(pre, ARRAY) && type(current, ARRAY)) {
		if (current.length < pre.length) {
			// 数据length比原数据小，全替换
			diffObj[prefix] = current
		} else {
			// 数据length比原数据大
			if (!performance) {
				// 非性能模式下数组每一项深层diff
				for (let i = 0; i < pre.length; i++) {
					Object.assign(diffObj, diff(current[i], pre[i], `${prefix ? `${prefix}[${i}]` : `[${i}]`}`, performance))
				}
			}
			if (current.length > pre.length) {
				// 性能模式下数组push
				for (let i = pre.length; i < current.length; i++) {
					diffObj[`${prefix}[${i}]`] = current[i]
				}
			}
		}
	} else if (type(pre, OBJECT) && type(current, OBJECT)) {
		// 对象
		const keys = Object.keys(pre)
		keys.forEach((key) => {
			Object.assign(diffObj, diff(current[key], pre[key], `${prefix ? `${prefix}.${key}` : key}`, performance))
		})
	} else if (prefix && current !== pre) {
		// 非数组非对象
		diffObj[prefix] = current
	}
	return diffObj
}