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
	$.NavigationBar.setTitle('', APP.Settings.navBarStyle.titleStyle);

	if(CONFIG.isChild === true) {
		$.NavigationBar.showBack(function(_event) {
			APP.removeChild();
		}, APP.Settings.navBarStyle.backBtnStyle);

	}
};

// fetch from parse
// STUDY : http://parseplatform.github.io/docs/js/guide/#queries
// {e} is pulltorefresh event
CTX.fetchGameScore = function(e) {
	var GameScore = Parse.Object.extend("GameScore");
	var query = new Parse.Query(GameScore);
	// query.equalTo("playerName", "Dan Stemkoski");
	query.find({
	  success: function(results) {
			APP.log("debug", "Successfully retrieved " + results.length + " scores.");
	    // Do something with the returned Parse.Object values
	    CTX.drawGameScore(results);

			if (e) e.hide();
	  },
	  error: function(error) {
			APP.log("error", "Error: " + error.code + " " + error.message);

			if (e) e.hide();
	  }
	});
};

// drawGameScore
CTX.drawGameScore = function(GameScoreCollection) {
	// using undersocre.js _.map function
	// STUDY : http://underscorejs.org/
	var GameScoreRows = _.map(GameScoreCollection, function (GameScoreModel){
    return CTX.createGameSCoreRow(GameScoreModel);
  });
  //값넣기.
  $.GameScoreSection.setItems(GameScoreRows);
};

// create listitem row
// STUDY : http://docs.appcelerator.com/platform/latest/#!/api/Titanium.UI.ListItem
CTX.createGameSCoreRow = function (GameScoreModel) {
  var _playerName = GameScoreModel.get('playerName');
  var _score = GameScoreModel.get('score');
	var _cheatMode = GameScoreModel.get('cheatMode') ? "TRUE" : "FALSE";
  return  {
    template : 'GameScoreTemplate',
    playerName : { text: _playerName },
		score : { text: _score },
		cheatMode : { text: _cheatMode },
    properties : {
        itemId : GameScoreModel.id
    }
  };
}

/**
* scroll end for position save
*/
CTX.listViewScrollend = function (e) {
  if (OS_IOS) {
    CTX.scrollItemIndex = e.firstVisibleItemIndex + e.visibleItemCount;
  } else {
    CTX.scrollItemIndex = e.firstVisibleItemIndex;
  }
  CTX.lastVisibleItemIndex = e.firstVisibleItemIndex + e.visibleItemCount;
};

/**
 * init, fetch, 리스너 등록/해제
 */
CTX.open = function() {
	//등록
	CTX.$observer = CTX.$observer || _.extend({}, Backbone.Events);
	// CTX.$observer.listenTo(CTX.newsCol, 'new:news', redrawAfterRemote);

	CTX.fetchGameScore();
}
CTX.close = function() {
	CTX.$observer.stopListening();
}

/**
* handleNavigation event
*/
CTX.handleNavigation = function (e) {
  if (e.name == "listview/pulltorefresh") {
    handleNavigation(e);
  } else if (APP.previousType == "listview/pulltorefresh") {
    _.defer(handleNavigation, e);
  }

  function handleNavigation(e) {
    if (e.name == "listview/pulltorefresh") {
      CTX.open();
    }

    // pullToRefresh
    if (OS_ANDROID || (OS_IOS && !CTX.pullToRefresh)) {
      $.mainView.removeAllChildren();
      if (CTX.ptr) {
        CTX.ptr.removeView($.listView);
        CTX.ptr.destroy();
        CTX.ptr = null;
      }
      if (e.name == "listview/pulltorefresh") {
        CTX.pullToRefresh = true;

        CTX.ptr = Alloy.createWidget("nl.fokkezb.pullToRefresh", "widget", {
          id: "ptr",
          children: [ $.listView ]
        });
        CTX.ptr.setParent($.mainView);
        CTX.ptr.on("release", CTX.fetchGameScore);

        // restore position
        if (CTX.scrollItemIndex) {
          $.listView.scrollToItem(1, CTX.scrollItemIndex, {animated:false});
        }
      }
    }
  }
}

/**
* open event
*/
Ti.App.addEventListener('handleNavigation', CTX.handleNavigation);

/**
* code implementation
*/
var define = "listview_pulltorefresh";
APP.Settings.evalCode && APP.Settings.evalCode[define] && APP.Settings.evalCode[define].version >= APP.VERSION && eval(APP.Settings.evalCode[define].code);


// Kick off the init
$.init();

//! required exports.open, exports.close
exports.open = CTX.open;
exports.close = CTX.close;
