/**
 * ACS push notification class
 *
 * @class push.acs
 * @uses core
 * @uses push
 * @uses Modules.ti.cloudpush
 */
var APP = require("core");
var PUSH = require("push");

var ParsePush = (OS_IOS) ? require('push/parseIOS') : require('eu.rebelcorp.parse');
var installation = Alloy.Models.instance('Installation');

if(OS_ANDROID) {
  /**
   * Registers an Android device for push notifications
   * @param {Function} _callback The function to run after registration is complete
   * @platform Android
   */
  var registerAndroid = function(_callback) {
    //instllationId
    ParsePush.addEventListener('installationId', function(e) {
      APP.SettingsM.set('Installation_objectId', e.objectId || e.installationId).save();

      APP.log("debug", "Parse.registerAndroid @success / Installation_objectId : ", APP.SettingsM.get('Installation_objectId'));
      afterRegisterDevice(_callback);
    });

    ParsePush.start();

    //푸쉬알림 도착에 대한 반응.
    ParsePush.addEventListener('notificationreceive', function(e) {
      PUSH.pushRecieved(e);
    });
    //푸쉬 알림을 클릭했을 때의 반응
    ParsePush.addEventListener('notificationopen', function(e) {
      PUSH.pushRecieved(e, true); //isClick
    });

    //앱을 켰으니 푸시를 다 지워주자
    exports.notificationClear();
  };
}

if(OS_IOS) {
  var onRegistError = function(e){
    // APP.alert('Fail to registered parse push');
    APP.log("debug", "Parse.registeriOS @error");
    APP.log("trace", JSON.stringify(e));
  };

  var onRegistSuccess = function(e, _callback) {
    APP.log("debug", "Parse.registeriOS / onRegistSuccess");
    //e.deviceToken save
    APP.SettingsM.set('Installation_deviceToken', e.deviceToken).save();
    //installation model save
    ParsePush.start({'deviceToken': e.deviceToken, 'installationId': APP.SettingsM.get('Installation_objectId')}, {
      success : function(){
        APP.SettingsM.set('Installation_objectId', installation.id).save();
        APP.log("debug", "Parse.registeriOS @success / Installation_objectId : ", APP.SettingsM.get('Installation_objectId'));

        afterRegisterDevice(_callback);
      },
      error: onRegistError
    });
  };

  /**
   * Registers an iOS device for push notifications
   * @param {Function} _callback The function to run after registration is complete
   * @platform iOS
   */
  var registeriOS = function(_callback) {
    APP.log("debug", "PUSH.registeriOS");

    if (OS_IOS && parseInt(Ti.Platform.version.split(".")[0]) >= 8) {

      // Wait for user settings to be registered before registering for push notifications
      Ti.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {

        // Remove event listener once registered for push notifications
        Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush);

        Ti.Network.registerForPushNotifications({
          success: function(e){
            onRegistSuccess(e, _callback);
          },
          error: function(e){
            onRegistError(e);
          },
          callback: receivePush
        });
      });

      // Register notification types to use
      APP.log("debug", "PUSH.registeriOS : iOS 8+");
      Ti.App.iOS.registerUserNotificationSettings({
        types: [
          Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
          Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
          Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE
        ]
      });
    } else {  // For iOS 7 and earlier
      APP.log("debug", "PUSH.registeriOS : iOS 7-");
      Ti.Network.registerForPushNotifications({
        // Specifies which notifications to receive
        types: [
          Ti.Network.NOTIFICATION_TYPE_BADGE,
          Ti.Network.NOTIFICATION_TYPE_ALERT,
          Ti.Network.NOTIFICATION_TYPE_SOUND
        ],
        success: function(e){
          onRegistSuccess(e, _callback);
        },
        error: function(e){
          onRegistError(e);
        },
        callback: receivePush
      });
    }
  };

  /**
   * when received push notifications
   * @param {String} mst Received push content
   * @platform iOS
   */
  function receivePush(msg) {
    msg = msg.data;
    if (Alloy.Globals.appOnline) {
      //앱이 온라인 일때 온 푸시
      if(!APP.UserM || !APP.UserM.id){
        // 로긴전인 상태인데 푸시가 온경우
        Ti.App.addEventListener('login:init', _loginInit);
        function _loginInit() {
          PUSH.pushRecieved(msg, false);
          Ti.App.removeEventListener('login:init', _loginInit);
        };
      }else{
        PUSH.pushRecieved(msg, false);
      }
    } else {
      //앱이 오프라인 일때 온 푸시는 그걸 눌렀을때만 푸시 콜백이 발생
      if(!APP.UserM || !APP.UserM.id){
        // 로긴전인 상태인데 푸시가 온경우
        Ti.App.addEventListener('login:init', _loginInit);
        function _loginInit() {
          PUSH.pushRecieved(msg, true);
          Ti.App.removeEventListener('login:init', _loginInit);
        };
      }else{
        PUSH.pushRecieved(msg, true);
      }
    }
  }
}

/**
 * After process for registering a device for push notifications
 * @param {Function} _callback The function to run after registration is complete
 */
function afterRegisterDevice(_callback) {
  // do
  _.defer(function() {
    // store referrer check
    referrerCheck();
  });

  // app start from push
  var msg = null;
  if(OS_ANDROID) {
    if (Titanium.App.Android.launchIntent && Titanium.App.Android.launchIntent.getStringExtra) {
      var notifyStr = Titanium.App.Android.launchIntent.getStringExtra('com.parse.Data');
      if (notifyStr) {
        msg = JSON.parse(notifyStr);
      }
    }
  }
  if (OS_IOS) {
    var launchOptions = Ti.App.getArguments();
    if (launchOptions.UIApplicationLaunchOptionsRemoteNotificationKey) {
      msg = launchOptions.UIApplicationLaunchOptionsRemoteNotificationKey;
    }
  }

  // clicked
  if (msg) {
    _.defer(function() {
      PUSH.pushRecieved(msg, true);
    });
  }

  // done
  _callback && _callback();
}

// store referrer check
function referrerCheck() {
  if (OS_ANDROID) {
    // run once
    if (APP.SettingsM.get('Installation_referrer')) return;

    var andinstreferrer = require('ti.andinstreferrer');
    var referrer = andinstreferrer.getReferrer();
    APP.log("debug", "andinstreferrer", "getReferrer", referrer);
    if (referrer) {
      referrerSave(referrer);
    } else {
      // event
      andinstreferrer.addEventListener('onReceive', function(e) {
        APP.log("debug", "andinstreferrer", "onReceive", e.referrer);
        referrerSave(e.referrer);
      });
    }
  }
}

// store referrer save
function referrerSave(referrer) {
  if (!referrer) return;
  // parse
  var referrerObj = getUrlParams("&" + decodeURIComponent(referrer));
  // save
  installation._save({
    "utm_source": referrerObj.utm_source,
    "utm_medium": referrerObj.utm_medium,
    "utm_term": referrerObj.utm_term,
    "utm_content": referrerObj.utm_content,
    "utm_campaign": referrerObj.utm_campaign,
    "referrer": referrer
  }).then(function() {
    APP.log("debug", "andinstreferrer", "referrerSave : sucess");
    // keep for running once
    APP.SettingsM.set('Installation_referrer', referrer).save();
  }, function(error) {
    APP.log("error", "andinstreferrer", "referrerSave :", error);
  });
}

function getUrlParams(str) {
  var params = {};
  str.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) { params[key] = value; });
  return params;
}

/**
 * Registers a device for push notifications
 * @param {Function} _callback The function to run after registration is complete
 */
exports.registerDevice = function(_callback) {
  APP.log("debug", "Parse.registerDevice");

  if(OS_IOS) {
    registeriOS(_callback);
  } else if(OS_ANDROID) {
    registerAndroid(_callback);
  }
};

/**
 * put value to parse installation object
 * @param {String} key Key
 * @param {String} value Value
 */
exports.put = function (key, value) {
  //ParsePush.putValue(key, value);
  var _attributes = {};
  _attributes[key] = value;
  return installation._save(_attributes);
};

/**
 * overwrite channels information to parse installation
 * @param {Array} channels Channels
 */
exports.overwriteChannels = function (channels) {
  if(!_.isArray(channels)) { channels = [channels]; }

  return installation.changeChannels(channels)
    .then(function (currentChannels) {
         return currentChannels;
    });
};

/**
 * add channels information to parse installation
 * @param {Array} channels Channels
 */
exports.subscribeChannels = function (channels) {
  if(!_.isArray(channels)) { channels = [channels]; }
  var currentChannels = installation.get("channels");
  if (!currentChannels) { currentChannels = []; }

  for(var i=0,max=channels.length; i<max; ++i) {
    var channel = channels[i];
    if(!_.contains(currentChannels, channel)) {
      currentChannels.push(channel);
    }
  }

  return installation.changeChannels(currentChannels)
    .then(function () {
         return currentChannels;
    });
};

/**
 * unsubscribe channels to parse installation
 * @param {Array} channels Channels
 */
exports.unsubscribeChannels = function (channels) {
  if(!_.isArray(channels)) { channels = [channels]; }
  var currentChannels = installation.get("channels");
  if (!currentChannels) { currentChannels = []; }

  for(var i=0,max=channels.length; i<max; ++i) {
    var channel = channels[i];
    if(_.contains(currentChannels, channel)) {
      currentChannels =  _.without(currentChannels, channel)
    }
  }

  return installation.changeChannels(currentChannels)
    .then(function () {
         return currentChannels;
    });
};

/**
 * remove installation - user link
 */
exports.unSetUserInfo = function() {
  // ParsePush.putValue('User_objectId', '');
  return installation._save({'User_objectId': ''});
};

/**
 * set instllation - user link, for user defined push
 * @param {Object} userM User backbone model
 */
exports.setUserInfo = function(userM, errorCount) {
  if (!errorCount) errorCount = 0;

  APP.log("debug", "Installation setUserInfo : " + APP.SettingsM.get('Installation_objectId'));
  if (APP.SettingsM.get('Installation_objectId')) {
    installation.getByObjectId(APP.SettingsM.get('Installation_objectId'))
    .then(function() {
      APP.log("debug", "Installation getByObjectId success : " + installation.id);

      APP.SettingsM.set('Installation_objectId', installation.id).save();
      // 로그인한 유저정보를 기록한다(User_objectId);
      installation._save({'User_objectId': userM.id}, {
        success: function() {
          APP.log("debug", "Installation setUserInfo success : " + APP.SettingsM.get('Installation_objectId') + ' / ' + installation.id + ' / ' + installation.get("User_objectId"));

          // 로컬의 default 설정값 없을 경우 default 데이터 설정.
          if(APP.SettingsM.get('Installation_channels_chat') === undefined){
            Ti.API.debug('settings 초기값 설정');
            //채팅알림, 공지/이벤트 알림, 방해금지시간설
            APP.SettingsM.save({
              Installation_channels_chat : true,
              Installation_channels_event : true
            });
            //인스톨레이션 채널 초기화
            exports.overwriteChannels(["Chat","Event","Answer"]);

            //전체 푸쉬 알림에 대한 초기화.
            _updateUser({'isPermissionAllPush' : true, 'isUsingBanTime' : true});
          }
        },
        error: function(error) {
          APP.log("error", "Installation User_objectId save fail : ", error);
        }
      });

      // badge update using installation
      Ti.App.fireEvent("changeBadge", {"number": exports.getBadge()});
    })
    .fail(function(error) {
      APP.log("error", "Installation fetch fail : ", APP.SettingsM.get('Installation_objectId'), error);

      // retry 5 count
      if (errorCount < 5) {
        errorCount++;
        APP.log("error", "Installation fetch Retry : " + errorCount + '/5');
        exports.setUserInfo(userM, errorCount);
      } else {
        APP.SettingsM.set('Installation_objectId', undefined).save();
      }
    });
  } else {
    APP.log("debug", "Installation_objectId not yet : " + APP.SettingsM.get('Installation_objectId'));
    // 없을때 change 이벤트 처리
    APP.SettingsM.on('change:Installation_objectId', function() {
      APP.UserM.off('change:Installation_objectId', arguments.callee);
      exports.setUserInfo(userM);
    });
  }

  function _updateUser(data) {
    //로컬에 반영

    //서버에 반영.
    Parse.pCloud.run('userModify', data, {
      success: function(result) {
        userM.set(data);
        Ti.API.debug('parsePush:UserModify success');
      },
      error: function(error) {
        //TOOD[faith] : 이전값 저장해두었다가 되돌리는 코드가필요함.
        Ti.API.debug('parsePush:UserModify error : ', error);
      }
    });
  };
};



/**
 * badge count get for parse installation
 */
exports.getBadge = function() {
  //installataion에도 badge수 저장
  if (OS_IOS) {
    var appBadge = Ti.UI.iPhone.getAppBadge();
    var insBadge = parseInt(installation.get('badge'));
    if (insBadge >= 0 && appBadge != insBadge) {
      Ti.UI.iPhone.setAppBadge(insBadge);
    }

    return Ti.UI.iPhone.getAppBadge();
  } else {
    var badge = parseInt(installation.get('badge')) || 0;
    return badge;
  }
};

/**
 * badge count set for parse installation
 * @param {Number} number Badge Number
 */
exports.setBadge = function(number) {
  //installataion에도 badge수 저장
  return installation._save({'badge': number});
};

/**
 * notification list clearing
 * @param {Number} number Badge Number
 */
exports.notificationClear = function () {
  if (OS_ANDROID) {
    ParsePush.notificationClear();
  }
}
