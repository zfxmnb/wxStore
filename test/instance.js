global.Page = (options) => {
    const page = {}
    page.data = options.data || {}
    page.onLoad = options.onLoad
    page.onUnload = options.onUnload.bind(page)
    page.setData = (obj, cb) => {
        // console.log('setData')
        cb && cb()
    }
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
    component.attachedcall(page)
    return component
}