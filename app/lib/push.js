/**
 * Push notification class
 *
 * @class push
 * @uses core
 */
var APP = require("core");

/**
 * The device token
 * @type String
 */
exports.deviceToken = null;

/**
 * Initializes the push notifications based on selected vendor
 * @param {Function} _callback The callback to run after device registration
 */
var vendorInit = function(_callback) {
	if(APP.Settings.notifications.provider === "ACS") {
		require("push/acs").registerDevice(_callback);
	}

	if(APP.Settings.notifications.provider === "UA") {
		require("push/ua").registerDevice(_callback);
	}

	if(APP.Settings.notifications.provider === "Parse") {
		require("push/parse").registerDevice(_callback);
	}
};

/**
 * Registers the app for push notifications
 */
exports.init = function() {
	APP.log("debug", "PUSH.init");

	vendorInit(function() {
		APP.log("debug", "PUSH.init @success");
	});
};

/**
 * The function to run after a push has been received
 * @param {Object} _data The push data received
 * @param {Boolean} isClick Defined user action
 */
exports.pushRecieved = function(_data, isClick) {
	APP.log("debug", "push.pushReceived");
	APP.log("trace", JSON.stringify(_data));

	var payload = null;

	if(APP.Settings.notifications.provider === "Parse") {
		payload = _data;
	} else {
		if(_data.data) {
			payload = _data.data;
		} else if(_data.payload) {
			payload = JSON.parse(_data.payload);
			payload.alert = payload.android.alert;
		} else {
			return;
		}
	}

	// silent pushReceived
	// {"alert":"","content-available":1}
	if (payload["content-available"]) {
		APP.log("debug", "stop pushRecieved / silent push");
		return;
	}

	// Alram colleciton re-fetch
	if (APP.UserM.id) {
		Alloy.Collections.instance('Alarms').fetch({ query: { where : { UserId : APP.UserM.id } } });
	}

	if (!isClick) {
		// 1분 이내에 온것만 푸시로 띄우자 (쌓여있는거 무시하기)
		var now = new Date();
		var created = new Date(payload.createdAt);
		var intervalMs = now.getTime() - created.getTime();
		var intervalMin = Math.floor(intervalMs / (1000 * 60) );
		if (intervalMin < 1) {
			// display push message
			var dialog = Ti.UI.createAlertDialog({
				title: L('push_TitleMsg', "Push Notification"),
				message: payload.alert,
				buttonNames: [L('push_okReadBtn', "OK"), L('c_alertMsgCancel', "Cancel")],
				cancel: 1
			});
			dialog.addEventListener('click', function(e){
				APP.closeLoading();
				if (OS_ANDROID) exports.notificationClear();

				if (e.index === e.source.cancel){
					// nothing
				} else {
					// alarm screen open
					APP.alarmContainer = payload;
					APP.openAlarms();
				}
			});
			dialog.show();
		}
	} else {
		// alarm screen open
		APP.alarmContainer = payload;
		APP.openAlarms();
	}

	// badge
	if (payload.badge && _.isNumber(payload.badge)) {
		exports.setBadge(parseInt(payload.badge));
	} else if (payload.badge && payload.badge == "Increment") {
		exports.setBadge("+1");
	}
};

/**
 * badge get
 */
exports.getBadge = function() {
	if(APP.Settings.notifications.provider === "Parse") {
		return require("push/parse").getBadge();
	} else {
		return (OS_IOS) ? Ti.UI.iPhone.getAppBadge() : 0;
	}
};

/**
 * badge set
 * @param {String/Integer} number : badge number
 */
exports.setBadge = function(number) {
	APP.log("debug", "push.setBadge number :", number);
	//installataion에도 badge수 저장
	if(APP.Settings.notifications.provider === "Parse") {
		// string이면 기존 숫자에 가감을 하고, integer면 바로 반영을 합니다.
		if( _.isString(number) ){
			var nowBadge = require("push/parse").getBadge();
			number =  nowBadge + parseInt(number);
			number = (number<0)? 0: number;
		}

		require("push/parse").setBadge(number);
	}

	// to Integer
	var badge = parseInt(number) || 0;
	if (OS_IOS) {
		Ti.UI.iPhone.setAppBadge(badge);
	}
	Ti.App.fireEvent("changeBadge", {"number": badge});
};

/**
 * set instllation - user link, for user defined push
 * @param {Object} userM User backbone model
 */
exports.setUserInfo = function(userM) {
	if(APP.Settings.notifications.provider === "Parse") {
		require("push/parse").setUserInfo(userM);
	}
}

/**
 * remove installation - user link
 */
exports.unSetUserInfo = function() {
	if(APP.Settings.notifications.provider === "Parse") {
		require("push/parse").unSetUserInfo(userM);
	}
};

/**
 * notification list clearing
 */
exports.notificationClear = function() {
	if(APP.Settings.notifications.provider === "Parse") {
		require("push/parse").notificationClear();
	}
}
