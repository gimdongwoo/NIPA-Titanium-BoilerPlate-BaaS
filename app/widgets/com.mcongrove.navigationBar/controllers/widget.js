/**
 * The navigation bar widget
 *
 * @class Widgets.com.mcongrove.navigationBar
 */

/**
 * @member Widgets.com.mcongrove.navigationBar
 * @property {Object} CONFIG
 * @property {String} CONFIG.image The image to show in the navigation bar (optional)
 * @property {String} CONFIG.text The text to show in the navigation bar (optional)
 */
var CONFIG = arguments[0] || {};

var navigation, theme;
var deviceVersion = parseInt(Titanium.Platform.version.split(".")[0], 10);

if(CONFIG.image) {
  $.title = Ti.UI.createImageView({
    image: CONFIG.image,
    height: "26dp",
    width: Ti.UI.SIZE,
    top: "10dp",
    bottom: "10dp",
    preventDefaultImage: true
  });
} else {
  $.title = Ti.UI.createLabel({
    font: {
      fontSize: "18dp",
      fontFamily: "HelveticaNeue-Medium"
    },
    color: theme == "white" ? "#FFF" : "#000",
    textAlign: "center",
    text: CONFIG.text ? CONFIG.text : "",
    left: "40dp", right: "40dp"
  });
}

/**
 * Adds the navigation bar to the passed view
 * @param {Object} _view The view to add the navigation bar to
 */
$.addNavigation = function(_view) {
  navigation = _view;

  $.Wrapper.add(navigation);
};

/**
 * Removes the navigation bar from the passed view
 * @param {Object} _view The view to remove from the navigation bar
 */
$.removeNavigation = function() {
  $.Wrapper.remove(navigation);
};

/**
 * Sets the background color
 * @param {Object} _colorPrimary The hex color code (e.g. "#FFF") Navbar
 * @param {Object} _theme The theme to set manually (e.g. "white" or "black")
 * @param {Object} _colorSecondary The hex color code (e.g. "#FFF") Statusbar
 */
$.setBackgroundColor = function(_colorPrimary, _theme, _colorSecondary) {
  if (_colorSecondary) {
    $.overlay.backgroundColor = _colorPrimary;
    $.Wrapper.backgroundColor = _colorSecondary;
  } else {
    $.Wrapper.backgroundColor = _colorPrimary;
  }

  if (_theme) {
    theme = _theme;
  } else {
    // Checks the brightness of the background color, sets color of icons/text
    if(hexToHsb(_colorPrimary).b < 65) {
      theme = "white";
    } else {
      theme = "black";
    }
  }
};

/**
 * Sets the title
 * @param {Object} _text The title text
 */
$.setTitle = function(_text, _textStyle) {
  $.title.text = _text || "";
  if (_textStyle) $.title.applyProperties(_textStyle);
};


/**
 * set기존것 사용안하고 아에 새요소로 바꾸자.
 */
//$.titleView 사용안하고, 추가된 요소 사용함. 필요형태 만들어서 전달.
$.setViewCenter = function(titleView, top) {
  $.titleView.visible = false;
  
  $.centerWrap.add(titleView);
  $.centerWrap.top = (typeof top === "number") ? top : 3.5; // height 47 이고 40짜리가 가운데로.
  $.centerWrap.visible = true;
};
//싹지우고 붙여.
$.setViewRight = function(rightView, viewWidth) {
  $.rightWarp.removeAllChildren();
  $.rightWarp.width = viewWidth || 48;
  $.rightWarp.top = 3.5; // height 47 이고 40짜리가 가운데로.
  
  $.rightWarp.add(rightView);
};


/**
 * Shows the left button
 * @param {Object} _params
 * @param {Function} _params.callback The function to run on left button press
 * @param {String} _params.image The image to show for the left button
 */
$.showLeft = function(_params) {
  if(_params && typeof _params.callback !== "undefined") {
    $.left.width = "48dp";
    $.left.visible = true;
    $.leftImage.image = _params.image;

    $.left.addEventListener("click", _.debounce(_params.callback, 700, true));
  }
};

/**
 * Shows the right button
 * @param {Object} _params
 * @param {Function} _params.callback The function to run on right button press
 * @param {String} _params.image The image to show for the right button
 */
$.showRight = function(_params) {
  if(_params && typeof _params.callback !== "undefined") {
    $.right.width = "48dp";
    $.right.visible = true;
    $.rightImage.image = _params.image;

    $.right.addEventListener("click", _.debounce(_params.callback, 700, true));
  }
};
//이미지말고 문자삽입 위해 확장.
// TODO _붙인이름 다른형태와일치시켜야함.
$.showRightEx = function(_params) {
  if(_params._textProperties) {
    $.rightEx.visible = true;
    $.rightExText.applyProperties(_params._textProperties);
  }
  if(typeof _params._callback !== "undefined") {
    $.rightEx.addEventListener("click", _.debounce(_params._callback, 700, true));
  }
};

/**
 * add Custom View to Left Wrapper
 * @param {Object} _params
 * @param {Function} _params.callback The function to run on right button press
 * @param {String} _params.view The view to show
 */
$.addViewLeft = function(_params) {
  if(_params && typeof _params.callback !== "undefined") {
    $.leftWarp.add(_params.view);
    _params.view.addEventListener("click", _.debounce(_params.callback, 700, true));
  }
};

/**
 * add Custom View to Right Wrapper
 * @param {Object} _params
 * @param {Function} _params.callback The function to run on right button press
 * @param {String} _params.view The view to show
 */
$.addViewRight = function(_params) {
  if(_params && typeof _params.callback !== "undefined") {
    if(_params.backgroundView){
      $.rightWarp.layout = "composite";
    }
    // $.rightAdd.width = "48dp";
    // $.rightAdd.visible = true;
    _params.view && $.rightWarp.add(_params.view);
    _params.backgroundView && $.rightWarp.add(_params.backgroundView);
    _params.view.addEventListener("click", _.debounce(_params.callback, 700, true));
    _params.view.addEventListener("touchstart", function() {
      if(_params.backgroundView){
        _params.backgroundView.visible = true;
      }
    });
    _params.view.addEventListener("touchend", function() {
      // _params.callback && _params.callback();
      _.defer(function() {
        if(_params.backgroundView){
          _params.backgroundView.visible = false;
        }
      });
    });
  }
};

/**
 * Shows the back button
 * @param {Function} _callback The function to run on back button press
 */
$.showBack = function(_callback, _imageStyle) {
  if(_callback && typeof _callback !== "undefined") {
    if (_imageStyle) {
      $.backImage.applyProperties(_imageStyle);
    } else {
      $.backImage.image = theme == "white" ? WPATH("/images/white/back.png") : WPATH("/images/black/back.png");
    }
    $.back.width = "48dp";
    $.back.visible = true;

    $.back.addEventListener("click", _.debounce(_callback, 700, true));
    $.back.addEventListener("touchstart", function() {
      $.backBackground.visible = true;
    });
    $.back.addEventListener("touchend", function() {
      // _callback && _callback();
      _.defer(function() {
        $.backBackground.visible = false;
      });
    });
  }
};

/**
 * Shows the alarm button
 * @param {Function} _callback The function to run on back button press
 */
$.showAlarm = function(_callback, _imageStyle) {
  if(_callback && typeof _callback !== "undefined") {
    if (_imageStyle && _imageStyle.default) {
      $.alarmImage.applyProperties(_imageStyle.default);
    } else {
      $.alarmImage.image = "/images/nav_alram_.png";
    }
    var badge = require("push").getBadge() || 0;
    if (badge) {
      if (_imageStyle && _imageStyle.badge) {
        $.alarmImage.applyProperties(_imageStyle.badge);
      } else {
        $.alarmImage.image = "/images/nav_alram.png";
      }
    }
    $.alarm.width = "48dp";
    $.alarm.visible = true;

    $.alarm.addEventListener("click", _.debounce(_callback, 700, true));
    $.alarm.addEventListener("touchstart", function() {
      $.alarmBackground.visible = true;
    });
    $.alarm.addEventListener("touchend", function() {
      // _callback && _callback();
      _.defer(function() {
        $.alarmBackground.visible = false;
      });
    });
    // add events
    Ti.App.addEventListener('changeBadge', function(e){
      if (e.number == 0) {
        if (_imageStyle && _imageStyle.default) {
          $.alarmImage.applyProperties(_imageStyle.default);
        } else {
          $.alarmImage.image = "/images/nav_alram_.png";
        }
      } else {
        if (_imageStyle && _imageStyle.badge) {
          $.alarmImage.applyProperties(_imageStyle.badge);
        } else {
          $.alarmImage.image = "/images/nav_alram.png";
        }
      }
    });
  }
};

/**
 * Shows the next button
 * @param {Function} _callback The function to run on next button press
 */
$.showNext = function(_callback) {
  if(_callback && typeof _callback !== "undefined") {
    $.nextImage.image = theme == "white" ? WPATH("/images/white/next.png") : WPATH("/images/black/next.png");
    $.next.width = "48dp";
    $.next.visible = true;

    $.next.addEventListener("click", _.debounce(_callback, 700, true));
  }
};

/**
 * Shows the menu button
 * @param {Function} _callback The function to run on action button press
 */
$.showMenu = function(_callback) {
  if(_callback && typeof _callback !== "undefined") {
    $.showLeft({
      image: theme == "white" ? WPATH("/images/white/menu.png") : WPATH("/images/black/menu.png"),
      callback: _callback
    });
  }
};

/**
 * Shows the settings button
 * @param {Function} _callback The function to run on action button press
 */
$.showSettings = function(_callback) {
  if(_callback && typeof _callback !== "undefined") {
    $.showRight({
      image: theme == "white" ? WPATH("/images/white/settings.png") : WPATH("/images/black/settings.png"),
      callback: _callback
    });
  }
};

/**
 * Shows the action button
 * @param {Function} _callback The function to run on action button press
 */
$.showAction = function(_callback) {
  if(_callback && typeof _callback !== "undefined") {
    $.showRight({
      image: theme == "white" ? WPATH("/images/white/action.png") : WPATH("/images/black/action.png"),
      callback: _callback
    });
  }
};

/**
 * Converts a hex color value to HSB
 * @param {String} _hex The hex color to convert
 */
function hexToHsb(_hex) {
  var result;

  if(_hex.length < 6) {
    result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(_hex);
  } else {
    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(_hex);
  }

  var hsb = {
    h: 0,
    s: 0,
    b: 0
  };

  if(!result) {
    return hsb;
  }

  if(result[1].length == 1) {
    result[1] = result[1] + result[1];
    result[2] = result[2] + result[2];
    result[3] = result[3] + result[3];
  }

  var rgb = {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };

  rgb.r /= 255;
  rgb.g /= 255;
  rgb.b /= 255;

  var minVal = Math.min(rgb.r, rgb.g, rgb.b),
    maxVal = Math.max(rgb.r, rgb.g, rgb.b),
    delta = maxVal - minVal,
    del_r, del_g, del_b;

  hsb.b = maxVal;

  if(delta !== 0) {
    hsb.s = delta / maxVal;

    del_r = (((maxVal - rgb.r) / 6) + (delta / 2)) / delta;
    del_g = (((maxVal - rgb.g) / 6) + (delta / 2)) / delta;
    del_b = (((maxVal - rgb.b) / 6) + (delta / 2)) / delta;

    if(rgb.r === maxVal) {
      hsb.h = del_b - del_g;
    } else if(rgb.g === maxVal) {
      hsb.h = (1 / 3) + del_r - del_b;
    } else if(rgb.b === maxVal) {
      hsb.h = (2 / 3) + del_g - del_r;
    }

    if(hsb.h < 0) {
      hsb.h += 1;
    }

    if(hsb.h > 1) {
      hsb.h -= 1;
    }
  }

  hsb.h = Math.round(hsb.h * 360);
  hsb.s = Math.round(hsb.s * 100);
  hsb.b = Math.round(hsb.b * 100);

  return hsb;
}

if($.title) {
  $.titleView.add($.title);
}

// Move the UI down if iOS7+
if(OS_IOS && deviceVersion >= 7) {
  $.Wrapper.height = "67dp";
  $.overlay.top = "20dp";
}
