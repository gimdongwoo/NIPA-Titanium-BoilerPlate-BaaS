// 앱의 상태를 처리함
Alloy.Globals.appOnline = true;

// Parse 초기화
require("tiparsejs_wrapper")({
  applicationId: Ti.App.Properties.getString('Parse_AppId'),
  javascriptkey: Ti.App.Properties.getString('Parse_JsKey')
});
// use RevocableSession
Parse.User.enableRevocableSession();

// 기초 설정
Ti.UI.backgroundColor = '#ffffff';

// // Monitor silent push notifications
// if (OS_IOS) {
//     Ti.App.iOS.addEventListener('silentpush', function(e){
//         Ti.API.debug("silentpush" + JSON.stringify(e));
//         // save for app load
//         var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, "silentpush.json");
//     	if (file.write(JSON.stringify(e)) === false) {
//             Ti.API.error("save silentpush to File Write Fail");
//     	}
//     	file = null;
//     });
// }
