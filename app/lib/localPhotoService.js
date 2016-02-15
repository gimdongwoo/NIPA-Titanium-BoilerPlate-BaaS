var APP = require('core');

/*
 * # 역할.
 *  - blob을 인자로 받아서 포토갤러리/카메라롤에 저장한다.
 *
 * # 안드로이드에서 안되는 부분(이유확인못함) - imageView.toBlob() 원하는 동작가능
 *   - Titanium.Media.saveToPhotoGallery(file)에 전달되는 파일 인자를 전달했을경우 아래경우 모두안됨.
 *     1) imageView.toImage().media
 *     2) Titanium.Filesystem.getFile(Titanium.Filesystem.applicationCacheDirectory, fileName)
 *       ;url로 리모트파일 만들었던 경우와 local에 저장된 파일을 전달했을경우도안됨.
 *     3) Titanium.Media.showCamera()의 콜백에 전달된 e.media
 *
 *   - 만약 위의 1,2,3에서 만든 file이더라도 imageView를 한번 거치면 동작함.
 *		ex) var blob = Titanium.UI.createImageView({ image: file.nativePath }).toBlob()
 */
exports.saveToPhotoGallery = function (imageBlob, successCb, failCb) {
	// On Android this method only supports saving images to the device gallery.
	Titanium.Media.saveToPhotoGallery(imageBlob, {
		success : successCb,
		error : failCb
	});
};


// 이미지를 포토, 카메라앱을 통해 가져옴.
exports.getPhoto = function() {
	var params = {
		// arrowDirection, popoverView, 이건 아이패드전용
		animated  : false,

		saveToPhotoGallery:false,//아래와 한
		allowEditing : false, //미디어 가져오고 수정할 것인지.

		showControls : true, //갤러리에도 필요하려나?
		autohide : true, //미디어 선택후 갤러리 자동숨김, ios용.
		mediaTypes : [Titanium.Media.MEDIA_TYPE_PHOTO]

	};

	return _getOrCapturePhoto('openPhotoGallery', params);
};

// get multiple photos using module
exports.getPhotoMulti = function() {
	var Q = require("q");
	var deferred = Q.defer();

	var MediaPickerModule = require('/MediaPicker').MediaPicker;
	var MediaPicker = new MediaPickerModule();
	var callback = function(items) {
		var photoInfos = [];
		var iterate = function(item) {
			var _name = item.url.substring(item.url.lastIndexOf("/") + 1);
			if (_name.indexOf("?") > -1) _name = _name.substring(0, _name.indexOf("?"));
			MediaPicker.getImageByURL({
				key: item.url,
				id: item.id,
				success: function(e) {
					photoInfos.push({
						url: item.url,
						id: item.id,
						name : _name,
						blob: e.image.apiName == 'Ti.Blob' ? e.image : null,
						file: e.image.apiName == 'Ti.Blob' ? null : 'file://'+e.image,
						width: e.width,
						height: e.height
					});
					if (items.length) iterate(items.splice(0,1)[0]);
					else {
						deferred.resolve(photoInfos);
					}
				}
			});
		}
		if (items.length) iterate(items.splice(0,1)[0]);
	};
	MediaPicker.show(callback, 10, 'photos', '사진을 선택하세요. 오래 누르면 사진이 확대됩니다.');

	return deferred.promise;
};

//TODO[faith]: overlay는 overlayCamer()이런 이름으로 빼야겠다.
// 성공시. photoData =  {blob: BLOB, name: 이미지이름(확장자포함) }
// 실패시. string message
exports.capturePhoto = function(options) {
	var Q = require("q");
   //TODO: 언어
	if (!Titanium.Media.isCameraSupported) { return Q.fcall(function() { throw {messsage:L('ps_failNotSuportCamera')}; }); };

	var params = {
		saveToPhotoGallery : false,
		allowEditing : false,
		transform : Ti.UI.create2DMatrix().scale(1),
		mediaTypes : [Titanium.Media.MEDIA_TYPE_PHOTO]
	}

	//TODO[faith] : promise사용한 패턴에서 2번이상 캡쳐시 deferred.resolve()..이게 전달이 안됨. 그래서 raw한 형태로 재구성..
	if(options && options.overlay && options.success) {
		//overlay사용시 설정해야함.
		_.extend(params, {
			overlay : options.overlay,
			_success : options.success,
			_error : options.error,
			animated : true,
			//기본컨트롤제거.
			showControls : false,
			autohide : false
		});

		return _capturePhotoForOverlay('showCamera', params);
	}else{
		//전체 화면으로 촬영시.
		_.extend(params, {
			showControls : true
		});
		return _getOrCapturePhoto('showCamera', params);
	}

};
// raw형태를 콜백에 직접 전달.
function _capturePhotoForOverlay(action, params) {
	if( !(action in Titanium.Media) ) {
		if(params && params._error) {
			params._error({messsage:L('ps_failNotSuportCamera')});
		}
		return;
	};


	params.success = function(event) {
			// event.media
		if(event.mediaType == Titanium.Media.MEDIA_TYPE_PHOTO) {
			var photoInfo = {
				blob : event.media,
				//TODO[faith]: 확장자가 변경되야함
				name : (OS_IOS) ? (Date.now() + ".jpg") : event.media.getFile().getName()
			}

			params._success ? params._success(photoInfo) : '';
		} else {
			params._error ? params._error({messsage:L('ps_failNotPhoto') }) : '';
		};

	};
	params.cancel = function() {
		params._error ? params._error({messsage:L('ps_failCancle'), isCancel:true }) : '';
	};
	params.error = function(error) {
		// TODO : 언어
		var msg = "";
		if (error.code == Titanium.Media.NO_CAMERA) {
			msg = L('ps_failNotSuportCamera');
		} else {
			msg = L('ps_failGetPhoto');
		}

		params._error ? params._error({messsage:msg}) : '';
	};

	Titanium.Media[action].call(Titanium.Media, params);
};



exports.resize = function(photoBlob, targetView, nativePath) {
		var ImageFactory = require('ti.imagefactory');

		Ti.API.debug('Original Image :', photoBlob.width, ' * ', photoBlob.height, 'photoBlob.nativePath :', photoBlob.nativePath, "nativePath :", nativePath);

		var resizedImage, croppedImage;

		if (OS_ANDROID) {
			var fhImageFactory = require("fh.imagefactory");
			var maximumSize = null;

			//이미지를 리사이즈 하면서 돌리자
			if (photoBlob.width > photoBlob.height) {
				// 가로가 길때
				var rateWH = photoBlob.width / photoBlob.height;
				var targetHeight = APP.Settings.image.width;
				var targetWidth = targetHeight * rateWH;
				maximumSize = targetWidth;
			} else {
				// 세로가 길때
				var rateHW = photoBlob.height / photoBlob.width;
				var targetWidth = APP.Settings.image.width;
				var targetHeight = targetWidth * rateHW;
				maximumSize = targetHeight;
			}
			var nativePath = nativePath || photoBlob.nativePath;
			fhImageFactory.rotateResizeImage(nativePath, maximumSize, 100);
			resizedImage = Titanium.Filesystem.getFile(nativePath).read();
			Ti.API.debug('Resize Image : ', resizedImage.width, ' * ', resizedImage.height);
		}else {
			//촬영한 이미지 비율.
			var rateHW = photoBlob.height / photoBlob.width;

			var targetWidth = APP.Settings.image.width;
			var targetHeight = targetWidth * rateHW
			resizedImage = ImageFactory.imageAsResized(photoBlob, {
				width : targetWidth,
				height : targetHeight
			});
			Titanium.API.info('Resize Image : ', targetWidth, ' * ', targetHeight);
		}

		// 화면에 표시된 영역 만큼만 크롭
		if(targetView){
			var cropHWRate = targetView.size.height / targetView.size.width;
			var cropWidth = targetWidth;
			var cropHeight = cropWidth * cropHWRate;
			//가짜 이미지에서는 crop범위가 클경우 자르지 않는다.
			//  Error: x + width must be <= bitmap.width()
			if(cropWidth > resizedImage.width){
				Titanium.API.info('not crop : cropWidth : ', cropWidth, '> bitmapWidth ', resizedImage.width);
				croppedImage = resizedImage;
			}else{
				croppedImage = ImageFactory.imageAsCropped(resizedImage,{
					x: 0,
					y: 0, //상단에 nav영역이 있다면 그 높이 만큼
					width: cropWidth,
					height: cropHeight
				});
				Titanium.API.info('Crop Image : ', cropWidth, ' * ', cropHeight);
			}

		}

		var imageToCompress = croppedImage || resizedImage;
		// 이미지 압축을 하자
		return  ImageFactory.compress(imageToCompress, APP.Settings.image.quality);
};

exports.resizeForThumbnail = function(photoBlob, thumbWidth) {
	var ImageFactory = require('ti.imagefactory');
	// TODO 섬네일을 더 작게하지 않아서 그런지 이상하게나옴. 압축만한번더..
	photoBlob = photoBlob.imageAsThumbnail(thumbWidth || APP.Settings.image.thumb);

	//압축.
	return  ImageFactory.compress(photoBlob, APP.Settings.image.quality);
}

// 포토갤러리, 혹은 카메라 앱을 이용하여 가져옴.
function _getOrCapturePhoto(action, params) {
	var Q = require("q");
	var deferred = Q.defer();

	if( !(action in Titanium.Media) ) { return Q.fcall(function() { throw {messsage:L('ps_failNotSuportCamera')}; }); };

	// not caemara
	if (action != 'showCamera') {
		_callMedia();
		return deferred.promise;
	}

	// camera permission
	var hasCameraPermissions = Ti.Media.hasCameraPermissions();
	if (hasCameraPermissions) {
		_callMedia();
	} else {
		if (OS_IOS) {
			// Map constants to names
			var map = {};
			map[Ti.Media.CAMERA_AUTHORIZATION_AUTHORIZED] = 'CAMERA_AUTHORIZATION_AUTHORIZED';
			map[Ti.Media.CAMERA_AUTHORIZATION_DENIED] = 'CAMERA_AUTHORIZATION_DENIED';
			map[Ti.Media.CAMERA_AUTHORIZATION_RESTRICTED] = 'CAMERA_AUTHORIZATION_RESTRICTED';
			map[Ti.Media.CAMERA_AUTHORIZATION_NOT_DETERMINED] = 'CAMERA_AUTHORIZATION_NOT_DETERMINED';

			var cameraAuthorizationStatus = Ti.Media.cameraAuthorizationStatus;

			if (cameraAuthorizationStatus === Ti.Media.CAMERA_AUTHORIZATION_RESTRICTED) {
				return Q.fcall(function() { throw {messsage:L('ps_deniedPermission')}; });
			} else if (cameraAuthorizationStatus === Ti.Media.CAMERA_AUTHORIZATION_DENIED) {
				editPermissions();
				return Q.fcall(function() { throw {messsage:L('ps_deniedPermission')}; });
			}
		}

		// asynchronous
		Ti.Media.requestCameraPermissions(function(e) {
			if (e.success) {
				_callMedia();
			} else {
				editPermissions();
				deferred.reject({messsage:L('ps_deniedPermission') });
			}
		});
	}

	function _callMedia() {
		params.success = function(event) {
				// event.media
			if(event.mediaType == Titanium.Media.MEDIA_TYPE_PHOTO) {
				Ti.API.debug('----------------------------------------사진촬')
				var photoInfo = {
					blob : event.media,
					//TODO[faith]: 확장자가 변경되야함
					name : (OS_IOS) ? (Date.now() + ".jpg") : event.media.getFile().getName()
				}
				deferred.resolve(photoInfo);
			} else {
				deferred.reject({messsage:L('ps_failNotPhoto') });
			};

		};
		params.cancel = function() {
			deferred.reject({messsage:L('ps_failCancle'), isCancel:true });
		};
		params.error = function(error) {
			// TODO : 언어
			var msg = "";
			if (error.code == Titanium.Media.NO_CAMERA) {
				msg = L('ps_failNotSuportCamera');
			} else {
				msg = L('ps_failGetPhoto');
			}
			deferred.reject({messsage:msg});
		};

		Titanium.Media[action].call(Titanium.Media, params);
	}

	return deferred.promise;
};

function editPermissions(e) {
	if (OS_IOS) {
		Ti.Platform.openURL(Ti.App.iOS.applicationOpenSettingsURL);
	}

	if (OS_ANDROID) {
		var intent = Ti.Android.createIntent({
			action: 'android.settings.APPLICATION_SETTINGS',
		});
		intent.addFlags(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
		Ti.Android.currentActivity.startActivity(intent);
	}
}
