Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pushTabPage = pushTabPage;
exports.shiftTabPage = shiftTabPage;
exports.getCurrentPage = getCurrentPage;
// tab 页面
var tabPages = [];
/**
 * 获取tab页面
 */

function pushTabPage(that) {
  var pages = getCurrentPages();

  if (pages.length === 1) {
    tabPages.push(that);
  }

  return tabPages;
}
/**
 * 页面卸载时移除对于tab页面
 */


function shiftTabPage(that) {
  tabPages = tabPages.filter(function (page) {
    return page !== that;
  });
  return tabPages;
}
/**
 * 组件中获取当前页面 2.7.1支持getPageId方法更准确获取当前页面、低于该版本可能有组件获取当前页面不准确现象
 */


function getCurrentPage(that) {
  if (that.getPageId) {
    var pageId = that.getPageId();
    var pages = [].concat(tabPages, getCurrentPages());
    var i = pages.length - 1;

    while (i >= 0) {
      if (pages[i].getPageId && pages[i].getPageId() === pageId) {
        return pages[i];
      }

      i--;
    }

    return {};
  } else {
    var _pages = getCurrentPages();

    return _pages[_pages.length - 1];
  }
}