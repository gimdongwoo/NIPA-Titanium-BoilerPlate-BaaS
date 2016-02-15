// Pull in the core APP singleton
var APP = require("core");
var PUSH = require("push");
var Q = require('q');

exports.definition = {
	config : {
		// https://api.parse.com/1/classes/users
		"URL": "https://api.parse.com/1/users",
	    //"debug": 1,
	    "adapter": {
	        "type": "restapi",
	        "collection_name": "users",
	        "idAttribute": "objectId"
		},
	    "headers": { // your custom headers
	        "X-Parse-Application-Id" : Ti.App.Properties.getString('Parse_AppId'),
	        "X-Parse-REST-API-Key" : Ti.App.Properties.getString('Parse_RestKey'),
	        "Content-Type" : "application/json"
	    }
	},
	extendModel: function(Model) {
		_.extend(Model.prototype, {
			// Extend, override or implement Backbone.Model
			_parse_class_name: "users",
			save: function(attributes, options) {
				var options = options || {};
				this.set(attributes);
				Parse.Cloud.run('userModify', attributes, {
					success: function(result) {
						APP.log("debug", 'User Save Success : ' + JSON.stringify(result));
						options.success && options.success();

					},
					error: function(error) {
						APP.log("error", 'User Save Fail : ' + JSON.stringify(error));
						options.error && options.error();
					}
				});
			},
			reset: function(user) {
				this.clear({silent:true});	// if value changing exist to null
				this.set(_.extend({id: user.id, objectId: user.id}, user.attributes));	// change event avoid
			},
			login: function(options){
				var thisModel = this;
				var errorFn = function(error) {
					APP.closeLoading();
					Ti.API.error(error);
					// 101 : invaild session
					// 209 : invaild session token
					if (!error || !error.code || error.code == '101' || error.code == '209') {
						APP.SettingsM.set('User_sessionToken', undefined).save();
						APP.log("error", 'Login Fail : ' + JSON.stringify(error));
						thisModel.trigger("login:fail");
					} else {
						// 로긴을 계속 재시도
						setTimeout(loginParse, 100);
					}
				};
				var withdrawChk = function(user) {
					if (user.get("isWithdraw") == true) {
						errorFn();
					} else {
						thisModel.reset(user);
						APP.log("debug", 'Login User Successful : ' + user.id + ' ' + user.get("name"));

						// // 자녀수를 확인해서 등록된 자녀가 있을때 메인을 표시
						// thisModel.checkChild();
						thisModel.checkArea();

						// installation에 유저정보 저장
						PUSH.setUserInfo(thisModel);

						// fetch하여 참조 데이터 가져옴.
						// APP.log("debug","before", APP.SettingsM.get('UserM'));
						thisModel.fetch({
							urlparams:{
								include: "Childrens.School"
							},
							success: function(user) {
								// APP.log("debug","after", APP.SettingsM.get('UserM'));
							},
							error: function(error) {
								APP.log("error", "user fetch", error);
							}
						})
					}
				};

				// 1. 유저 로컬에서 복원
				this.restoreUserfunction();

				// 2. 로긴 시도
				loginParse();

				// 로긴 시도
				function loginParse() {
					// setting 에 저장된 기존 로그인을 처리하기
					if(APP.SettingsM.get('User_sessionToken')) {
						Parse.User.become(APP.SettingsM.get('User_sessionToken')).then(function (user) {
							withdrawChk(user);
						}, function (error) {
							errorFn(error);
						});
					} else if(options && options.username && options.password){
						Parse.User.logIn(options.username, options.password, {
							success: function(user) {
								//세션 토큰 저장
								APP.SettingsM.set('User_sessionToken', Parse.User.current().getSessionToken()).save(null, {
									success: function (model, result) {
										withdrawChk(user);
									},
									error: function (model, error) {
										errorFn(error);
									}
								});
							},
							error: function(user, error) {
								errorFn(error);
							}
						});
					} else {
						Ti.API.error("User Login Faild");
						APP.SettingsM.set('User_sessionToken', undefined).save();
						thisModel.trigger("login:fail");
						APP.closeLoading();
					}
				}
				// options.success && options.success();
				// options.error && options.error();
			},
			// 저장된 유저모델 복구
			restoreUserfunction: function() {
				var UserM = APP.SettingsM.get('UserM');
				if(UserM) {
					try {
						UserM = JSON.parse(UserM);
					} catch(e) {
						//
					}
					this.set(UserM, {silent: true});	// change event avoid

					// 자녀수를 확인해서 등록된 자녀가 있을때 메인을 표시
					// this.checkChild();
					this.checkArea();
				}
			},
			// 권역표기로 메인표시확인.
			checkArea: function() {
				if (this.get("AreaId")) {
					if(!APP.SettingsM.get('isWatched_walksthrough')) {
						// walksthrough off
						APP.SettingsM.save('isWatched_walksthrough', true);
					}
					this.trigger("login:init");
				} else {
					APP.requiredChildren('isJoining');
				}
			},
			// 자녀수를 확인해서 등록된 자녀가 있을때 메인을 표시
			checkChild: function() {
				if (this.hasNotChild()) {
					APP.requiredChildren();
				} else {
					this.trigger("login:init");
				}
			},
			// 자녀를 가지고있는지 체크.
			hasNotChild: function () {
				var children = this.get("ChildrenIds") || [];
				if(children.length){
					return false;
				}else{
					return true;
				}
			},
			//기초데이터
			getInfo : function() {
				var id = this.id;
				// var imageUrl = userM.get('profileImage') ? userM.get('profileImage').url() : "" ;
				var name = this.get('name') || "";

				return {
					id : id,
					name : name,
					// imageUrl :imageUrl,
					// comment : userM.get('comment') || ''
				};
			},
			//작성한 리뷰수가 2개 미만일 경우. 2개를강제작성해야해..
			isMustWriteReview : function() {
				if(this.get('isWriteForceReview')){//강제리뷰작성했다.
					return false; //안남겨도됨.
				}else{
					//강제리뷰를 남기지않았을경우만 갯수체크.
					var reviewCount = this.get('reviewCount') || 0;
					return (reviewCount < APP.Settings.userMinimum.review) ? true : false;
				}
			},
			doneForceReview : function() {
				if(this.get('isWriteForceReview')){//강제리뷰작성했다.
				}else{
					this.set({'isWriteForceReview' : true });
					//리모트업뎃
					Parse.Cloud.run('userModify', {'isWriteForceReview' : true });
				}
			},
			//유저가 본 학원수가 5개까지는 valid
			isValidateToSeeFreeRead : function() {
				// Ti.API.error("error", this.get('readCountOfInstitute'),APP.Settings.userMinimum.institute);
				var readCount = this.get('readCountOfInstitute') || 0;
				return (readCount <= APP.Settings.userMinimum.institute) ? true : false;
			},
			readInstitute : function() {
				var readCount = this.get('readCountOfInstitute') || 0;
				readCount += 1;
				//로컬업뎃
				this.set({'readCountOfInstitute' : readCount });
				//리모트업뎃
				Parse.Cloud.run('userModify', {'readCountOfInstitute' : readCount });
			},
			withdraw: function() {
				var thisModel = this;
				var withdrawUser = function() {
					//coach등도 다시볼수있게.
					APP.SettingsM.save({
						'isWatched_walksthrough': false,
						'isWatched_coach_rank' : false,
						'isWatched_coach_question' : false,
					});
					// CC코드로 탈퇴처리
					//TODO 하나라도 타입이 다르면 오류남. 그런데 cloud보면 성공실패여부 상관없이 succss하기에 값변화없던것.
					Parse.Cloud.run('userModify', {
						"isWithdraw":true,
						"reviewCount":0,
						"isWriteForceReview":false,
						"readCountOfInstitute":0,
						"recommendUsername":"",
						"ChildrenIds":[],
						"AreaId":"",
						"modifyNameAt":"",
						// "name":"",  이름지우지않는다.
						//cloud와 같음.
						"isPermissionAllPush" : true,
						"isUsingBanTime" : true,
						"banStartHour" : 23,
						"banStartMinute" : 0,
						"banEndHour" : 7,
						"banEndMinute" : 0
					}, {
						success: function(result) {
							thisModel.logout();
						},
						error: function(error) {
							APP.log("error","withdraw remote fail : ", error);
						}
					});
				};

				Parse.User.become(APP.SettingsM.get('User_sessionToken')).then(function (user) {
					withdrawUser();
				}, function (error) {
				});
			},
			logout: function() {
				var thisModel = this;
				APP.SettingsM.set('User_sessionToken', undefined).save(null, {
					success: function (model, result) {
						thisModel.clear({silent:true});	// if value changing exist to null
						APP.SettingsM.save({ "UserM": null }, {
							success: function() {
								thisModel.trigger("login:fail");
							},
							error: function (model,error) {
								APP.log("error", "user logout (UserM to null)", error);
							}
						});
					},
					error: function (model, error) {
						APP.log("error", "user logout (User_sessionToken to undefined)", error);
					}
				});

			}
		});

		return Model;
	},

	extendCollection: function(Collection) {
		_.extend(Collection.prototype, {
			// Extend, override or implement Backbone.Collection
			_parse_class_name: "users",
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
