Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCurrentPage = getCurrentPage;

/**
 * 组件中获取当前页面 2.7.1支持
 */
function getCurrentPage(that) {
  var pageId = that.getPageId();
  var pages = getCurrentPages();

  for (var i = 0; i < pages.length; i++) {
    if (pages[i].getPageId() === pageId) {
      return pages[i];
    }
  }
}