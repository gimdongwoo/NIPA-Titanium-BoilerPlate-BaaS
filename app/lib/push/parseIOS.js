/**
 * Push notification iOS service
 * origin from https://github.com/timanrebel/Parse
 * @class parseIOS
 * @uses parse
 */

var installation = Alloy.Models.instance('Installation');

var iosPushService = module.exports = {};

/**
 * resist installation for parse
 * @param {String} dToken Device token
 * @param {Object} option model option parmeter
 */
iosPushService.start = function(param, option){
	// installation model을 저장하기
	// 필수 타입[ios] : deviceType, 	deviceToken
	// 필수 타입[android] : deviceType, deviceToken, // gcm시 pushType과 gcmsenderid도.
	var args = {
		deviceType : "ios",
		appName: Ti.App.name,
		appVersion: Ti.App.version,
		appIdentifier : Ti.App.id,
		deviceToken: param.deviceToken,
    parseVersion : "rest",
    installationId: param.installationId
	};

	return installation.save(args, option);
};

/**
 * set single value to installation model
 * @param {String} key Key
 * @param {String} value Value
 */
iosPushService.putValue = function (key, value) {
	// installation model에 값 지정해서 저장하기
	return installation.set(key, value).save();
};

/**
 * deprecated
 * @param {String} argument
 */
iosPushService.authenticate = function (argument) {
	// void
};

/**
 * deprecated
 * @param {String} argument
 */
iosPushService.subscribeChannel = function (channel) {
	// void
};

/**
 * deprecated
 * @param {String} argument
 */
iosPushService.unsubscribeChannel = function (channel) {
	// void
};
