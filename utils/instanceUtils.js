/**
 * 组件中获取当前页面 2.7.1支持
 */
export function getCurrentPage(that) {
	const pageId = that.getPageId()
	const pages = getCurrentPages()
	for (let i = 0; i < pages.length; i++) {
		if (pages[i].getPageId() === pageId) {
			return pages[i]
		}
	}
}