// tab 页面
let tabPages = []
/**
 * 获取tab页面
 */
export function pushTabPage (that) {
  const pages = getCurrentPages()
  if (pages.length === 1) {
    tabPages.push(that)
  }
  return tabPages
}

/**
 * 页面卸载时移除对于tab页面
 */
export function shiftTabPage (that) {
  tabPages = tabPages.filter((page) => {
    return page !== that
  })
  return tabPages
}

/**
 * 组件中获取当前页面 2.7.1支持getPageId方法更准确获取当前页面、低于该版本可能有组件获取当前页面不准确现象
 */
export function getCurrentPage (that) {
  if (that.getPageId) {
    const pageId = that.getPageId()
    const pages = [].concat(tabPages, getCurrentPages())
    let i = pages.length - 1
    while (i >= 0) {
      if (pages[i].getPageId && (pages[i].getPageId() === pageId)) {
        return pages[i]
      }
      i--
    }
    return {}
  } else {
    const pages = getCurrentPages()
    return pages[pages.length - 1]
  }
}
