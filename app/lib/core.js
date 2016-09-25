/**
 * The main app singleton used throughout the app. This object contains static
 * properties, global event handling, etc.
 *
 * @class core
 * @singleton
 * @uses utilities
 * @uses http
 * @uses migrate
 * @uses update
 * @uses push
 * @uses Modules.ti.cloud
 */
var Alloy = require("alloy");
var UTIL = require("utilities");
var HTTP = require("http");
var Q = require("q");

var APP = {
  /**
   * Application ID
   * @type {String}
   */
  ID: null,
  /**
   * Application version
   * @type {String}
   */
  VERSION: null,
  /**
   * configuration version
   * @type {String}
   */
  CVERSION: null,
  /**
   * DB version
   * @type {String}
   */
  DBVersion: null,
  /**
   * Legal information
   * @type {Object}
   * @param {String} COPYRIGHT Copyright information
   * @param {String} TOS Terms of Service URL
   * @param {String} PRIVACY Privacy Policy URL
   */
  LEGAL: {
    COPYRIGHT: null,
    TOS: null,
    PRIVACY: null
  },
  /**
   * URL to remote JSON configuration file
   *
   * **NOTE: This can be used for over-the-air (OTA) application updates.**
   * @type {String}
   */
  ConfigurationURL: null,
  /**
   * All the component nodes (e.g. tabs)
   * @type {Object}
   */
  Nodes: [],
  /**
   * Application settings as defined in JSON configuration file
   * @type {Object}
   * @param {Object} notifications Push notifications options
   * @param {Boolean} notifications.enabled Whether or not push notifications are enabled
   * @param {String} notifications.provider Push notifications provider
   * @param {String} notifications.key Push notifications key
   * @param {String} notifications.secret Push notifications secret
   * @param {Object} colors Color options
   * @param {String} colors.primary The primary color
   * @param {String} colors.secondary The secondary color
   * @param {String} colors.theme The theme of the primary color, either "light" or "dark"
   * @param {Object} colors.hsb The HSB values of the primary color
   * @param {Boolean} useSlideMenu Whether or not to use the slide menu (alternative is tabs)
   */
  Settings: null,
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
   * @param {String} version The version of the OS
   * @param {Number} versionMajor The major version of the OS
   * @param {Number} versionMinor The minor version of the OS
   * @param {Number} width The width of the device screen
   * @param {Number} height The height of the device screen
   * @param {Number} dpi The DPI of the device screen
   * @param {String} orientation The device orientation, either "LANDSCAPE" or "PORTRAIT"
   * @param {String} statusBarOrientation A Ti.UI orientation value
   */
  Device: {
    isHandheld: Alloy.isHandheld,
    isTablet: Alloy.isTablet,
    type: Alloy.isHandheld ? "handheld" : "tablet",
    os: null,
    name: null,
    version: Ti.Platform.version,
    versionMajor: parseInt(Ti.Platform.version.split(".")[0], 10),
    versionMinor: parseInt(Ti.Platform.version.split(".")[1], 10),
    width: Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight ? Ti.Platform.displayCaps.platformHeight : Ti.Platform.displayCaps.platformWidth,
    height: Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformHeight,
    dpi: Ti.Platform.displayCaps.dpi,
    orientation: Ti.Gesture.orientation == Ti.UI.LANDSCAPE_LEFT || Ti.Gesture.orientation == Ti.UI.LANDSCAPE_RIGHT ? "LANDSCAPE" : "PORTRAIT",
    statusBarOrientation: null,
    iphoneType: null,
    ldf: OS_IOS ? 1 : Ti.Platform.displayCaps.logicalDensityFactor,
    LWidth: function () {return Ti.Platform.displayCaps.platformWidth/this.ldf},
    LHeight: function () {return Ti.Platform.displayCaps.platformHeight/this.ldf}
  },
  /**
   * The navigator object which handles all navigation
   * @type {Object}
   */
  Navigator: {},
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
   * Current controller view stack index
   * @type {Number}
   */
  currentStack: -1,
  /**
   * previous controller view stack index
   * @type {Number}
   */
  previousStack: -1,
  /**
   * The previous screen in the hierarchy
   * @type {Object}
   */
  previousScreen: null,
  /**
   * The current screen in the hierarchy
   * @type {Object}
   */
  currentScreen: null,
  /**
   * The view stack for controllers
   * @type {Array}
   */
  controllerStacks: [],
  /**
   * The view stack for modals
   * @type {Array}
   */
  modalStack: [],
  /**
   * Whether or not the current view has a tablet layout
   * @type {Boolean}
   */
  hasDetail: false,
  /**
   * Current detail view stack index
   * @type {Number}
   */
  currentDetailStack: -1,
  /**
   * The previous detail screen in the hierarchy
   * @type {Object}
   */
  previousDetailScreen: null,
  /**
   * The view stack for detail views
   * @type {Array}
   */
  detailStacks: [],
  /**
   * The view stack for master views
   * @type {Array}
   */
  Master: [],
  /**
   * The view stack for detail views
   * @type {Array}
   */
  Detail: [],
  /**
   * The main app controller
   * @type {Object}
   */
  MainController: null,
  /**
   * The main app window
   * @type {Object}
   */
  MainWindow: null,
  /**
   * The global view all screen controllers get added to
   * @type {Object}
   */
  GlobalWrapper: null,
  /**
   * The global view all content screen controllers get added to
   * @type {Object}
   */
  ContentWrapper: null,
  /**
   * Holder for ACS cloud module
   * @type {Object}
   */
  ACS: null,
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
   * Whether or not to cancel the loading screen open because it's already open
   * @type {Boolean}
   */
  cancelLoading: false,
  /**
   * Whether or not the loading screen is open
   * @type {Boolean}
   */
  loadingOpen: false,
  /**
   * Tabs widget
   * @type {Object}
   */
  Tabs: null,
  /**
   * Slide Menu widget
   * @type {Object}
   */
  SlideMenu: null,
  /**
   * Whether or not the slide menu is open
   * @type {Boolean}
   */
  SlideMenuOpen: false,
  /**
   * Whether or not the slide menu is engaged
   *
   * **NOTE: Turning this false temporarily disables the slide menu**
   * @type {Boolean}
   */
  SlideMenuEngaged: true,
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

    // Require in the navigation module
    APP.Navigator = require("navigation")({
      parent: APP.MainWindow
    });

    // momment library
    APP.Moment = require('momentExtend');
    APP.Moment.lang(APP.currentLanguage);

    // Determine device characteristics
    APP.determineDevice();

    // check permissions & callback function
    APP.checkPermissions(function() {
      // Create a database
      APP.setupDatabase();

      // Reads in the JSON config file
      APP.loadContent();

      // Migrate to newer DB version
      require("migrate").init();

      // Initializes settings Model & user Model login try
      APP.initUser();

      // NOTICE:
      // The following sections are abstracted for PEEK

      _.defer(function() {
        // Updates the app from a remote source
        APP.update();

        _.defer(function() {
          // Set up push notifications
          APP.initPush();
        });
      });

      // // Set up ACS
      // APP.initACS();
    });
  },
  /**
   * check permissions need to run
   */
  checkPermissions: function(callback) {
    // request storage permission
    if (OS_ANDROID) {
      var ownedPermission = function() {
        // done
        APP.closeLoading();
        callback && callback();
      };

      var requestStoragePerm = function() {
        if (!Ti.Filesystem.hasStoragePermissions()) {
          Ti.Filesystem.requestStoragePermissions(function (e) {
            if (e.success) {
              // success
              Ti.API.info('requestStoragePermission : success');
              ownedPermission();
            } else {
              Ti.API.error('requestStoragePermission : error');
              APP.alertCancel(L("c_requestStorageSetting"), null, null, L("c_requestStorageSettingsOpen")).then(function() {
                requestStoragePerm();
              }, function(err) {
                Ti.API.debug('settings open');
                APP.openLoading(L("c_requestStoragePerm"));

                var resumedFn = function() {
                  requestStoragePerm();
                  Ti.Android.currentActivity.onStart = null;
                  Ti.Android.currentActivity.onResume = null;
                };
                Ti.Android.currentActivity.onStart = resumedFn;
                Ti.Android.currentActivity.onResume = resumedFn;

                // settings open
                require("com.boxoutthinkers.reqstorageperm").settingsOpen();
              });
            }
          });
        } else {
          Ti.API.info('requestStoragePermission : already have');
          ownedPermission();
        }
      };

      var checkNRequestStoragePerm = function () {
        if (!Ti.Filesystem.hasStoragePermissions()) {
          APP.alert(L("c_requestStoragePerm")).then(function() {
            requestStoragePerm();
          });
        } else {
          Ti.API.info('requestStoragePermission : already have');
          ownedPermission();
        }
      };

      // do check
      checkNRequestStoragePerm();
    } else {
      // non android
      callback && callback();
    }
  },
  /**
   * Initializes settings Model & user Model login try
   */
  initUser: function() {
    // login after open main window
    APP.UserM = Alloy.createModel('User');
    // then restore or normal login, open main window
    APP.UserM.on('login:init', function(userM, isJoining) {
      APP.log("debug", "User login:init : " + JSON.stringify(userM));
      if (userM) APP.UserM.reset(userM);

      // Defers invoking the function until the current call stack has cleared
      if (!APP.isUserLogin) {
        _.defer(function() {
          APP.initAfterLogin(isJoining);
        });
      }
      APP.isUserLogin = true;
    });
    // then login fail, open login view
    APP.UserM.on('login:fail', function() {
      APP.UserM.off('login:fail',arguments.callee);
      APP.requiredLogin();
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
        APP.UserM.login();
      },
      error: function() {
        APP.UserM.login();
      }
    });
  },
  /**
   * Initializes the application after login success
   */
  initAfterLogin: function(isJoining) {
    APP.log("debug", "APP.initAfterLogin");

    // Builds out the tab group
    APP.build();

    // Open the main window
    APP.MainWindow.open();

    // joinView close
    if (APP.joinView) {
      APP.joinView.close();
      APP.joinView = null;
    }

    if(isJoining || APP.currentStack < 0){
      // The initial screen to show
      APP.handleNavigation(0);
    }
  },
  /**
   * login or join window displayed after login failed
   */
  requiredLogin: function() {
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

      // Fix the display values
      APP.Device.width = (APP.Device.width / (APP.Device.dpi / 160));
      APP.Device.height = (APP.Device.height / (APP.Device.dpi / 160));
    }
  },
  /**
   * Setup the database bindings
   */
  setupDatabase: function() {
    Ti.API.debug("APP.setupDatabase");

    var db = Ti.Database.open(Titanium.App.id);

    db.execute("CREATE TABLE IF NOT EXISTS updates (url TEXT PRIMARY KEY, time TEXT);");
    db.execute("CREATE TABLE IF NOT EXISTS log (time INTEGER, type TEXT, message TEXT);");

    // Fill the log table with empty rows that we can 'update', providing a max row limit
    var data = db.execute("SELECT time FROM log;");

    if(data.rowCount === 0) {
      db.execute("BEGIN TRANSACTION;");

      for(var i = 0; i < 100; i++) {
        db.execute("INSERT INTO log VALUES (" + i + ", \"\", \"\");");
      }

      db.execute("END TRANSACTION;");
    }

    data.close();
    db.close();
  },
  /**
   * Drops the entire database
   */
  dropDatabase: function() {
    Ti.API.debug("APP.dropDatabase");

    var db = Ti.Database.open(Titanium.App.id);
    db.remove();
    db.close();
  },
  /**
   * Loads in the appropriate controller and config data
   */
  loadContent: function() {
    APP.log("debug", "APP.loadContent");

    var contentFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, Ti.App.Properties.getString('Configuration_File'));
    var contentFileOrg, content, data;

    if(!contentFile.exists()) {
      APP.log("debug", "Downloaded Configuration File Not found, load default");
      contentFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory + "data/" + Ti.App.Properties.getString('Configuration_File'));
    } else {
      contentFileOrg = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory + "data/" + Ti.App.Properties.getString('Configuration_File'));
    }

    try {
      content = contentFile.read();
      data = JSON.parse(content.text);
      if (contentFileOrg) {
        var contentOrg = contentFileOrg.read();
        var dataOrg = JSON.parse(contentOrg.text);
        if (data.cVersion < dataOrg.cVersion) {
          APP.log("info", "packaged JSON is newer then downloaded JSON");
          data = dataOrg;
        }
      }
    } catch(_error) {
      APP.log("error", "Unable to parse downloaded JSON, reverting to packaged JSON");

      contentFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory + "data/" + Ti.App.Properties.getString('Configuration_File'));

      if(contentFile.exists()) {
        content = contentFile.read();
        data = JSON.parse(content.text);
      } else {
        APP.log("error", "Unable to parse local JSON, dying");

        alert("Unable to open the application");

        return;
      }
    }

    APP.ID = Titanium.App.id;
    APP.VERSION = Titanium.App.version;
    APP.CVERSION = data.cVersion;
    APP.DBVersion = data.dbVersion;
    APP.LEGAL = {
      COPYRIGHT: data.legal.copyright,
      TOS: data.legal.terms,
      PRIVACY: data.legal.privacy
    };

    APP.ConfigurationURL = data.configurationUrl && data.configurationUrl.length > 10 ? data.configurationUrl : false;
    APP.Settings = data.settings;
    APP.Nodes = data.tabs;

    for(var i = 0, x = APP.Nodes.length; i < x; i++) {
      APP.Nodes[i].index = i;
    }

    if(typeof APP.Settings.useSlideMenu == "undefined") {
      APP.Settings.useSlideMenu = false;
    }

    APP.Settings.colors.hsb = {
      primary: UTIL.hexToHsb(APP.Settings.colors.primary),
      secondary: UTIL.hexToHsb(APP.Settings.colors.secondary)
    };

    if (!APP.Settings.colors.theme) {
      APP.Settings.colors.theme = APP.Settings.colors.hsb.primary.b < 65 ? "dark" : "light";
    }

    if(OS_IOS) {
      if (!APP.Settings.colors.statusBarStyle) {
        APP.MainWindow.statusBarStyle = (APP.Settings.colors.theme == "dark") ? Ti.UI.iPhone.StatusBar.LIGHT_CONTENT : Ti.UI.iPhone.StatusBar.DEFAULT;
      } else {
        APP.MainWindow.statusBarStyle = (APP.Settings.colors.statusBarStyle == "LIGHT") ? Ti.UI.iPhone.StatusBar.LIGHT_CONTENT : Ti.UI.iPhone.StatusBar.DEFAULT;
      }
    }

    var define = "core";
    APP.Settings.evalCode && APP.Settings.evalCode[define] && APP.Settings.evalCode[define].version >= APP.VERSION && eval(APP.Settings.evalCode[define].code);
  },
  /**
   * Builds out the tab group
   */
  build: function() {
    APP.log("debug", "APP.build");

    var nodes = [];
    var imageFolder = !APP.Settings.useSlideMenu && APP.Settings.colors.theme == "light" ? "/icons/black/" : "/icons/white/";
    var hasMenuHeaders = false;

    for(var i = 0, x = APP.Nodes.length; i < x; i++) {
      nodes.push({
        id: i,
        title: APP.Nodes[i].title,
        image: UTIL.fileExists(imageFolder + APP.Nodes[i].image + ".png") ? imageFolder + APP.Nodes[i].image + ".png" : null,
        controller: APP.Nodes[i].type.toLowerCase(),
        menuHeader: APP.Nodes[i].menuHeader,
        viewType: APP.Nodes[i].viewType,
        textOffStyle: APP.Nodes[i].textOffStyle,
        textOnStyle: APP.Nodes[i].textOnStyle,
        imageOffStyle: APP.Nodes[i].imageOffStyle,
        imageOnStyle: APP.Nodes[i].imageOnStyle,
      });

      if(APP.Settings.useSlideMenu && APP.Nodes[i].menuHeader) {
        hasMenuHeaders = true;
      }
    }

    if(APP.Settings.useSlideMenu) {
      // Add the Settings tab
      nodes.push({
        id: "settings",
        title: "Settings",
        image: "/icons/white/settings.png",
        menuHeader: hasMenuHeaders ? "Application" : null
      });

      APP.buildMenu(nodes);
    } else {
      APP.buildTabs(nodes);
    }
  },
  /**
   * Builds a TabGroup
   * @param {Array} _nodes The items (tabs) to build
   */
  buildTabs: function(_nodes) {
    APP.log("debug", "APP.buildTabs");

    APP.Tabs && APP.Tabs.init({
      nodes: _nodes,
      more: APP.Settings.colors.theme == "dark" ? "/icons/white/more.png" : "/icons/black/more.png",
      color: {
        //background: APP.Settings.colors.primary,
        background: "white",
        active: APP.Settings.colors.secondary,
        text: APP.Settings.colors.theme == "dark" ? "#FFF" : "#000"
      }
    });

    // Add a handler for the tabs (make sure we remove existing ones first)
    APP.Tabs && APP.Tabs.Wrapper.removeEventListener("click", APP.handleTabClick);
    APP.Tabs && APP.Tabs.Wrapper.addEventListener("click", APP.handleTabClick);
  },
  /**
   * Builds a slide menu
   * @param {Array} _nodes The items (menu nodes) to build
   */
  buildMenu: function(_nodes) {
    APP.log("debug", "APP.buildMenu");

    APP.SlideMenu && APP.SlideMenu.init({
      nodes: _nodes,
      color: {
        headingBackground: APP.Settings.colors.primary,
        headingText: APP.Settings.colors.theme == "dark" ? "#FFF" : "#000"
      }
    });

    // Remove the TabGroup
    APP.Tabs && APP.Tabs.close();

    // Move everything down to take up the TabGroup space
    APP.Tabs && APP.Tabs.hide();

    // Add a handler for the nodes (make sure we remove existing ones first)
    APP.SlideMenu && APP.SlideMenu.Nodes.removeEventListener("click", APP.handleMenuClick);
    APP.SlideMenu && APP.SlideMenu.Nodes.addEventListener("click", APP.handleMenuClick);

    // Listen for gestures on the main window to open/close the slide menu
    // APP.GlobalWrapper && APP.GlobalWrapper.addEventListener("swipe", function(_event) {
    //   if(APP.SlideMenuEngaged) {
    //     if(_event.direction == "right") {
    //       APP.openMenu();
    //     } else if(_event.direction == "left") {
    //       APP.closeMenu();
    //     }
    //   }
    // });
  },
  /**
   * Re-builds the app with newly downloaded JSON configration file
   */
  rebuild: function() {
    APP.log("debug", "APP.rebuild");

    if(APP.Settings.useSlideMenu) {
      APP.SlideMenu && APP.SlideMenu.clear();
    }
    APP.Tabs && APP.Tabs.clear();

    // // Undo removal of TabGroup
    // APP.Tabs.close();
    // APP.Tabs.open();
    // APP.Tabs.show();

    APP.currentStack = -1;
    APP.previousScreen = null;
    APP.currentScreen = null;
    APP.controllerStacks = [];
    APP.modalStack = [];
    APP.hasDetail = false;
    APP.currentDetailStack = -1;
    APP.previousDetailScreen = null;
    APP.detailStacks = [];
    APP.Master = [];
    APP.Detail = [];
    APP.cancelLoading = false;
    APP.loadingOpen = false;

    // APP.dropDatabase();

    // NOTICE
    // The following section is abstracted for PEEK

    APP.rebuildRestart();
  },
  /**
   * Kicks off the newly re-built application
   */
  rebuildRestart: function() {
    Ti.API.debug("APP.rebuildRestart");

    APP.setupDatabase();
    APP.loadContent();
    if (!APP.isUserLogin) return;
    APP.build();
    APP.handleNavigation(0);
  },
  /**
   * Updates the app from a remote source
   */
  update: function() {
    require("update").init();
  },
  /**
   * Set up ACS
   */
  initACS: function() {
    APP.log("debug", "APP.initACS");

    APP.ACS = require("ti.cloud");
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
   * Handles the click event on a tab
   * @param {Object} _event The event
   */
  handleTabClick: function(_event) {
    if(typeof _event.source.id !== "undefined" && typeof _event.source.id == "number") {
      APP.handleNavigation(_event.source.id);
    }
  },
  /**
   * Handles the click event on a menu item
   * @param {Object} _event The event
   */
  handleMenuClick: function(_event) {
    if(typeof _event.row.id !== "undefined" && typeof _event.row.id == "number") {
      APP.closeSettings();

      APP.handleNavigation(_event.row.id);
    } else if(typeof _event.row.id !== "undefined" && _event.row.id == "settings") {
      APP.openSettings();
    }

    APP.toggleMenu();
  },
  /**
   * Global event handler to change screens
   * @param {String} _id The ID (index) of the tab being opened
   */
  handleNavigation: _.debounce(function(_id, isForceOpen) {
    var type = APP.Nodes[_id].type.toLowerCase();
    var tabletSupport = APP.Nodes[_id].tabletSupport;
    var viewType = APP.Nodes[_id].viewType;
    var options = APP.Nodes[_id];

    APP.log("debug", "APP.handleNavigation | " + type);

    if(type == 'question/post'){
      return APP.openPostQuestion();
    }

    // Requesting same screen as we're on
    if(_id == APP.currentStack) {
      // Closes any loading screens
      APP.closeLoading();
      // Do nothing
      return;
    } else {
      //
      if(viewType == "modal") {
        // Closes any loading screens
        APP.closeLoading();
        // modal
        APP.Navigator.open(type, options);
        return;
      }

      if(APP.Settings.useSlideMenu) {
        // Select the row for the requested item
        APP.SlideMenu && APP.SlideMenu.setIndex(_id);
      } else {
        // Move the tab selection indicator
        APP.Tabs && APP.Tabs.setIndex(_id);
      }

      // Closes any loading screens
      APP.closeLoading();

      // Set current stack
      APP.previousStack = APP.currentStack;
      APP.previousType = APP.currentType;

      APP.currentStack = _id;
      APP.currentType = type;

      // Create new controller stack if it doesn't exist
      if(typeof APP.controllerStacks[_id] === "undefined") {
        APP.controllerStacks[_id] = [];
      }

      if(APP.Device.isTablet) {
        APP.currentDetailStack = _id;

        if(typeof APP.detailStacks[_id] === "undefined") {
          APP.detailStacks[_id] = [];
        }
      }

      // Set current controller stack
      var controllerStack = APP.controllerStacks[_id];

      // If we're opening for the first time, create new screen
      // Otherwise, add the last screen in the stack (screen we navigated away from earlier on)
      var screen;

      APP.hasDetail = false;
      APP.previousDetailScreen = null;

      if(controllerStack.length > 0) {
        // Retrieve the last screen
        if(APP.Device.isTablet) {
          screen = controllerStack[0];

          if(screen.type == "tablet") {
            APP.hasDetail = true;
          }
        } else {
          screen = controllerStack[controllerStack.length - 1];
        }

        // Tell the parent screen it was added to the window
        /*
        if(controllerStack[0].type == "tablet") {
          controllerStack[0].fireEvent("APP:tabletScreenAdded");
        } else {
          controllerStack[0].fireEvent("APP:screenAdded");
        }
        */
      } else {
        // Create a new screen

        // TODO: Remove this. Find other way to determine if tablet version is available
        // if(APP.Device.isTablet) {
        //   if(tabletSupport) {
        //     type = "tablet";
        //     APP.hasDetail = true;
        //   } else {
        //     switch(type) {
        //       case "article":
        //       case "event":
        //       case "facebook":
        //       case "flickr":
        //       case "podcast":
        //       case "share":
        //       case "vimeo":
        //       case "youtube":
        //         type = "tablet";
        //         APP.hasDetail = true;
        //         break;
        //     }
        //   }
        // }

        screen = Alloy.createController(type, options).getView();

        // Add screen to the controller stack
        controllerStack.push(screen);

        // Tell the screen it was added to the window
        /*
        if(screen.type == "tablet") {
          screen.fireEvent("APP:tabletScreenAdded");
        } else {
          screen.fireEvent("APP:screenAdded");
        }
        */
      }

      // Add the screen to the window
      APP.addScreen(screen);

      // Reset the modal stack
      APP.modalStack = [];
    }
    _.defer(function() {
      Ti.App.fireEvent('handleNavigation', { "name" : type });
    });
  }, 700, true),
  /**
   * Open a child screen
   * @param {String} _controller The name of the controller to open
   * @param {Object} _params An optional dictionary of parameters to pass to the controller
   * @param {Boolean} _modal Whether this is for the modal stack
   * @param {Boolean} _sibling Whether this is a sibling view
   */
  addChild: function(_controller, _params, _modal, _sibling) {
    var stack;

    // Determine if stack is associated with a tab
    if(_modal) {
      stack = APP.modalStack;
    } else {
      if(APP.Device.isHandheld || !APP.hasDetail) {
        stack = APP.controllerStacks[APP.currentStack];
      } else {
        stack = APP.detailStacks[APP.currentDetailStack];
      }
    }

    // Create the new screen controller
    var controller = Alloy.createController(_controller, _params);
    var screen = controller.getView();

    // open & close event explicited run (all controller need exports.open/close)
    screen.addEventListener('open',function(){
      controller.open();
    });
    screen.addEventListener('close',function(){
      screen.removeEventListener('close',arguments.callee);
      Ti.API.debug("Screen closed");

      controller.close();
      controller.removeListener && controller.removeListener();
      controller.destroy && controller.destroy();

      screen = null;
      controller = null;
    });

    if(_sibling) {
      var _screen = (stack.length) ? stack[stack.length - 1] : null;
      stack.pop();
      //null out
      _screen && _screen.fireEvent('close');
      _screen = null;
    }

    //getCurrentScreen
    if(stack.length){
      var currentScreen = stack[stack.length-1];
    }

    // Add screen to the controller stack
    stack.push(screen);

    // Add the screen to the window
    if(APP.Device.isHandheld || !APP.hasDetail || _modal) {
      APP.addScreen(screen, currentScreen, 'add');
    } else {
      APP.addDetailScreen(screen);
    }

    screen.fireEvent('open');
  },
  /**
   * Removes a child screen
   * @param {Boolean} _modal Removes the child from the modal stack
   */
  removeChild: function(_modal) {
    var stack;

    if(_modal) {
      stack = APP.modalStack;
    } else {
      if(APP.Device.isTablet && APP.hasDetail) {
        stack = APP.detailStacks[APP.currentDetailStack];
      } else {
        stack = APP.controllerStacks[APP.currentStack];
      }
    }

    // 1st screen don't remove
    if(stack.length <= 1) return;

    var screen = stack[stack.length - 1];
    stack.pop();

    var previousScreen = stack[stack.length - 1];

    if(APP.Device.isHandheld || !APP.hasDetail) {
      APP.addScreen(previousScreen, screen, 'remove');
    } else {
      if(_modal) {
        APP.addScreen(previousScreen, screen, 'remove');
      } else {
        APP.addDetailScreen(previousScreen);
      }
    }

    // handleNavigation event
    var hName = (APP.currentStack == 99) ? "alarms" :APP.Nodes[APP.currentStack].type;
    if (stack.length <= 1) {
      _.defer(function() {
        Ti.App.fireEvent('handleNavigation', { "name" : hName });
      });
    }
    // null out
    screen && screen.fireEvent('close');
    screen = null;
  },
  /**
   * Removes all children screens
   * @param {Boolean} _modal Removes all children from the stack
   */
  removeAllChildren: function(_modal) {
    var stack = _modal ? APP.modalStack : APP.controllerStacks[APP.currentStack];

    for(var i = stack.length - 1; i > 0; i--) {
      var _screen = (stack.length) ? stack[stack.length - 1] : null;
      stack.pop();

      //null out
      if (OS_IOS) _screen && _screen.fireEvent('remove');
      _screen && _screen.fireEvent('close');
      _screen = null;
    }
    APP.addScreen(stack[0]);
  },
  /**
   * Global function to add a screen
   * @param {Object} _screen The screen to add
   * @param {Object} _currentScreen The screen to remove using animate
   */
  addScreen: function(_screen, _currentScreen, addOrRemove) {
    if(_screen) {
      if (OS_IOS) {
        if (_currentScreen && addOrRemove == 'remove') {
          APP.ContentWrapper.remove(_currentScreen);
          _currentScreen.isAdded = false;
        }
        if (!_screen.isAdded) {
          _screen.isAdded = true;
          APP.ContentWrapper.add(_screen);
        }
      } else {
        if (_currentScreen) {
          var prevContainerStartLeft = -1 * APP.Device.width / 3;

          switch (addOrRemove) {
            case 'remove':
              _screen.applyProperties({width:"100%", left:prevContainerStartLeft, zIndex:0});
              _currentScreen.applyProperties({width:"100%", zIndex:1});

              Ti.API.info('_screen.isAdded :', _screen.isAdded);
              if (!_screen.isAdded) {
                _screen.isAdded = true;
                APP.ContentWrapper.add(_screen);
              }

              _screen.animate({
                left:0,
                duration : 200
              }, function() {
                _screen.applyProperties({left:0, zIndex:1});
              });

              _currentScreen.animate({
                right:"-100%",
                duration : 200,
              }, function() {
                APP.ContentWrapper.remove(_currentScreen);
                _currentScreen.applyProperties({zIndex:0});
                _currentScreen.isAdded = false;
              });
            break;

            case 'add':
            default:
              _currentScreen.applyProperties({width:"100%", left:0, zIndex:0});
              _screen.applyProperties({width:"100%",right:"-100%", zIndex:1});

              if (!_screen.isAdded) {
                _screen.isAdded = true;
                APP.ContentWrapper.add(_screen);
              }

              _screen.animate({
                right:0,
                duration : 200,
              }, function() {
                _screen.applyProperties({right:0});
              });

              _currentScreen.animate({
                left:prevContainerStartLeft,
                duration : 200
              }, function() {
                _currentScreen.applyProperties({left:"-100%"});
              });
            break;
          }
        } else {
          if (!_screen.isAdded) {
            _screen.isAdded = true;
            APP.ContentWrapper.add(_screen);
          }

          if(APP.currentScreen) {
            APP.removeScreen(APP.currentScreen);
          }
        }
      }
      // APP.previousScreen = _screen;
      APP.previousScreenStandup();
    }
  },
  /**
   * Global function to remove a screen
   * @param {Object} _screen The screen to remove
   */
  removeScreen: function(_screen) {
    if(_screen) {
      APP.ContentWrapper.remove(_screen);
      _screen.isAdded = false;
      // APP.previousScreen = null;
    }
  },
  /**
   * Adds a screen to the Master window
   * @param {String} _controller The name of the controller to open
   * @param {Object} _params An optional dictionary of parameters to pass to the controller
   * @param {Object} _wrapper The parent wrapper screen to fire events to
   */
  addMasterScreen: function(_controller, _params, _wrapper) {
    var screen = Alloy.createController(_controller, _params).getView();

    /*
    _wrapper.addEventListener("APP:tabletScreenAdded", function(_event) {
      screen.fireEvent("APP:screenAdded");
    });
    */

    APP.Master[APP.currentStack].add(screen);
  },
  /**
   * Adds a screen to the Detail window
   * @param {Object} _screen The screen to add
   */
  addDetailScreen: function(_screen) {
    if(_screen) {
      APP.Detail[APP.currentStack].add(_screen);

      if(APP.previousDetailScreen && APP.previousDetailScreen != _screen) {
        var pop = true;

        if(APP.detailStacks[APP.currentDetailStack][0].type == "PARENT" && _screen.type != "PARENT") {
          pop = false;
        }

        APP.removeDetailScreen(APP.previousDetailScreen, pop);
      }

      APP.previousDetailScreen = _screen;
    }
  },
  /**
   * Removes a screen from the Detail window
   * @param {Object} _screen The screen to remove
   * @param {Boolean} _pop Whether to pop the item off the controller stack
   */
  removeDetailScreen: function(_screen, _pop) {
    if(_screen) {
      APP.Detail[APP.currentStack].remove(_screen);

      APP.previousDetailScreen = null;

      if(_pop) {
        var stack = APP.detailStacks[APP.currentDetailStack];

        stack.splice(0, stack.length - 1);
      }
    }
  },
  /**
  * previous Scrren & current Screen Manage + Added
  */
  previousScreenStandup: function() {
    APP.previousScreen = APP.getPreviousScreen();
    APP.currentScreen = APP.getCurrentScreen();
    if (APP.previousScreen && !APP.previousScreen.isAdded) {
      APP.previousScreen.applyProperties({width:"100%", left:"-100%", zIndex:0});
      APP.previousScreen.isAdded = true;
      APP.ContentWrapper.add(APP.previousScreen);
    }
  },
  /**
   * get prev screen
   */
  getPreviousScreen: function(_modal) {
    var stack;
    // Determine if stack is associated with a tab
    if(_modal) {
      stack = APP.modalStack;
    } else {
      if(APP.Device.isHandheld || !APP.hasDetail) {
        stack = APP.controllerStacks[APP.currentStack];
      } else {
        stack = APP.detailStacks[APP.currentDetailStack];
      }
    }
    return stack[stack.length-2];
  },
  /**
   * get current screen
   */
  getCurrentScreen: function(_modal) {
    var stack;
    // Determine if stack is associated with a tab
    if(_modal) {
      stack = APP.modalStack;
    } else {
      if(APP.Device.isHandheld || !APP.hasDetail) {
        stack = APP.controllerStacks[APP.currentStack];
      } else {
        stack = APP.detailStacks[APP.currentDetailStack];
      }
    }
    return stack[stack.length-1];
  },
  /**
   * get current screen
   */
  removeCurrentScreen: function(_modal) {
    // Determine if stack is associated with a tab
    if(_modal) {
      stack = APP.modalStack;
    } else {
      if(APP.Device.isHandheld || !APP.hasDetail) {
        stack = APP.controllerStacks[APP.currentStack];
      } else {
        stack = APP.detailStacks[APP.currentDetailStack];
      }
    }

    var _screen = (stack.length) ? stack[stack.length - 1] : null;
    stack.pop();
    // handleNavigation event
    var hName = (APP.currentStack == 99) ? "alarms" :APP.Nodes[APP.currentStack].type;
    if (stack.length <= 1) {
      _.defer(function() {
        Ti.App.fireEvent('handleNavigation', { "name" : hName });
      });
    }
    //null out
    _screen && _screen.fireEvent('close');
    _screen = null;

    APP.previousScreenStandup();
  },
  /**
   * Opens the Settings window
   */
  openSettings: function() {
    APP.log("debug", "APP.openSettings");

    APP.addChild("settings", {}, true);
  },
  /**
   * Closes all non-tab stacks
   */
  closeSettings: function() {
    if(APP.modalStack.length > 0) {
      APP.removeChild(true);
    }
  },
  /**
   * Toggles the Slide Menu
   */
  toggleMenu: function(_position) {
    if(APP.SlideMenuOpen) {
      APP.closeMenu();
    } else {
      APP.openMenu();
    }
  },
  /**
   * Opens the Slide Menu
   */
  openMenu: function() {
    APP.SlideMenu && (APP.SlideMenu.Wrapper.left = "0dp");
    APP.SlideMenu && APP.SlideMenu.Wrapper.setAccessibilityHidden(false);
    APP.GlobalWrapper && APP.GlobalWrapper.animate({
      left: "200dp",
      duration: 250,
      curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
    });

    APP.SlideMenuOpen = true;
  },
  /**
   * Closes the Slide Menu
   */
  closeMenu: function() {
    APP.GlobalWrapper && APP.GlobalWrapper.animate({
      left: "0dp",
      duration: 250,
      curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
    });
    APP.SlideMenu && APP.SlideMenu.Wrapper.setAccessibilityHidden(true);
    APP.SlideMenuOpen = false;
  },
  /**
   * Closes the Main window
   */
  closeMainWindow: function() {
    if (OS_ANDROID) APP.MainWindow.exitOnClose = false;
    APP.MainWindow.close();
    if (OS_ANDROID) APP.MainWindow.exitOnClose = true;
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
  alertCancel: function(_msg, _title, _okTitle, _cancelTitle) {
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

    // error avoid
    try {
      var db = Ti.Database.open(Titanium.App.id);

      var time = new Date().getTime();
      var type = UTIL.escapeString(_severity);
      var message = UTIL.escapeString(_text) + "/" + UTIL.escapeString(_text1) + "/" + UTIL.escapeString(_text2) + "/" + UTIL.escapeString(_text3) + "/" + UTIL.escapeString(_text4) + "/" + UTIL.escapeString(_text5);

      //db.execute("UPDATE log SET time = " + time + ", type = " + type + ", message = " + message + " WHERE time = (SELECT min(time) FROM log);");
      db.execute("INSERT INTO log (time, type, message) VALUES (" + time + ", " + type + ", " + message + ");");
      db.close();
    } catch (e) {
      if (db) db.close();
    }
  },
  /**
   * Sends the log files via e-mail dialog
   */
  logSend: function() {
    var db = Ti.Database.open(Titanium.App.id);
    var data = db.execute("SELECT * FROM log WHERE message != \"\" ORDER BY time DESC;");

    var log = "\n\n=====\n\n" + APP.ID + " " + APP.VERSION + " (" + APP.DBVersion + ")\n" + APP.Device.os + " " + APP.Device.version + " (" + APP.Device.name + ") " + Ti.Platform.locale + "\n\n";

    while(data.isValidRow()) {
      log += "[" + data.fieldByName("type") + "] " + data.fieldByName("message") + "\n";

      data.next();
    }

    log += "\n=====";

    data.close();
    db.close();

    var email = Ti.UI.createEmailDialog({
      barColor: APP.Settings.colors.primary,
      subject: "Application Log",
      messageBody: log
    });

    if(email.isSupported) {
      email.open();
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

    if(APP.modalStack.length > 0) {
      APP.removeChild(true);

      return;
    } else {
      var stack;

      if(APP.Device.isHandheld || !APP.hasDetail) {
        stack = APP.controllerStacks[APP.currentStack];
      } else {
        stack = APP.detailStacks[APP.currentDetailStack];
      }

      if(stack.length > 1) {
        APP.removeChild();
      } else if (APP.previousStack > -1 && APP.currentStack == 99) {  // alarms 99
        APP.handleNavigation(APP.previousStack);
      } else {
        APP.MainWindow.close();
      }
    }
  },
  /**
   * alarms page open
   */
  openAlarms: function() {
    APP.handleNavigation(APP.Nodes.length - 1);
    _.defer(function() {
      APP.addChild("alarms", {isChild : true});
    });
  }
};

module.exports = APP;
