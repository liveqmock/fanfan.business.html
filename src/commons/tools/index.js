import { Indicator, Toast, MessageBox } from 'mint-ui'

let Tools = {
  app: ((window.android) || {
    ajaxPost: function (method, url, paramsMap, callKey) { window.setTimeout(() => {window.callback("{'code':-1,'success':false}", callKey) }, 500) },
    ajaxGet: function (method, url, paramsMap, callKey) { window.setTimeout(() => {window.callback("{'code':-1,'success':false}", callKey) }, 500) }
  }),
  callMap: {},
  global: {defaultView: null, defaultCall: function () {}, httpPath: ''},
  callKeyIndex: 1,
  method: {post: 'post', get: 'get', json: 'json'},
  globalKey: {userInfo: 'sp_user_info', blueToothConnect: 'sp_blue_tooth_connect', autoPrint: 'sp_auto_print', blueNotifyKey: 'local_notify_blue_booth_event', shopName: 'sp_shop_name', httpPath: 'sp_http_path'},
  // 调用Ajax
  ajax: function (method, url, params, callback) {
    // 加载条
    Indicator.open({spinnerType: 'fading-circle'})
    // 构建参数
    let paramsMap = {}
    if (method === 'json') {
      paramsMap['content-type'] = 'json'
      paramsMap['content'] = JSON.stringify(params)
    } else {
      paramsMap = params === null ? {} : params
    }
    // 回调放入临时callMap
    let callKey = Tools.getCallBackKey(callback)
    // 调用后台方法
    if (method === 'get') {
      Tools.app.ajaxGet(url, JSON.stringify(paramsMap), callKey)
    } else {
      Tools.app.ajaxPost(url, JSON.stringify(paramsMap), callKey)
    }
  },
  // 获取参数
  getKeyVal: function (key, callback) {
    Tools.app.getKeyVal(key, Tools.getCallBackKey(callback))
    // Toast("dddd")
  },
  // 设置参数
  setKeyVal: function (key, val, callback) {
    Tools.app.setKeyVal(key, val, Tools.getCallBackKey(callback))
  },
  // 绑定用户至信鸽推送
  bindUser: function (userId, callback) {
    Tools.app.bindUser(userId, Tools.getCallBackKey(callback))
  },
  // 退出登录
  loginOut: function (userId, callback) {
    Tools.app.bindUser(userId, Tools.getCallBackKey(callback))
  },
  // 蓝牙操作
  blueTooth: function (start, callback) {
    Tools.app.blueTooth(start, Tools.getCallBackKey(callback))
  },
  // 链接蓝牙
  blueConnect: function (address, callback) {
    Tools.app.blueToothConnect(address, Tools.getCallBackKey(callback))
  },
  // 打印
  print: function (orderString, callback) {
    Tools.app.print(orderString, Tools.getCallBackKey(callback))
  },
  // 选择图片
  choiceImg: function (type, callback) {
    Tools.app.choiceImg(type, Tools.getCallBackKey(callback))
  },
  // 扫码
  scanQRCode: function (callback) {
    Tools.app.scanQRCode(Tools.getCallBackKey(callback))
  },
  // 退出系统
  exitApp: function () {
    Tools.app.exitApp()
  },
  // 1检查新版本, 2执行安装
  checkOrInstallAPK: function (type, callback) {
    Tools.app.checkOrInstallAPK(type, Tools.getCallBackKey(callback))
  },
  // 检查更新版本
  checkNewAPK: function () {
    Tools.checkOrInstallAPK(1, function (res) {
      if (res === 'true') {
        MessageBox({
          title: '新版提示',
          message: '有新版本更新',
          showCancelButton: true,
          showConfirmButton: true,
          cancelButtonText: '取消',
          confirmButtonText: '立即更新',
          closeOnClickModal: false
        }).then(action => {
          if (action === 'confirm') {
            Tools.checkOrInstallAPK(2, function (res) {
              Indicator.open({
                text: '正在安装...',
                spinnerType: 'fading-circle'
              })
            })
          } else {
            Tools.exitApp()
          }
        })
      }
    })
  },
  // 检查是否登录
  checkLogin: function () {
    // 是否登录窗口
    Tools.getKeyVal(Tools.globalKey.userInfo, function (data) {
      if (data === '') {
        window.vueApp.$router.push({name: 'login'})
      } else {
        // 绑定信鸽推送
        Tools.bindUser(data.userId, function (bind) {})
      }
    })
  },
  // 获取回调方法key
  getCallBackKey: function (callback) {
    // 回调放入临时callMap
    let callKey = 'call_back_' + (Tools.callKeyIndex++)
    if (callback === undefined) {
      Tools.callMap[callKey] = Tools.global.defaultCall
    } else {
      Tools.callMap[callKey] = callback
    }
    return callKey
  },
  // 本地通知注册
  localNotify: function (callKey, callback) {
    Tools.callMap[callKey] = callback
  },
  // App回调
  callback: function (jsonString, callKey) {
    // 本地JS通知消息
    if (callKey.indexOf('local_notify') === 0) {
      Tools.callMap[callKey](jsonString)
      return
    }

    if (callKey === 'loading') {
      // 加载条
      Indicator.open({spinnerType: 'double-bounce'})
      return
    }
    if (callKey.indexOf('notify_msg.') === 0) {
      // 将notify_msg.option替换成option
      Option.msgOption(callKey.replace('notify_msg.', ''), jsonString)
      return
    }
    // 关闭加载条
    Indicator.close()
    if (jsonString.code !== undefined) {
      if (jsonString.success && jsonString.code === 0) {
        // 执行回调
        Tools.callMap[callKey](jsonString)
      } else {
        // 错误提示
        Toast(jsonString.msg)
      }
    } else {
      Tools.callMap[callKey](jsonString)
    }
  }
}

let Option = {
  // 消息处理
  msgOption: function (msgType, data) {
    switch (msgType) {
      // 展示
      case 'xg-show': break
      // 点击
      case 'xg-click': break
      // 消息
      case 'xg-msg': Option.reloadMsg(); break
      // 点击通知
      case 'notify-click': break
      // 回退点击
      case 'back-key': Option.backKey(); break
      // 打印
      case 'print': Option.print(data); break
      // 新版本更新
      case 'new-version': Tools.checkNewAPK(); break
    }
  },
  // 刷新消息
  reloadMsg: function () {
    let isMsgView = window.vueApp.$route.path === '/'
    if (isMsgView) {
      Tools.global.defaultView.itemClick('container-msg')
    } else {
      window.vueApp.$router.push({name: 'default', query: {active: 'container-msg'}})
    }
  },
  backCount: 0,
  // 回退
  backKey: function () {
    // 如果是登录页面 直接退出
    if (window.vueApp.$route.path === '/login'){
      Tools.exitApp()
      return
    }

    // 应用内 连续返回二次退出
    if (window.vueApp.$route.path === '/') {
      if (Option.backCount > 0) {
        Tools.exitApp()
        return
      }
      Toast('再按一次退出')
      Option.backCount++
      // 两秒后重置
      window.setTimeout(function () {
        Option.backCount = 0
      }, 2000)
    } else {
      window.vueApp.$router.back(-1)
    }
  },
  print: function (data) {
  }
}

// 注册回调
window.callback = Tools.callback

export default Tools
