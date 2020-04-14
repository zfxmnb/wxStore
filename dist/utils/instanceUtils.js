Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCurrentPage = getCurrentPage;

/**
 * 组件中获取当前页面 2.7.1支持getPageId方法更准确获取当前页面、低于该版本可能有组件获取当前页面不准确现象
 */
function getCurrentPage(that) {
  if (that.getPageId) {
    var pageId = that.getPageId();
    var pages = getCurrentPages();

    for (var i = 0; i < pages.length; i++) {
      if (pages[i].getPageId() === pageId) {
        return pages[i];
      }
    }
  } else {
    var _pages = getCurrentPages();

    return _pages[_pages.length - 1];
  }
}