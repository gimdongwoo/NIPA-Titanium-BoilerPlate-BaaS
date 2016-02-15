/**
 * Configuration file update class
 *
 * @class update
 * @uses core
 * @uses http
 */
var APP = require("core");
var HTTP = require("http");

/**
 * The number of items in the manifest
 * @ignore
 */
var manifestCount = 0;

/**
 * The function to run after the new data has been processed
 * @ignore
 */
var onComplete;

/**
 * Updates the app.json from a remote source
 * @param {Object} _params The parameters for the function, used to force an update
 * @param {String} _params.url The URL to retrieve the new configuration file from
 * @param {Function} _params.callback The function to run on data retrieval
 * @ignore
 */
exports.init = function(_params) {
	APP.log("debug", "UPDATE.init");

	if(_params) {
		HTTP.request({
			timeout: 10000,
			type: "GET",
			format: "DATA",
			url: _params.url,
			success: exports.handleUpdate,
			passthrough: _params.callback
		});
	} else if(APP.ConfigurationURL) {
		if(!Ti.App.Properties.getBool("OUTDATED", false)) {
			HTTP.request({
				timeout: 10000,
				type: "GET",
				format: "json",
				url: APP.ConfigurationURL,
				success: exports.handleUpdate
			});
		} else {
			// Un-supported configuration file, die
			APP.log("error", "Configuration file not supported by this version");
		}
	}
};

/**
 * Handles the update with the new configuration file
 * @param {String} _data The response data
 * @param {String} _url The URL we requested
 * @param {Function} _callback The optional callback function, used to force an update
 */
exports.handleUpdate = function(_data, _url, _callback) {
	APP.log("debug", "UPDATE.handleUpdate");

	// application version check
	verifyAppVersion(_data);

	// Determine if this is the same version as we already have
	//var data = JSON.parse(_data);
	var data = _data;

	if(typeof _callback === "undefined") {
		if(data.cVersion <= APP.CVERSION) {
			// We already have it
			APP.log("info", "Application is up-to-date");

			return;
		}
	}

	// Determine if this configuration file is supported by installed version
	if(!Ti.App.Properties.getBool("OUTDATED", false)) {
		// counfiguration file version check
		var current = parseInt(Ti.App.Properties.getString("CVERSION", APP.CVERSION).replace(/[^0-9]/g, ""), 10);
		var minimum = parseInt(data.cMinimumVersion.replace(/[^0-9]/g, ""), 10);

		if(minimum > current) {
			// Un-supported configuration file, die
			APP.log("error", "Configuration file not supported by this version");

			// Don't prompt the user again
			Ti.App.Properties.setBool("OUTDATED", true);

			// Alert the user about the error updating
			var dialog = Ti.UI.createAlertDialog({
				// title: "Update Available",
				title: L('c_alertUpdateTitle'),
				// message: "Please downloaded the latest version of this application"
				message: L('c_alertRequestReinstall')
			});

			dialog.show();

			return;
		}
	}

	// Write JSON file
	var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, Ti.App.Properties.getString('Configuration_File'));

	if (file.write(JSON.stringify(_data)) === false) {
		APP.log("error", "Downloaded Configuration File Write Fail");
	}
	file = null;

	if(typeof _callback === "undefined") {
		onComplete = function() {
			// Alert the user about the update
			var dialog = Ti.UI.createAlertDialog({
				title: L('c_updateAlertTitle', "Content Update Available"),
				message: L('c_updateAlertMsg', "New content has been downloaded."),
				ok: L('c_alertMsgOk', "OK"),
			});

			dialog.addEventListener("click", function(_event) {
				APP.log("info", "Update accepted");
				APP.closeLoading();
				APP.rebuild();
			});

			dialog.show();
		};
	} else {
		onComplete = _callback;
	}

	// Grab the items from the manifest
	if(data.manifest && data.manifest.length) {
		exports.downloadManifest(data.manifest);
	} else {
		onComplete();
	}
};

/**
 * Retrieves remote items
 * @param {Array} _items An array of items from the manifest
 */
exports.downloadManifest = function(_items) {
	APP.log("debug", "UPDATE.downloadManifest");

	// Keep track of how many items are in the manifest
	manifestCount = _items.length;

	// Write manifest files
	for(var i = 0, x = manifestCount; i < x; i++) {
		HTTP.request({
			timeout: 10000,
			type: "GET",
			format: "DATA",
			url: _items[i],
			success: exports.handleManifestItem
		});
	}
};

/**
 * Stores remote items locally
 * @param {String} _data The content of the item we downloaded
 * @param {String} _url The URL of the item we downloaded
 */
exports.handleManifestItem = function(_data, _url) {
	APP.log("debug", "UPDATE.handleManifestItem");

	// Determine file name
	var filename = _url.substring(_url.lastIndexOf("/") + 1);

	// Write manifest file
	var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, filename);
	file.write(_data);
	file = null;

	manifestCount--;

	if(manifestCount === 0) {
		onComplete();
		onComplete = null;
	}
};

/**
* application version check
* @param {Object} data : counfiguration file object
*/
function verifyAppVersion(_data) {
	var Version = defineVersion();
	var currentVersion = new Version(Titanium.App.version);

	var vconf = {};
	if (OS_IOS) {
		vconf = _data.appVersion.ios;
	} else {
		vconf = _data.appVersion.android;
	}

	var minVersion = new Version(vconf.minVersion);
	var recentVersion = new Version(vconf.recentVersion);
	var requestVersion = new Version(vconf.requestVersion);

	APP.log("debug", "verifyAppVersion : ", currentVersion, minVersion, recentVersion, requestVersion);

	// minVersion
	if(currentVersion.isLessThan(minVersion)) {
		var dialog = Ti.UI.createAlertDialog({
			ok: 0,
			buttonNames: ['ok'],
			message: L("c_alertRequestReinstall")
		});
		dialog.addEventListener('click', function(e){
			//종료
			if(OS_IOS){
				// block use
				APP.openLoading(L('c_alertRequestReinstall'));
			}else{
				var activity = Titanium.Android.currentActivity;
				activity.finish();
			}
		});
		dialog.show();
		return;
	}
	// requestVersion
	if(currentVersion.isLessThan(requestVersion)) {
		var dialog = Ti.UI.createAlertDialog({
			ok: 0,cancel: 1,
			buttonNames: [L('c_updateConfirmYes'), L('c_updateConfirmNo')],
			message: L("c_updateConfirmMessage")
		});
		dialog.addEventListener('click', function(e){
			if (e.index === e.source.cancel){
				//
			}
			if (e.index === e.source.ok){
				Ti.Platform.openURL(vconf.updateUrl);
			}
		});
		dialog.show();
		return;
	}
	// recentVersion toast message
	if((currentVersion.isGreaterThan(requestVersion)) && (currentVersion.isLessThan(recentVersion)) ){
		// only Android, iOS none...
		// Your app includes an update button or alerts the user to update the app. To avoid user confusion, app version updates must utilize the iOS built-in update mechanism.
		if (OS_ANDROID) {
			APP.showToast('c_alertNewVersion');
		}
		return;
	}
}

/**
* Version Diff Object
*/
function defineVersion() {
	//major minor  patch build로 구분하여. 비교를 수행함.
	var Version = function(versionStr) {
		//각부분 할당.
		if(_.isNumber(versionStr)) versionStr = versionStr.toString();
		var numbers = versionStr.split(".");
		//비교에 사용됨. 정해지지않은 경우는 기본값 0
		this.major = numbers[0] ? Number(numbers[0]) : 0;
		this.minor = numbers[1] ? Number(numbers[1]) : 0;
		this.patch = numbers[2] ? Number(numbers[2]) : 0;
		this.build = numbers[3] ? Number(numbers[3]) : 0;
	}

	//왼쪽이 더 작은지 확인
	Version.prototype.isLessThan = function (rVersion) {
		//major부터 순차적으로 하나씩 체크.
		//두가지 크고 작음에 대한 return 판단을 하고, 그 아래상황은 같을경우에 발생되는것.
		if(this.major < rVersion.major) return true;
		if(this.major > rVersion.major) return false;

		if(this.minor < rVersion.minor) return true;
		if(this.minor > rVersion.minor) return false;

		if(this.patch < rVersion.patch) return true;
		if(this.patch > rVersion.patch) return false;

		if(this.build < rVersion.build) return true;
		if(this.build > rVersion.build) return false;



		//모든 경우가 아닌 것은 두 버전이 같은 경우. less이므로 false
		return false;
	};
	//왼쪽이 더 큰지 확인
	Version.prototype.isGreaterThan = function (rVersion) {
		//major부터 순차적으로 하나씩 체크.
		//두가지 크고 작음에 대한 return 판단을 하고, 그 아래상황은 같을경우에 발생되는것.
		if(this.major > rVersion.major) return true;
		if(this.major < rVersion.major) return false;

		if(this.minor > rVersion.minor) return true;
		if(this.minor < rVersion.minor) return false;

		if(this.patch > rVersion.patch) return true;
		if(this.patch < rVersion.patch) return false;

		if(this.build > rVersion.build) return true;
		if(this.build < rVersion.build) return false;



		//모든 경우가 아닌 것은 두 버전이 같은 경우. less이므로 false
		return false;
	}
	//둘이 같은 버전인지 확인
	Version.prototype.isEqual = function (rVersion) {
		//major부터 순차적으로 하나씩 체크.
		if(this.major == rVersion.major &&
			this.minor == rVersion.minor &&
			this.patch == rVersion.patch &&
			this.build == rVersion.build) {

			return true;
		}else{
			return false;
		}
	}

	////
	return Version;
}
