/**
 * The tab bar widget
 *
 * @class Widgets.com.mcongrove.tabs
 */
var labels = [];
var icons = [];
var index = null;
var params = {};


/**
 * Initializes the tab bar
 * @param {Object} _params
 * @param {Array} _params.nodes The nodes (tab items) to show in the TabGroup as defined by the JSON configuration file
 * @param {String} _params.more The image for the "..." (more) tab
 * @param {Object} _params.color The colors to use for the tab bar
 * @param {String} _params.color.background The background of the tab bar (hex)
 * @param {String} _params.color.active The background of an active tab (hex)
 * @param {String} _params.color.text The tab text color (hex)
 */
$.init = function(_params) {
	$.nodes = [];
	$.excess = false;
	$.excessLength = 5;
	$.moreOpen = false;
	$.width = 0;
	$.display = {
		width: Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight ? Ti.Platform.displayCaps.platformHeight : Ti.Platform.displayCaps.platformWidth,
		height: Ti.Platform.displayCaps.platformWidth > Ti.Platform.displayCaps.platformHeight ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformHeight,
		dpi: Ti.Platform.displayCaps.dpi
	};

	//icon selected style
	params = _params;

	if(OS_ANDROID) {
		$.display.width = ($.display.width / ($.display.dpi / 160));
		$.display.height = ($.display.height / ($.display.dpi / 160));
	}

	if(Alloy.isTablet) {
		$.excessLength = Math.floor($.display.width / 70);
	}

	if(_params.nodes.length > $.excessLength) {
		$.excess = true;
	}

	$.width = $.excess ? Math.floor($.display.width / $.excessLength) : Math.floor($.display.width / _params.nodes.length);

	$.TabGroup.backgroundColor = _params.color.background;
	$.TabContainerMore.backgroundColor = _params.color.background;
	$.Indicator.backgroundColor = _params.color.active;
	$.IndicatorMore.backgroundColor = _params.color.active;

	$.IndicatorContainer.width = $.display.width + "dp";
	$.Indicator.width = $.width + "dp";
	$.IndicatorMore.width = $.width + "dp";
	$.TabContainer.width = $.display.width + "dp";
	$.TabGroupMore.width = $.display.width + "dp";
	$.TabContainerMore.width = $.width + "dp";

	for(var i = 0; i < _params.nodes.length; i++) {
		if($.excess && i == ($.excessLength - 1)) {
			addMoreTab(_params);
		}

		var tab = Ti.UI.createView({
			id: _params.nodes[i].id,
			width: $.width + "dp",
			height: "60dp",
			bottom: "0dp",
			left: "0dp"
		});

		var label = Ti.UI.createLabel({
			text: _params.nodes[i].title,
			top: "42dp",
			left: "5dp",
			right: "5dp",
			width: Ti.UI.FILL,
			height: "15dp",
			font: {
				fontSize: "10dp",
				fontWeight: "bold"
				//fontFamily: "HelveticaNeue"
			},
			color: _params.color.text,
			textAlign: "center",
			touchEnabled: false
		});
		if (_params.nodes[i].textOffStyle) {
			label.applyProperties(_params.nodes[i].textOffStyle);
		}
		tab.add(label);
		labels.push(label);

		var icon = {};
		if (_params.nodes[i].imageOffStyle) {
			icon = Ti.UI.createImageView(_.extend({
				touchEnabled: false,
				preventDefaultImage: true
			}, _params.nodes[i].imageOffStyle));

			tab.add(icon);
		} else if(_params.nodes[i].image) {
			icon = Ti.UI.createImageView({
				image: _params.nodes[i].image,
				width: "32dp",
				height: "32dp",
				top: "7dp",
				touchEnabled: false,
				preventDefaultImage: true
			});

			tab.add(icon);
		}
		icons.push(icon);

		// //badge
		// if (_params.nodes[i].controller == "alarms") {
		// 	var badge = require("push").getBadge() || 0;
		// 	var badgeLabel = $.UI.create('Label',{
		// 		classes : ['badgeLabel'],
		// 		text : badge
		// 	});
		// 	var badgeView = $.UI.create('View',{
		// 		classes : ['badgeBorderView']
		// 	});
		// 	var badgeWarp = $.UI.create('View',{
		// 		classes : ['badgeBorderWrap'],
		// 		visible : (badge) ? true : false
		// 	});
		// 	badgeWarp.add(badgeView);
		// 	badgeWarp.add(badgeLabel);
		// 	tab.add(badgeWarp);
		//
		// 	// add events
		// 	Ti.App.addEventListener('changeBadge', function(e){
		// 		if (e.number == 0) {
		// 			badgeWarp.visible = false;
		// 		} else {
		// 			badgeLabel.text = e.number;
		// 			badgeWarp.visible = true;
		// 		}
		// 	});
		// }

		if($.excess && i >= ($.excessLength - 1)) {
			tab.width = $.width + "dp";
			label.left = "5dp";

			$.nodes.push(tab);

			$.TabsMore.add(tab);
		} else {
			$.nodes.push(tab);
		}
	}

	for(var i = 0, z = $.excessLength; i < z; i++) {
		if($.nodes[i]) {
			$.Tabs.add($.nodes[i]);
		}
	}
};

/**
 * Adds the 'more' tab if necessary
 * @param {Object} _params
 * @private
 */
function addMoreTab(_params) {
	var tab = Ti.UI.createView({
		width: $.width + "dp"
	});

	var icon = Ti.UI.createImageView({
		image: _params.more,
		width: "32dp",
		height: "32dp",
		top: "7dp",
		touchEnabled: false,
		preventDefaultImage: true
	});

	var label = Ti.UI.createLabel({
		text: "More",
		top: "43dp",
		left: "5dp",
		right: "5dp",
		width: Ti.UI.FILL,
		height: "13dp",
		font: {
			fontSize: "10dp",
			fontWeight: "bold"
			//fontFamily: "HelveticaNeue"
		},
		color: _params.color.text,
		textAlign: "center",
		touchEnabled: false
	});

	tab.add(icon);
	tab.add(label);

	tab.addEventListener("click", moreEvent);

	$.nodes.push(tab);
};

/**
 * Clears all items from the tab bar
 */
$.clear = function() {
	var children = $.Tabs.children;
	var childrenMore = $.TabsMore.children;

	for(var i = 0; i < children.length; i++) {
		$.Tabs.remove(children[i]);
	}

	for(var i = 0; i < childrenMore.length; i++) {
		$.TabsMore.remove(childrenMore[i]);
	}
};

/**
 * Sets the indexed item as active
 * @param {Object} _index The index of the item to show as active
 */
$.setIndex = function(_index) {
	if (_index != null) {
		if(params.nodes[_index].viewType == "modal") {
			return;
		}

		if($.excess && _index > ($.excessLength - 2)) {
			_moreIndex = _index - ($.excessLength - 1);
			_index = ($.excessLength - 1);

			$.IndicatorMore.visible = true;
			$.IndicatorMore.top = ((_moreIndex * 60)) + "dp";
		} else {
			$.IndicatorMore.visible = false;
		}

		$.Indicator.left = (_index * $.width) + "dp";
		$.Indicator.width = $.width + "dp";

		//text un selected style
		if (index != null && index != _index && params.nodes[index].textOffStyle && labels[index]) {
			labels[index].applyProperties(params.nodes[index].textOffStyle);
			Ti.API.info('labels[index] :', index, labels[index]);
		}
		//text selected style
		if (params.nodes[_index].textOnStyle && labels[_index]) {
			labels[_index].applyProperties(params.nodes[_index].textOnStyle);
			labels[_index].visible = true;
		}
		//icon un selected style
		if (index != null && index != _index && params.nodes[index].imageOffStyle && icons[index]) {
			icons[index].applyProperties(params.nodes[index].imageOffStyle);
		}
		//icon selected style
		if (params.nodes[_index].imageOnStyle && icons[_index]) {
			icons[_index].applyProperties(params.nodes[_index].imageOnStyle);
		}
	} else {
		$.IndicatorMore.visible = false;
		$.Indicator.left = "0dp";
		$.Indicator.width = "0dp";

		//text un selected style
		if (index != null && index != _index && params.nodes[index].textOffStyle && labels[index]) {
			labels[index].applyProperties(params.nodes[index].textOffStyle);
			Ti.API.info('labels[index] :', index, labels[index]);
		}
		//icon un selected style
		if (index != null && index != _index && params.nodes[index].imageOffStyle && icons[index]) {
			icons[index].applyProperties(params.nodes[index].imageOffStyle);
		}
	}
	index = _index;

	moreClose();
};

/**
 * Handles the click event on the 'more' tab
 * @param {Object} _event The event
 * @private
 */
function moreEvent(_event) {
	if($.moreOpen) {

		var animation = Titanium.UI.createAnimation({
			height: "60dp",
			duration: 100,
			curve: Titanium.UI.ANIMATION_CURVE_EASE_IN
		});

		$.Wrapper.animate(animation);

		$.moreOpen = false;
	} else {
		$.moreOpen = true;

		var animation = Titanium.UI.createAnimation({
			height: Ti.UI.SIZE,
			duration: 100,
			curve: Titanium.UI.ANIMATION_CURVE_EASE_IN
		});

		$.Wrapper.animate(animation);
	}
};

/**
 * Closes the 'more' tab
 * @private
 */
function moreClose() {
	$.Wrapper.height = "60dp";
	$.moreOpen = false;
};

$.Wrapper.addEventListener("click", _.debounce(function(_event) {
	if(typeof _event.source.id !== "undefined" && typeof _event.source.id == "number") {
		$.setIndex(_event.source.id);
	}
}, 700, true));
