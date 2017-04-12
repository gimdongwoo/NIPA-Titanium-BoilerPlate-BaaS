/**
 * The main app singleton used throughout the app. This object contains static
 * properties, global event handling, etc.
 *
 * @class core
 * @singleton
 * @uses migrate
 * @uses update
 * @uses push
 * @uses Modules.ti.cloud
 */
var Alloy = require("alloy");
var Q = require("q");

var APP = {
  /**
   * Application settings as defined in JSON configuration file
   * @type {Object}
   * @param {Object} notifications Push notifications options
   * @param {Boolean} notifications.enabled Whether or not push notifications are enabled
   * @param {String} notifications.provider Push notifications provider
   * @param {Boolean} isRequiredLogin need to login before Mainwindow is shown
   */
  Settings: {
    notifications: {
      enabled: true,
      provider: "Parse"
    },
    isRequiredLogin: false,
  },
  /**
   * Settings Backbone Model
  */
  SettingsM: null,
  /**
   * Device information
   * @type {Object}
   * @param {Boolean} isHandheld Whether the device is a handheld
   * @param {Boolean} isTablet Whether the device is a tablet
   * @param {String} type The type of device, either "handheld" or "tablet"
   * @param {String} os The name of the OS, either "IOS" or "ANDROID"
   * @param {String} name The name of the device, either "IPHONE", "IPAD" or the device model if Android
   * @param {Number} width The width of the device screen
   * @param {Number} height The height of the device screen
   * @param {Number} dpi The DPI of the device screen
   * @param {String} orientation The device orientation, either "LANDSCAPE" or "PORTRAIT"
   * @param {String} statusBarOrientation A Ti.UI orientation value
  */
  Device: {
    isHandheld: !("ipad" === Ti.Platform.osname),
    isTablet: ("ipad" === Ti.Platform.osname),
    type: ("ipad" === Ti.Platform.osname) ? "tablet" : "handheld",
    os: null,
    name: null,
    width: Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight ? Ti.Platform.displayCaps.platformHeight : Ti.Platform.displayCaps.platformWidth,
    height: Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformHeight,
    dpi: Ti.Platform.displayCaps.dpi,
    orientation: Ti.Gesture.orientation == Ti.UI.LANDSCAPE_LEFT || Ti.Gesture.orientation == Ti.UI.LANDSCAPE_RIGHT ? "LANDSCAPE" : "PORTRAIT",
    statusBarOrientation: null,
    iphoneType: null,
    ldf: OS_IOS ? 1 : Ti.Platform.displayCaps.logicalDensityFactor,
    LWidth: null,
    LHeight: null
  },
  /**
   * Network status and information
   * @type {Object}
   * @param {String} type Network type name
   * @param {Boolean} online Whether the device is connected to a network
  */
  Network: {
    type: Ti.Network.networkTypeName,
    online: Ti.Network.online
  },
  /**
   * The loading view
   * @type {Object}
  */
  Loading: Alloy.createWidget("nl.fokkezb.loading"),
  /**
   * The toast message
   * @type {Object}
  */
  Toast: Alloy.createWidget('nl.fokkezb.toast', 'global', {}),
  /**
   * Whether or not the loading screen is open
   * @type {Boolean}
  */
  loadingOpen: false,
  /**
   * currentLanguage
   * @type {String}
  */
  currentLanguage: "ko",//Titanium.Locale.getCurrentLanguage().toLowerCase().substr(0, 2) || "en",
  /**
   * memment library
   * @type {Object}
  */
  Moment: null,
  /**
   * login user model
   * @type {Object}
  */
  UserM: null,
  /**
   * login user flag
   * @type {Object}
  */
  isUserLogin: false,
  /**
   * Initializes the application
  */
  init: function() {
    Ti.API.debug("APP.init");

    // Global system Events
    Ti.Network.addEventListener("change", APP.networkObserver);
    Ti.Gesture.addEventListener("orientationchange", APP.orientationObserver);
    Ti.App.addEventListener("paused", APP.exitObserver);
    Ti.App.addEventListener("close", APP.exitObserver);
    Ti.App.addEventListener("resumed", APP.resumeObserver);

    if(OS_ANDROID) {
      APP.activityContext = require('Context');
      APP.MainWindow.addEventListener("androidback", APP.backButtonObserver);
      APP.MainWindow.addEventListener("open", function(){
        APP.activityContext.on('index', APP.MainWindow.activity);
        APP.MainWindow.removeEventListener('open', arguments.callee);
      });
    }

    // momment library
    APP.Moment = require('momentExtend');
    APP.Moment.lang(APP.currentLanguage);

    // Determine device characteristics
    APP.determineDevice();

    // Initializes settings Model & user Model login try
    APP.initUser();

    _.defer(function() {
      // Set up push notifications
      APP.initPush();
    });
  },
  /**
   * Initializes settings Model & user Model login try
  */
  initUser: function() {
    // login after open main window
    APP.UserM = Alloy.createModel('User');
    // then restore or normal login, open main window
    APP.UserM.on('login:init', function(userM) {
      APP.log("debug", "User login:init : " + JSON.stringify(userM));
      if (userM) APP.UserM.reset(userM);

      // event globaly
      Ti.App.fireEvent('login:init');

      // Defers invoking the function until the current call stack has cleared
      if (!APP.isUserLogin) {
        _.defer(function() {
          APP.initAfterLogin();
        });
      }
      APP.isUserLogin = true;
    });
    // then login fail, open login view
    APP.UserM.on('login:fail', function() {
      APP.doLogin();
    });
    // user model persistance
    APP.UserM.on('change', function() {
      APP.log("debug", "change:user User Cached : SettingsM.UserM");
      if (APP.isUserLogin) APP.SettingsM.save({ "UserM": JSON.stringify(APP.UserM.attributes) });
    });
    APP.UserM.on('reset', function() {
      APP.log("debug", "reset:user User Cached : SettingsM.UserM");
      if (APP.isUserLogin) APP.SettingsM.save({ "UserM": JSON.stringify(APP.UserM.attributes) });
    });

    // settings Model fetch & user Login
    APP.SettingsM = Alloy.Models.instance('Settings');
    APP.SettingsM.fetch({
      success: function() {
        APP.Settings.isRequiredLogin && APP.UserM.login();
      },
      error: function() {
        APP.Settings.isRequiredLogin && APP.UserM.login();
      }
    });
  },
  /**
   * Initializes the application after login success
  */
  initAfterLogin: function(isJoining) {
    APP.log("debug", "APP.initAfterLogin");

    // joinView close
    if (APP.joinView) {
      APP.joinView.close();
      APP.joinView = null;
    }
  },
  /**
   * login or join window displayed after login failed
  */
  doLogin: function() {
    APP.Navigator.closeAll();
    APP.joinView = Alloy.createController('member/login').getView();
    APP.joinView.open();
    APP.closeMainWindow();
  },
  /**
   * Determines the device characteristics
  */
  determineDevice: function() {
    if(OS_IOS) {
      APP.Device.os = "IOS";

      if(Ti.Platform.osname.toUpperCase() == "IPHONE") {
        APP.Device.name = "IPHONE";
      } else if(Ti.Platform.osname.toUpperCase() == "IPAD") {
        APP.Device.name = "IPAD";
      }

      var platformVersionInt = parseInt(Ti.Platform.version, 10);
      var platformHeight = Ti.Platform.displayCaps.platformHeight;
      APP.iphoneType = {
        iOS7 : (OS_IOS && platformVersionInt == 7),
        iOS8 : (OS_IOS && platformVersionInt >= 8),
        talliPhone : (OS_IOS && platformHeight == 568),
        iPhone6 : (OS_IOS && platformHeight == 667),
        iPhone6Plus : (OS_IOS && platformHeight == 736),
        shortPhone : (platformHeight < 568)
      };
    } else if(OS_ANDROID) {
      APP.Device.os = "ANDROID";
      APP.Device.name = Ti.Platform.model.toUpperCase();
    }

    // Fix the display values
    APP.Device.LWidth = (APP.Device.width / APP.Device.ldf);
    APP.Device.LHeight = (APP.Device.height / APP.Device.ldf);
  },
  /**
   * Set up push notifications
  */
  initPush: function() {
    APP.log("debug", "APP.initPush");
    Ti.API.info('APP.Settings.notifications.enabled :', APP.Settings.notifications.enabled);
    if(APP.Settings.notifications.enabled) {
      require("push").init();
    }
  },
  /**
   * Shows the loading screen
   * @param {String} msg displayed message
  */
  openLoading: function(msg) {
    APP.loadingOpen = true;
    var defaultLoadingMsg = L('c_waitingMsgDefault');
    var loadingMessage = msg ? L(msg, msg) : defaultLoadingMsg;
    APP.Loading.show(loadingMessage, false);
  },
  /**
   * Closes the loading screen
  */
  closeLoading: function() {
    if(APP.loadingOpen) {
      setTimeout(function() {
        APP.Loading.hide();
        APP.loadingOpen = false;
      }, 100);
    }
  },
  /**
   * Show the toast normal message
   * @param {String} msg displayed message
  */
  showToast: function(msg) {
    var defaultToastMsg = L('c_waitingMsgDefault');
    var toastMessage = msg ? L(msg, msg) : defaultToastMsg;
    APP.Toast.show(toastMessage);   // same as toast.info
  },
  /**
   * Show the alert message
   * @param {String} msg displayed message
  */
  alert: function(_msg, _title) {
    var deferred = Q.defer();

    var msg = _msg ? L(_msg, _msg) : L('c_alertMsgDefault');
    var title = _title ? L(_title, _title) : L('c_alertTitleDefault');
    var dialog = Ti.UI.createAlertDialog({
      message: msg,
      ok: L('c_alertMsgOk', "OK"),
      title: title
    });
    dialog.addEventListener('click', function(e){
      // Ti.API.info('e.index: ' + e.index);
      APP.closeLoading();
      deferred.resolve(e.index);
    });
    dialog.show();

    return deferred.promise;
  },
  /**
   * Show the ok, cancel dialog
   * @param {String} msg displayed message
  */
  confirm: function(_msg, _title, _okTitle, _cancelTitle) {
    var deferred = Q.defer();

    var msg = _msg ? L(_msg, _msg) : L('c_alertMsgDefault');
    var title = _title ? L(_title, _title) : L('c_alertTitleDefault');
    var dialog = Ti.UI.createAlertDialog({
      message: msg,
      cancel: 1,
      buttonNames: [_okTitle || L('c_alertMsgOk', "OK"), _cancelTitle || L('c_alertMsgCancel', "Cancel")],
      title: title
    });
    dialog.addEventListener('click', function(e){
      // Ti.API.info('e.index: ' + e.index);
      APP.closeLoading();
      if (e.index === e.source.cancel){
        deferred.reject(e.index);
      } else {
        deferred.resolve(e.index);
      }
    });
    dialog.show();

    return deferred.promise;
  },
  /**
   * Logs all console data
   * @param {String} _severity A severity type (debug, error, info, log, trace, warn)
   * @param {String} _text The text to log
  */
  log: function(_severity, _text, _text1, _text2, _text3, _text4, _text5) {
    if (!ENV_PRODUCTION) {
      switch(_severity.toLowerCase()) {
        case "debug":
          Ti.API.debug(_text, _text1, _text2, _text3, _text4, _text5);
          break;
        case "error":
          Ti.API.error(_text, _text1, _text2, _text3, _text4, _text5);
          break;
        case "info":
          Ti.API.info(_text, _text1, _text2, _text3, _text4, _text5);
          break;
        case "log":
          Ti.API.log(_text, _text1, _text2, _text3, _text4, _text5);
          break;
        case "trace":
          Ti.API.trace(_text, _text1, _text2, _text3, _text4, _text5);
          break;
        case "warn":
          Ti.API.warn(_text, _text1, _text2, _text3, _text4, _text5);
          break;
      }
    }
  },
  /**
   * Global orientation event handler
   * @param {Object} _event Standard Titanium event callback
  */
  orientationObserver: function(_event) {
    APP.log("debug", "APP.orientationObserver");
    if(APP.Device.statusBarOrientation && APP.Device.statusBarOrientation == _event.orientation) {
      return;
    }
    APP.Device.statusBarOrientation = _event.orientation;
    APP.Device.orientation = (_event.orientation == Ti.UI.LANDSCAPE_LEFT || _event.orientation == Ti.UI.LANDSCAPE_RIGHT) ? "LANDSCAPE" : "PORTRAIT";
    Ti.App.fireEvent("APP:orientationChange");
  },
  /**
   * Global network event handler
   * @param {Object} _event Standard Titanium event callback
  */
  networkObserver: function(_event) {
    APP.log("debug", "APP.networkObserver");
    APP.Network.type = _event.networkTypeName;
    APP.Network.online = _event.online;
    Ti.App.fireEvent("APP:networkChange");
  },
  /**
   * Exit event observer
   * @param {Object} _event Standard Titanium event callback
  */
  exitObserver: function(_event) {
    APP.log("debug", "APP.exitObserver");
    Alloy.Globals.appOnline = false;
  },
  /**
   * Resume event observer
   * @param {Object} _event Standard Titanium event callback
  */
  resumeObserver: function(_event) {
    APP.log("debug", "APP.resumeObserver");
    Alloy.Globals.appOnline = true;
  },
  /**
   * Back button observer
   * @param {Object} _event Standard Titanium event callback
  */
  backButtonObserver: function(_event) {
    APP.log("debug", "APP.backButtonObserver");
  },
  /**
   * show PushNotification window or do something.
   * @param {Object} payload push notification data
  */
  showPushNotification: function(payload) {
    APP.log("debug", "APP.showPushNotification", payload);
  }
};

module.exports = APP;
