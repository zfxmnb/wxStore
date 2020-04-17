global.Page = (options) => {
  const page = {}
  page.data = options.data || {}
  page.onLoad = options.onLoad
  page.onUnload = options.onUnload.bind(page)
  page.setData = (obj, cb) => {
    // console.log('setData')
    cb && cb()
  }
  // eslint-disable-next-line no-useless-call
  page.onLoad.call(page)
  return page
}

global.Component = (options) => {
  const component = {}
  component.data = options.data || {}
  component.attached = options.attached
  component.detached = options.detached.bind(component)
  component.setData = (obj, cb) => {
    // console.log('setData')
    cb && cb()
  }
  // eslint-disable-next-line no-useless-call
  component.attached.call(component)
  return component
}
