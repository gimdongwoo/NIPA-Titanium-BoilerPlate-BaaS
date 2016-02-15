// 앱의 상태를 처리함
Alloy.Globals.appOnline = true;

// Parse 파라미터 디버깅용
var Parse, dump,
  __slice = [].slice;
Alloy.Globals.dump = function() {
	var args;
	args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
	return Ti.API.debug(JSON.stringify(args, void 0, 2));
};
// Parse 초기화
Parse = require("ti-parse")({
	applicationId: Ti.App.Properties.getString('Parse_AppId'),
	javaScriptKey: Ti.App.Properties.getString('Parse_JsKey')
});

// 기초 설정
Ti.UI.backgroundColor = '#ff5757';

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
