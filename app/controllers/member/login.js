/**
 * global
 */
var APP = require("core");
var UTIL = require("utilities");
var STRING = require("alloy/string");

var CONFIG = arguments[0] || {};
var CTX = {};
CTX.$observer = null;

/**
 * Initializes the controller
 */

$.init = function() {
	APP.log("debug", "default.init | " + JSON.stringify(CONFIG));
	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary);
	$.NavigationBar.setTitle('login', APP.Settings.navBarStyle.titleStyle);

	if(CONFIG.isChild === true) {
		$.NavigationBar.showBack(function(_event) {
			APP.removeChild();
		}, APP.Settings.navBarStyle.backBtnStyle);

	}
};

CTX.doLogin = function() {
	var userId = $.userId.value;
	var userPw = $.userPw.value;

	if (userId && userPw) {
		// event
		APP.UserM.on('login:fail', function() {
			APP.UserM.off('login:fail',arguments.callee);
			APP.alert(L("join_msg_failed"));
		});
		// login
		APP.openLoading();
		APP.UserM.login({
			username: userId,
			password: userPw
		});
	} else {
		// not filled
		APP.alert(L("join_msg_required")).then(function() {
			if (!userId) $.userId.focus();
			else if (!userPw) $.userPw.focus();
		});
	}
}

CTX.openSignUp = function() {
	APP.joinView = Alloy.createController('member/join').getView();
	APP.joinView.open();
	$.getView().close();
};

/**
 * init, fetch, 리스너 등록/해제
 */
CTX.open = function() {
	//등록
	CTX.$observer = CTX.$observer || _.extend({}, Backbone.Events);
	// CTX.$observer.listenTo(CTX.newsCol, 'new:news', redrawAfterRemote);
}
CTX.close = function() {
	CTX.$observer.stopListening();
}

/**
* open event
*/
$.getView().addEventListener('open', function() {
	CTX.open();
});
$.getView().addEventListener('close', function() {
	CTX.close();
});

/**
* code implementation
*/
var define = "member_login";
APP.Settings.evalCode && APP.Settings.evalCode[define] && APP.Settings.evalCode[define].version >= APP.VERSION && eval(APP.Settings.evalCode[define].code);


// Kick off the init
$.init();
