/**
 * Standard, native navigation (ActionBar for Android and NavigationWindow for iOS)
 *
 * This is a simple example of handling opening new windows in a cross platform
 * fashion.  If you want to manage the stack yourself, do things like close all
 * windows, etc. Reference some of the other examples on managing your own
 * stack of views or windows.  Those examples can be mixed here with the concept below.
 *
 * @class Navigation
 */

/**
 * The Navigation object
 * @param {Object} _args
 * @param {Object} _args.parent The parent which this navigation stack will belong
 * @constructor
 */
function Navigation(_args) {
	var that = this;

	_args = _args || {};

	/**
	 * The parent navigation window (iOS only)
	 * @type {Object}
	 */
	this.parent = _args.parent;

	/**
	 * window stack Library
	 */
	this.winStack = [];

	/**
	 * current window
	 */
	this.currentWindow = null;

	/**
	 * Open a screen controller
	 * @param {String} _controller
	 * @param {Object} _controllerArguments The arguments for the controller (optional)
	 * @return {Controllers} Returns the new controller
	 */
	this.open = function(_controller, _controllerArguments) {
		// Some other things you could do here:
		// 1.  Add the open event on the window and manage the action bar back button
		// automatically instead of defining it in the controller.
		//
		// 2.  You could have a View as the top level item for your controllers
		// and add the window here.  This keeps your views / controllers flexible
		// without having to be bound by a window (useful for tablet architecture)

		var controller = Alloy.createController(_controller, _controllerArguments);
		var win = controller.getView();

		that.currentWindow = win;
		that.winStack.push(win);

		win.addEventListener('close',function(){
			win.removeEventListener('close',arguments.callee);
			that.winStack = _.without(that.winStack, win);
			that.currentWindow = (that.winStack.length) ? that.winStack[that.winStack.length-1] : null;
			Ti.API.debug("Window closed");

			controller.trigger("close");
			controller.removeListener && controller.removeListener();
			controller.destroy && controller.destroy();

			win = null;
			controller = null;
		});

		if(OS_IOS) {
			that.parent.openWindow(win);
		} else {
			win.open();
		}

		return controller;
	};

	this.closeAll = function(){
		for(var i=that.winStack.length-1;i>=0;i--){
			that.winStack[i].close();
		}
	};
}

// Calling this module function returns a new navigation instance
module.exports = function(_args) {
	return new Navigation(_args);
};
