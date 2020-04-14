/**
 * 组件中获取当前页面 2.7.1支持getPageId方法更准确获取当前页面、低于该版本可能有组件获取当前页面不准确现象
 */
export function getCurrentPage(that) {
	if (that.getPageId) {
		const pageId = that.getPageId()
		const pages = getCurrentPages()
		for (let i = 0; i < pages.length; i++) {
			if (pages[i].getPageId() === pageId) {
				return pages[i]
			}
		}
	} else {
		const pages = getCurrentPages()
		return pages[pages.length - 1]
	}
}