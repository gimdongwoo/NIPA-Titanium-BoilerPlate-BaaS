var _env = {}
_env.ldf = OS_IOS ? 1 : Ti.Platform.displayCaps.logicalDensityFactor;
_env.width = function() {return Ti.Platform.displayCaps.platformWidth/this.ldf};
_env.height = function() {return Ti.Platform.displayCaps.platformHeight/this.ldf};

var CloseUpCol = defineCloseUpCol();
var CloseUpModel = defineCloseUpModel();


exports.createCol = function($) {
	return new CloseUpCol($);
}
exports.createModel = function($, url) {
	return new CloseUpModel($, url);
}

// 아이템 생성 및 이벤트 할당
function defineCloseUpCol() {
	function CloseUpCol($) {
		this._$ = $;

		this._collection = [];
		this._clouseUpWin = null;
		this._scrollableView = null;
		this._currentPage = 0;
	}

	CloseUpCol.prototype.add = function (closeUpModel) {
		this._collection.push(closeUpModel);
	};

	CloseUpCol.prototype.showCloseUp = function (closeUpModel) {
		if (!this._clouseUpWin) this._createCloseUpWin();
		this.openCloseUpWin(closeUpModel);
	};

	CloseUpCol.prototype._createCloseUpWin = function () {
		// create container window
		this._clouseUpWin = this._$.UI.create('Window',{
			classes:["photoWindow"]
		});
		this._scrollableView = this._$.UI.create('ScrollableView',{
			classes:["photoScrollableView"]
		});
		this._clouseUpWin.add(this._scrollableView);
		// scroll event
		var self = this;
		this._scrollableView.addEventListener('scrollend', function(e) {
			var eCurrentPage = parseInt(e.currentPage, 10);
			if (!_.isNaN(eCurrentPage) && eCurrentPage != self._currentPage) {
				self._currentPage = eCurrentPage;
				_.each(self._collection, function(closeUpModel, idx) {
					closeUpModel.resetZoom();
				});
			}
		});

		// exit button
		var exitBtn = this._$.UI.create('ImageView',{
			classes:["photoWindowExitBtn"]
		});
		this.exitCloseUpWin = this.exitCloseUpWin.bind(this);
		exitBtn.addEventListener('click', this.exitCloseUpWin);
		this._clouseUpWin.add(exitBtn);

		// create closeUpViews and add to scrollableView
		_.each(this._collection, function(closeUpModel, idx) {
			this._scrollableView.addView(closeUpModel.createCloseUpView(idx, this._collection.length));
		}, this);
	};

	CloseUpCol.prototype.openCloseUpWin = function (closeUpModel) {
		// selected photo
		this._scrollableView.scrollToView(closeUpModel ? closeUpModel.closeUpView : 0);
		// open window
		this._clouseUpWin.open();
	};

	CloseUpCol.prototype.exitCloseUpWin = function () {
		this._clouseUpWin.close();
	};

	return CloseUpCol;
}

// 아이템 생성 및 이벤트 할당
function defineCloseUpModel() {
	function CloseUpModel($, url) {
		this._$ = $;
		this._url = url;

		this.closeUpView = null;
		this.closeUpZoom = null;
		this.closeUpPhoto = null;
		this.closeUpViewLabel = null;

		// this._CloseUpFn = this._CloseUpFn.bind(this);
	}


	// CloseUpModel.prototype._CloseUpFn = function () {
	// 	Ti.API.debug("_CloseUpFn");
	// 	this._parent.showCloseUp(this);
	// };

	CloseUpModel.prototype.createCloseUpView = function(idx, length) {
		Ti.API.debug("createCloseUpView");
		var _maxZoomLevel = 4.0;

		this.closeUpView = this._$.UI.create('View',{
			classes:["closeUpView"],
		});

		this.closeUpPhoto = this._$.UI.create('ImageView',{
			classes:["closeUpPhoto"]
		});
		this.closeUpPhoto.applyProperties({
			image: this._url,
			visible: false
		});

		var self = this;
		this.closeUpPhoto.addEventListener('load', function() {
			self.closeUpPhoto.removeEventListener('load', arguments.callee);

			// size
			var blob = self.closeUpPhoto.toBlob();
			var imgWidth = blob.width;
			var imgHeight = blob.height;

			// view size
			var _screenWidth = _env.width();
			var _screenHeight = _env.height() * 0.95;
			var _screenRate = _screenWidth/_screenHeight;
			var imgWidthD = imgWidth/_env.ldf;
			var imgHeightD = imgHeight/_env.ldf;
			var imgRate = imgWidthD/imgHeightD;
			var imgViewWidth, imgViewHeight;
			if (_screenRate < imgRate) {
				// 가로가 더 넓을 때
				if (_screenWidth < imgWidthD) {
					imgViewWidth = _screenWidth;
					imgViewHeight = imgHeightD * imgViewWidth/imgWidthD;
				} else {
					imgViewWidth = imgWidthD;
					imgViewHeight = imgHeightD;
				}
			} else {
				// 세로가 더 넓을 때
				if (_screenHeight < imgHeightD) {
					imgViewHeight = _screenHeight;
					imgViewWidth = imgWidthD * imgViewHeight/imgHeightD;
				} else {
					imgViewWidth = imgWidthD;
					imgViewHeight = imgHeightD;
				}
			}

			// android renderer limit
			var _maxPixel = 2048;
			var resizedBlob = null;
			if (imgWidth >= _maxPixel || imgHeight >= _maxPixel) {
				var _width, _height;
				if (imgWidth > imgHeight) {
					_width = _maxPixel;
					_height = imgHeight * _width / imgWidth;
				} else {
					_height = _maxPixel;
					_width = imgWidth * _height / imgHeight;
				}

				resizedBlob = blob.imageAsResized(_width, _height);
			}

			if (OS_ANDROID) {
				self.closeUpView.remove(self.closeUpPhoto);
				self.closeUpPhoto = null;
				// use module
				self.closeUpPhoto = require('org.iotashan.TiTouchImageView').createView({
					image: resizedBlob || blob,
					width: Ti.UI.FILL,
					height: Ti.UI.FILL,
					maxZoom: _maxZoomLevel
				});
				self.closeUpView.add(self.closeUpPhoto);
			} else {
				self.closeUpPhoto.applyProperties({
					visible: true,
					width: imgViewWidth, height: imgViewHeight
				});
			}

			//add Label
			self.closeUpViewLabel = self._$.UI.create('Label',{
				classes:["closeUpViewLabel"],
				text: (idx+1) + " / " + length
			});
			self.closeUpView.add(self.closeUpViewLabel);
		});

		if (OS_IOS) {
			this.closeUpZoom = this._$.UI.create('ScrollView',{
				classes:["closeUpView"],
				maxZoomScale: _maxZoomLevel
			});
			this.closeUpZoom.add(this.closeUpPhoto);
			this.closeUpView.add(this.closeUpZoom);
			// event
			this.closeUpZoom.addEventListener('doubletap', function(e) {
				if (self.closeUpZoom.zoomScale > 1) {
					self.closeUpZoom.setZoomScale(1, {animated: true});
				} else {
					self.closeUpZoom.setZoomScale(_maxZoomLevel, {animated: true});
				}
			});
		} else {
			this.closeUpView.add(this.closeUpPhoto);
		}

		return this.closeUpView;
	};

	CloseUpModel.prototype.resetZoom = function() {
		if (OS_ANDROID) {
			this.closeUpPhoto.resetZoom && this.closeUpPhoto.resetZoom();
		} else {
			this.closeUpZoom.setZoomScale && this.closeUpZoom.setZoomScale(1);
		}
	};

	return CloseUpModel;
}
