/**
 * Main application controller
 *
 * **NOTE: This controller is opened first upon application start and
 * initializes the core application code (`APP.init`). This controller
 * also sets UI elements to global scope for easy access.**
 *
 * @class Controllers.index
 * @uses core
 */

// Pull in the core APP singleton
var APP = require("core");

// Make sure we always have a reference to global elements throughout the APP singleton
APP.MainController = $;
APP.Tabs = createTabs();
APP.MainWindow = createMainWindow();
APP.GlobalWrapper = createGlobalWrapper();
APP.ContentWrapper = createContentWrapper();
//APP.SlideMenu = $.SlideMenu;
// APP.centerActionBtn = $.centerActionBtn;

// Start the APP
APP.init();

/**
* UI helper : MainWindow
*/
function createMainWindow() {
  if (OS_IOS) {
    var UI = {
      el: $.MainTapGroup,
      isOpen: false,
      init: function() {
        this.addEventListener = this.el.addEventListener;
        this.removeEventListener = this.el.removeEventListener;
        //
        return this;
      },
      open: function() {
        this.el.open();
        this.isOpen = true;
        APP.Tabs.open();
      },
      close: function() {
        APP.Tabs.close();
        this.isOpen = false;
        this.el.close();
      },
      add: function(_screen) {
        if (!_screen) return;
        var win = Ti.UI.createWindow({navBarHidden: true});
        _screen.addEventListener('close',function(){
          _screen.removeEventListener('close',arguments.callee);

          win.remove(_screen);
          win.close();
          win = null;
        });
        win.add(_screen);
        win.open();
      },
      remove: function(_screen) {
        _screen && _screen.fireEvent('close');
      },
      openWindow: function(win, options) {
        // this.el.activeTab.open(win, options);
        win.open(options);
      },
      addEventListener: null,
      removeEventListener: null
    };

    return UI.init();
  }

  if (OS_ANDROID) {
    return $.MainWindow;

    var UI = {
      el: $.MainWindow,
      init: function() {
        this.add = this.el.add;
        this.remove = this.el.remove;
        this.addEventListener = this.el.addEventListener;
        this.removeEventListener = this.el.removeEventListener;
        //
        return this;
      },
      open: function() {
        this.el.open();
      },
      close: function() {
        this.el.close();
      },
      add: null,
      remove: null,
      addEventListener: null,
      removeEventListener: null
    };

    return UI.init();
  }
}

/**
* UI generate : Tabs
*/
function createTabs() {
  if (OS_IOS) {
    var UI = {
      el: null,
      Wrapper: null,
      TabbarWindow: null,
      Tabs: [],
      inWindows: [],
      windowBottom: 50,
      isOpen: false,
      init: function(options) {
        // rebuild
        if (this.el == null) {
          this.el = Alloy.createWidget("com.mcongrove.tabs");
          options && this.el.init(options);
          this.Wrapper = this.el.Wrapper;
          this.clear = this.el.clear;
          // create tabbar window
          this.TabbarWindow = this.createTabbarWindow();
          //open
          this.open();
        } else {
          options && this.el.init(options);
        }

        // add tabs
        options && this.initTabs(options);
        return this;
      },
      clear: null,
      setIndex: function(tabId) {
        if (_.isNumber(tabId)) this.Tabs[tabId].setActive(true);
        this.el.setIndex(tabId);
      },
      open: function() {
        if (APP.MainWindow && APP.MainWindow.isOpen) {
          this.TabbarWindow && this.TabbarWindow.open();
          this.isOpen = true;
        }
      },
      close: function() {
        this.isOpen = false;
        this.TabbarWindow && this.TabbarWindow.close();
      },
      show: function() {
        this.windowBottom = 50;

        // tabgroup windows bottom change
        for(var i = 0; i < this.inWindows.length; i++) {
          this.inWindows[i].bottom = this.windowBottom;
        }
        this.TabbarWindow && (this.TabbarWindow.height = this.Wrapper.height);

        // opened window
        APP.ContentWrapper.bottom(this.windowBottom);
      },
      hide: function() {
        this.windowBottom = 0;

        // tabgroup windows bottom change
        for(var i = 0; i < this.inWindows.length; i++) {
          this.inWindows[i].bottom = this.windowBottom;
        }
        (this.TabbarWindow && this.Wrapper) && (this.TabbarWindow.height = 0);
        this.isShow = false;

        // opened window
        APP.ContentWrapper.bottom(this.windowBottom);
      },
      createTabbarWindow: function() {
        var TabbarWindow = Ti.UI.createWindow({
      		height: this.Wrapper.height,
      		bottom: 0,
          navBarHidden: true
      	});
        TabbarWindow.add(this.Wrapper);
        return TabbarWindow;
      },
      initTabs: function(options) {
        this.Tabs = [];
        this.inWindows = [];
        // create tabs at tabgroup
        for(var i = 0; i < options.nodes.length; i++) {
          var node = options.nodes[i];
          // window
          var win = Ti.UI.createWindow({ top: 0, bottom: this.windowBottom, tabBarHidden: true, navBarHidden: true });
          this.inWindows.push(win);
          // tab
          var tab = Titanium.UI.createTab({ window:win });
          this.Tabs.push(tab);
        }
        $.MainTapGroup.setTabs(this.Tabs);
      }
    };

    return UI;
  }

  if (OS_ANDROID) {
    var UI = {
      el: null,
      Wrapper: null,
      GlobalWrapper: $.GlobalWrapper,
      ContentWrapper: $.ContentWrapper,
      init: function(options) {
        if (this.el == null) {
          this.el = Alloy.createWidget("com.mcongrove.tabs");
          options && this.el.init(options);
          this.Wrapper = this.el.Wrapper;
          this.clear = this.el.clear;
          this.setIndex = this.el.setIndex;
          //open
          this.open();
        } else {
          options && this.el.init(options);
        }

        return this;
      },
      clear: null,
      setIndex: null,
      open: function() {
        this.GlobalWrapper.add(this.Wrapper);
      },
      close: function() {
        this.GlobalWrapper.remove(this.Wrapper);
      },
      show: function() {
        this.ContentWrapper.bottom = 50;
        this.Wrapper.height = 56;
      },
      hide: function() {
        this.ContentWrapper.bottom = 0;
        this.Wrapper.height = 0;
      }
    };

    return UI;
  }
}

/**
* UI helper : GlobalWrapper
*/
function createGlobalWrapper() {
  if (OS_IOS) {
    var UI = {
      el: $.MainTapGroup,
      init: function() {
        this.addEventListener = this.el.addEventListener;
        this.removeEventListener = this.el.addEventListener;
        return this;
      },
      animate: function(options) {
        // TODO tabgroup windows animiate

      },
      addEventListener: null,
      removeEventListener: null
    };

    return UI.init();
  }

  if (OS_ANDROID) {
    return $.GlobalWrapper;
  }
}

/**
* UI helper : ContentWrapper
*/
function createContentWrapper() {
  if (OS_IOS) {
    var UI = {
      el: $.MainTapGroup,
      winStack: [],
      init: function() {
        //
        return this;
      },
      add: function(_screen) {
        var that = this;
        if (!_screen) return;

        // 1st
        var controllerStack = APP.controllerStacks[APP.currentStack];
        if(controllerStack.length == 1) return APP.Tabs.inWindows[APP.currentStack].add(_screen);

        // open window
        var win = Ti.UI.createWindow({ top: 0, bottom: APP.Tabs.windowBottom, tabBarHidden: true, navBarHidden: true });
        this.winStack.push(win);
        // screen remove
        _screen.addEventListener('remove',function(){
          _screen.removeEventListener('remove',arguments.callee);

          win && win.remove(_screen);
          win && win.close();
        });
        win.add(_screen);
        // win close
        win.addEventListener('close',function(){
          win.removeEventListener('close',arguments.callee);
          that.winStack = _.without(that.winStack, win);

          if (_screen.isAdded) {
            APP.removeChild();
            win.remove(_screen);
          }
          win = null;
        });
        this.el.activeTab.open(win, {animated:true});
      },
      remove: function(_screen) {
        _screen && _screen.fireEvent('remove');
      },
      bottom: function(_bottom) {
        // tabgroup windows bottom change
        for(var i = 0; i < this.winStack.length; i++) {
          this.winStack[i].bottom = _bottom;
        }
      }
    };

    return UI.init();
  }

  if (OS_ANDROID) {
    return $.ContentWrapper;
  }
}
