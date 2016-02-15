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
if(OS_IOS) {
	APP.navigationWindow = $.navWindow;
}
APP.MainController = $;
APP.MainWindow = $.MainWindow;
APP.GlobalWrapper = $.GlobalWrapper;
APP.ContentWrapper = $.ContentWrapper;
APP.Tabs = $.Tabs;
//APP.SlideMenu = $.SlideMenu;

// Start the APP
APP.init();

// APP.guideForChildren
Ti.App.addEventListener('handleNavigation', function(e){
	if (e.name == "children") {
		APP.guideForChildren = APP.guideForChildren || Alloy.createController('guideView',{parentView:APP.ContentWrapper, type:'children'});
		APP.guideForChildren.show(function() {
			APP.handleNavigation(2, 'isForceOpen');
		});
	}else{
		_.defer(function() {
			if(APP.guideForChildren){
				APP.guideForChildren.hide();
			}
		});
	}
});

// request storage permission
if (OS_ANDROID) {
	var requestStoragePermission = function() {
		var RSP = require("com.boxoutthinkers.reqstorageperm");
		if (!RSP.hasStoragePermission()) {
			RSP.requestStoragePermissions(function(e) {
				if (e.success) {
					// success
					Ti.API.info('requestStoragePermission : success');
				} else {
					Ti.API.error('requestStoragePermission : error');
				}
			});
		} else {
			Ti.API.info('requestStoragePermission : already have');
		}
	}
	// do
	requestStoragePermission();
}
