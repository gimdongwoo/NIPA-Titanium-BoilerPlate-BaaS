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

// Start the APP
$.MainTapGroup.open();
