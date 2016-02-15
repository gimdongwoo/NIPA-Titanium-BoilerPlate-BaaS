var APP = require("core");
var Q = require('q');
var remotePhotoService = require('remotePhotoService');

exports.definition = {
	config : {
		adapter: {
			type: "parse",
			// parseSync 에서 이걸로 만드니 주의. objectId로 값을 전달해야 model.id에 접근할 수 있다.
			idAttribute: "objectId"
		}
		// table schema and adapter information
	},

	extendModel: function(Model) {
		_.extend(Model.prototype, {
			// Extend, override or implement Backbone.Model
			_parse_class_name: "File",

			//파일 데이터를 이용하여 parse에 저장한다
			saveBy : function(fileData) {
				if(!fileData && !fileData.blob && !fileData.name){
					APP.alert('c_alertMsgFailSaveImage');
					return Q();
				}
				var self = this;

				// 이름의 확장자를 이용하여 파일 타입확인함.
				// parsefile을 File object에 저장 위해 먼저 리모트에 저장해야함
				var fileSaveFnList = [];
				fileSaveFnList.push(remotePhotoService.savePhoto(fileData.blob, fileData.name));
				if(fileData.thumbnailBlob){
					var thumbnailName = 'thumbnail_'+ fileData.name;
					fileSaveFnList.push(remotePhotoService.savePhoto(fileData.thumbnailBlob, thumbnailName));
				}
				if(fileData.thumbnailLargeBlob){
					var thumbnailName = 'thumbnailLarge_'+ fileData.name;
					fileSaveFnList.push(remotePhotoService.savePhoto(fileData.thumbnailLargeBlob, thumbnailName));
				}

				return Q.all(fileSaveFnList)
					.then(function(args){
						Ti.API.debug('filesave length : ',args.length);
						var deferred = Q.defer();

						var parseFile = args[0];
						var thumbnailParseFile = args[1];
						var thumbnailLargeParseFile = args[2];

						var thumbUrl = thumbnailParseFile ? thumbnailParseFile.url() : null;
						var thumbLargeUrl = thumbnailLargeParseFile ? thumbnailLargeParseFile.url() : null;
						// Ti.API.debug('----------------', parseFile.url())

						//TODO[faith]: parseFile을 속성으로 직접저장하면 싱크어뎁터에서 stringify에서 순환오류가 남.
						//             setting부분에서 가능했던것은 클라우드 코드를 실행하기에.
						self.set({
							thumbnailUrl: thumbUrl,
							thumbnailLargeUrl: thumbLargeUrl,
							url: parseFile.url(),
							name: parseFile.name(),
							width: fileData.blob.width,
							height: fileData.blob.height,

							User_objectId:fileData.User_objectId,
							type: fileData.type,
							text: fileData.text,
							location: fileData.location,
							fileType:'image/jpeg'
						}).save(null, {
							success:function(result) {
								Ti.API.debug('FileM으로 저장성공.')
								return deferred.resolve(result);
							},
							error:function(err){
								APP.alert('c_alertMsgFailSaveImage');
							}
						});

						return deferred.promise;
					}).catch(function(){
						APP.alert('c_alertMsgFailSaveImage');
					});
			}
		});

		return Model;
	},

	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			// Extend, override or implement Backbone.Collection
			_parse_class_name: "File",
			// For Backbone v1.1.2, uncomment the following to override the
		        // fetch method to account for a breaking change in Backbone.
		        fetch: function(options) {
				options = options ? _.clone(options) : {};
				if(options.reset == null) options.reset = true;
				return Backbone.Collection.prototype.fetch.call(this, options);
			}
		});

		return Collection;
	}
};
