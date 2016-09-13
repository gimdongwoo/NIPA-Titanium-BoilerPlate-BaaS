/**
* Utility functions class
*
* @class utilities
*/
//check. object의 값이 모두있어야함.
exports.checkRequired = function ( object ) {
  var keys = Object.keys(object);
  for ( var i = 0, iMax = keys.length; i < iMax; ++i ) {
    var key = keys[i];
    if( object.hasOwnProperty(key) ) {
      if ( !object[key] ) {
        throw 'checkRequired() fail: required value of key['+key+']';
      }
    }
  }

  return object;
}

/*
* label의 최대 줄을 제한하하는 용도(newfeedList의 W_F13등의 값할당에 의존.
*
* calculateHeightOfLimitLine({
*   startWidth: startWidth, //option
*   lineWidth: (CTX.width() - (26*2)),
*   maxLine: 4, //TODO 짧게하면 제대로 안나옴. 길어도 현재는 그냥 세줄로 제약두니괜찮음.
*   fontSize: 13
*   text: text,
* })
*
* return {   maxHeight: maxHeight, lastCharIdx: lastCharIdx  }
**/
exports.calculateHeightOfLimitLine = function (params) {
  var APP = require("core");
  // APP.log("debug", "calculateHeightOfLimitLine", params);

  //required
  var text = params['text'] || ''
  , LINE1_WIDTH = params['lineWidth']
  , LINE2_WIDTH = params['lineWidth'] * 2
  , LIMIT_LINE_WIDTH = LINE1_WIDTH * params['maxLine']
  , W_FONT = 'W_F' + (params['fontSize'] || 13)
  , H_FONT = 'H_F' + (params['fontSize'] || 13);

  //option
  var curWidth = params['startWidth'] || 0;
  //한 글자식 확인.
  var lastCharIdx = 0;
  for(var max=text.length; lastCharIdx<max; ++lastCharIdx){
    if( curWidth >= LIMIT_LINE_WIDTH ) break;

    curWidth += APP[W_FONT][exports.getCharType(text.charCodeAt(lastCharIdx))];

  }

  //curWidth에 맞는 높이는?
  var maxHeight = 0;
  if ( curWidth < LINE1_WIDTH ){
    maxHeight = APP[H_FONT]['1'];
  } else if( curWidth > LINE2_WIDTH ) {
    maxHeight = APP[H_FONT]['3'];
  } else {
    maxHeight = APP[H_FONT]['2'];
  }

  return {
    maxHeight: maxHeight,
    lastCharIdx: lastCharIdx
  }
}

//제한된 글자로 자르고, ...을붙여줌.
exports.limitText = function (text, limitCount) {
  text = text || '';

  if (text.length <= limitCount) {
    return text;
  } else {
    return text.slice(0, limitCount) + '...';
  }
}

//char_ASCII: text.charCodeAt(i)
exports.getCharType = function (char_ASCII){
  // APP.log("error", "char_ASCII",char_ASCII)
  // APP.W_F13['k'] = $.char_13_k.size.width;
  // APP.W_F13['n'] = $.char_13_n.size.width;
  // APP.W_F13['e1'] = $.char_13_e1.size.width;
  // APP.W_F13['s0'] = $.char_13_s0.size.width;
  // APP.W_F13['s1'] = $.char_13_s1.size.width;
  if((char_ASCII >= 12592) || (char_ASCII <= 12687)){
     //한글
     return 'k';
  }else if (char_ASCII == 32){
    //공백
    return 's0'
  }else if(char_ASCII >= 48 && char_ASCII <= 57 ){
    //숫자
    return 'n';
  }else if(char_ASCII>=65 && char_ASCII<=90){
    //영어(대문자)
    return 'e0';
  }else if(char_ASCII>=97 && char_ASCII<=122){
    //영어(소문자)
    return 'e1';
  }else if ((char_ASCII>=33 && char_ASCII<=47)
  || (char_ASCII>=58 && char_ASCII<=64)
  || (char_ASCII>=91 && char_ASCII<=96)
  || (char_ASCII>=123 && char_ASCII<=126)){
    //특수기호
    return 's1';
  }else{
    //기타는 그냥 한글과 같이.
    return 'k';
  }
}

// 문장, 시간에 효과주기.
exports.attributedStringForTitleAndTime = function (titleText, timeText) {
  var fullText = titleText + " " + timeText;

  var attributes = [];
  if(titleText && timeText){
    //title
    attributes.push( {
      type: Titanium.UI.ATTRIBUTE_FONT,
      value: {fontSize:16, fontWeight:'bold'},
      range: [0, titleText.length]
    });
    attributes.push( {
      type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
      value: '#655252',
      range: [0, titleText.length]
    });
    //timeText
    attributes.push( {
      type: Titanium.UI.ATTRIBUTE_FONT,
      value: {fontSize:12, fontWeight:'Regular'},
      range: [titleText.length+1, timeText.length]
    });
    attributes.push( {
      type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
      value: '#ac9090',
      range: [titleText.length+1, timeText.length]
    });

  }
  return Titanium.UI.createAttributedString({text:fullText, attributes:attributes});
}

// underline style
exports.underlineToLabel = function ($label) {
  var text = $label.text;
  if (text) {
    var attr = Ti.UI.createAttributedString({
      text: text,
      attributes: [
        {
          type: Ti.UI.ATTRIBUTE_UNDERLINES_STYLE,
          value: Titanium.UI.ATTRIBUTE_UNDERLINE_STYLE_SINGLE,
          range: [0, text.length]
        }
      ]
    });
    //ios에서도 동작하기 위해 value와 아래함수를 사용해야함.
    // $label.applyProperties({ text: text, attributedString: attr});
    $label.setAttributedString(attr);
  }
}
//라벨에 특정텍스트 bold효과주기.
exports.effectLabelToBold = function (label, originText, boldTexts, options) {
  options || (options = { fontSize: 14, isBackSearch : false });
  var attributes = [];

  for(var i=0,max=boldTexts.length; i<max; ++i){
    var boldText = boldTexts[i];

    //TODO 필요하다면 여럿찾아서 효과줄수있겠지. 지금은 하나만.
    var firstIdx = options.isBackSearch ? originText.lastIndexOf(boldText) : originText.indexOf(boldText);
    if(firstIdx != -1){
      attributes.push( {
        type: Titanium.UI.ATTRIBUTE_FONT,
        //ios에서 fontSize안주면 설정하지않은 기본값이됨.
        value: {fontSize: options.fontSize, fontWeight: 'bold'},
        range: [firstIdx, boldText.length]
      });
    }
  }
  var attr = Titanium.UI.createAttributedString({text:originText, attributes:attributes});

  if(OS_IOS){
    label.setAttributedString(attr); //ios에서 아래값안ㅁ먹어..
  }else{
    label.applyProperties({ text: originText, attributedString: attr});
  }
}

//라벨에 특정텍스트 color효과주기.
exports.effectLabelToColor = function (label, originText, colorTexts, options) {
  options || (options = { fontSize: 14, isBackSearch : false, color: "#655252" });
  var attributes = [];

  for(var i=0,max=colorTexts.length; i<max; ++i){
    var colorText = colorTexts[i];

    //TODO 필요하다면 여럿찾아서 효과줄수있겠지. 지금은 하나만.
    var firstIdx = options.isBackSearch ? originText.lastIndexOf(colorText) : originText.indexOf(colorText);
    if(firstIdx != -1){
      attributes.push( {
          type: Titanium.UI.ATTRIBUTE_FOREGROUND_COLOR,
          value: options.color,
        range: [firstIdx, colorText.length]
      });
    }
  }
  var attr = Titanium.UI.createAttributedString({text:originText, attributes:attributes});

  if(OS_IOS){
    label.setAttributedString(attr); //ios에서 아래값안ㅁ먹어..
  }else{
    label.applyProperties({ text: originText, attributedString: attr});
  }
}

// TODO attribut가 없을때 attr만 넣으면 값이 사라지는 현상이일어난다.
exports.createLabelPropertiesForMention = function (text, tagBackground, fontColor, options) {
  var attributeList = this._createAttributeList(text, tagBackground, fontColor, options) || [];

  //TODO 안드로이드. 리스트뷰에서. 라벨에 attr적용된 텍스트가  사라지는문제.
  // - 스크롤이 엄청길어지면 사라지나요?  // - section이 여러개이고. 하위섹션그릴때 사라지나?
  // - {text : ..} {attri..} 두가지를 섞어서 사용할때 사라진다.
    // 같은 row의 템플릿..에 대해서. 내부요소의 라벨에 attr만 사용해야된다.
    // 다시그릴때 text효과만 계산해서 attr적용된얘는 사라지는것같음.

  //  리스트뷰에서 scroll등의 섹션의 글자를 다시그리기 작업시에. 각row의 bind된 라벨에 대해서 섞어쓴것이있으면......사라지는현상발생.

  var attr = Titanium.UI.createAttributedString({text:text, attributes:attributeList});
  return { attributedString : attr };
}

//@포함한 것의 스타일 변경해주기.
exports.createAttributedStringForMention = function (text, tagBackground, fontColor, options) {
  var attributeList = this._createAttributeList(text, tagBackground, fontColor, options);
  var properties = attributeList.length ? {text:text, attributes:attributeList} : {text:text}
  return Titanium.UI.createAttributedString(properties);
}

exports._createAttributeList = function (text, tagBackground, fontColor, options) {
  var APP = require("core");

  options || (options = {});
  //background color
  // ios에서는 attributedString을 사용하면 content의 폰트등이 무시되기에 전체지정 다시하고, 부분을 오버라이딩.

  // if(OS_IOS){
  // attributes.push( {
  //   type: Titanium.UI.ATTRIBUTE_FONT,
  //   //뭐여....순서를 바꾸면 볼드가안먹네 Bold로해서그런가?
  //   value: {fontWeight:'bold',fontSize:15},
  //   range: [0, text.length]
  // });

  var attributes = [];

  // attributes.push( {
  //   type: Titanium.UI.ATTRIBUTE_FOREGROUND_COLOR,
  //   value: "#655252",
  //   range: [0, text.length]
  // });

  // normal tag based search
  if (!options.mentionList || !_.isArray(options.mentionList)) {
    var tag = "@";
    // var re = new RegExp("\\s"+tag+"\\S+\\s", 'g');
    var re = new RegExp(tag+"\\S+\\s", 'g');
    var match;
    while ((match = re.exec(text)) !== null) {
      // mentionWords.push({start:match.index, length:match[0].length});
      // match.index; // Match index.    match[0]; // Matching string.
      // Ti.API.debug("createFormaterForMention", match.index,match[0]);

      var tagStart = match.index || 0;
      var mentionStart = tagStart + tag.length;
      var mentionLength = match[0].length - tag.length || 0;
      /** styling
      * @param tag, tagStart, mentionStart, mentionLength
      */
      stylingSentence(tag, tagStart, mentionStart, mentionLength, { useLink: options.useLink });
    }
  } else {
    // mention list based search
    // {
    //   tag : this.tag,
    //   text : args.text + ' ',
    //   type : args.type,
    //   value : args.id
    // }
    _.each(options.mentionList, function (mention) {
      // APP.log("debug", "mention styling :", mention);
      if (mention.tag && mention.text) {
        var tag = mention.tag;
        var mtext = mention.text.trimRight();
        var idx = text.indexOf(tag + mtext);
        while (idx != -1) {
          var tagStart = idx;
          var mentionStart = tagStart + tag.length;
          var mentionLength = mtext.length;
          /** styling
          * @param tag, tagStart, mentionStart, mentionLength
          */
          stylingSentence(tag, tagStart, mentionStart, mentionLength, { useLink: options.useLink, mention: mention });
          // next
          idx = text.indexOf(tag + mtext, idx + 1);
        }
      }
    });
  }
  return attributes;

  /** common styling helper
  * @param tag, tagStart, mentionStart, mentionLength
  */
  function stylingSentence(tag, tagStart, mentionStart, mentionLength, options) {
    // @
    attributes.push( {
      type: Titanium.UI.ATTRIBUTE_FOREGROUND_COLOR,
      value: tagBackground || 'white', //textarea backgroundColor
      range: [tagStart, tag.length]
    });
    //안드로이드는 없어도 되고, 넣으면 죽음.
    if(OS_IOS){
      attributes.push( {
        type: Ti.UI.ATTRIBUTE_SHADOW,
        value: {color: tagBackground || 'white', offset: {width: 0, height: 0}},
        // value: {color: 'green', offset: {width: 10, height: 5}},
        range: [tagStart, tag.length]
      });
    }
    attributes.push( {
      type: Titanium.UI.ATTRIBUTE_FONT,
      value: {fontSize:7},
      range: [tagStart, tag.length]
    });

    //link
    //DONE : iOS는 color문제가 있음. https://jira.appcelerator.org/browse/TIMOB-19165
    if(options.useLink){
      var valueStr = "";
      if (options.mention && options.mention.value) {
        valueStr = JSON.stringify({
          className : (options.mention.type || "Institute"),
          instituteId : options.mention.value
        });
      } else {
        var instituteString = text.substring(mentionStart, mentionStart+mentionLength);
        //and에서 객체 전달시 문자열이 되네.
        valueStr = JSON.stringify({
          className : "Institute",
          instituteName : instituteString
        });
      }
      attributes.push({
        type: Titanium.UI.ATTRIBUTE_LINK,
        value: valueStr,
        range: [mentionStart, mentionLength]
      });
      //ios는 undeline 별개로 바꿔줘야함.
      if(OS_IOS){
        attributes.push({
          type: Ti.UI.ATTRIBUTE_UNDERLINE_COLOR,
          value: fontColor || '#573b3b', //font color
          range: [mentionStart, mentionLength]
        });
      }
    }

    //font
    attributes.push( {
      type: Titanium.UI.ATTRIBUTE_BACKGROUND_COLOR,
      value: 'transparent',
      range: [mentionStart, mentionLength]
    });
    attributes.push( {
      type: Titanium.UI.ATTRIBUTE_FONT,
      value: {fontWeight:'bold'},
      range: [mentionStart, mentionLength]
    });
    attributes.push( {
      type: Titanium.UI.ATTRIBUTE_FOREGROUND_COLOR,
      value: fontColor || '#573b3b', //font color
      range: [mentionStart, mentionLength]
    });
  }
}

 /**
  * filling z front of n fit to width
  * @param {String/Number} n Target number
  * @param {String} width Fit to width
  * @param {String} z filled text
  */
exports.zeroPad = function (n, width, z) {
  if ( typeof n == 'string') {
    n = parseInt(n);
  }
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/**
 * check not exist object/value
 * @param {String/Object} o
 */
exports.notExist = function (o) {
  if(_.isUndefined(o) || _.isNull(o) || _.isNaN(o)) {
    return true;
  } else {
    return false;
  }
}

/**
 * check exist object/value
 * @param {String/Object} o
 */
exports.exist = function (o) {
  return !exports.notExist(o);
};

/**
 * select only numbers
 * @param {String} val
 */
exports.getNumberOnly = function (val)  {
  val = new String(val);
  var regex = /[^0-9]/g;
  val = val.replace(regex, '');
  return val;
};

/**
 * Checks to see if an item in the cache is stale or fresh
 * @param {String} _url The URL of the file we're checking
 * @param {Number} _time The time, in minutes, to consider 'warm' in the cache
 */
exports.isStale = function (_url, _time) {
  var db = Ti.Database.open(Titanium.App.id);
  var time = new Date().getTime();
  var cacheTime = typeof _time !== "undefined" ? _time : 5;
  var freshTime = time - (cacheTime * 60 * 1000);
  var lastUpdate = 0;

  var data = db.execute("SELECT time FROM updates WHERE url = " + exports.escapeString(_url) + " ORDER BY time DESC LIMIT 1;");

  while(data.isValidRow()) {
    lastUpdate = data.fieldByName("time");

    data.next();
  }

  data.close();
  db.close();

  if(lastUpdate === 0) {
    return "new";
  } else if(lastUpdate > freshTime) {
    return false;
  } else {
    return true;
  }
};

/**
 * Returns last updated time for an item in the cache
 * @param {String} _url The URL of the file we're checking
 */
exports.lastUpdate = function (_url) {
  var db = Ti.Database.open(Titanium.App.id);
  var lastUpdate = 0;

  var data = db.execute("SELECT time FROM updates WHERE url = " + exports.escapeString(_url) + " ORDER BY time DESC LIMIT 1;");

  while(data.isValidRow()) {
    lastUpdate = data.fieldByName("time");

    data.next();
  }

  data.close();
  db.close();

  if(lastUpdate === 0) {
    return new Date().getTime();
  } else {
    return lastUpdate;
  }
};

/**
 * Checks to see if a file exists
 * @param {String} _path The path of the file to check
 */
exports.fileExists = function (_path) {
  var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, _path);

  if(file.exists()) {
    return true;
  } else {
    return false;
  }
};

/**
 * Adds thousands separators to a number
 * @param {Number} _number The number to perform the action on
 */
exports.formatNumber = function (_number) {
  _number = _number + "";

  x = _number.split(".");
  x1 = x[0];
  x2 = x.length > 1 ? "." + x[1] : "";

  var expression = /(\d+)(\d{3})/;

  while(expression.test(x1)) {
    x1 = x1.replace(expression, "$1" + "," + "$2");
  }

  return x1 + x2;
};

/**
 * Converts a hex color value to HSB
 * @param {String} _hex The hex color to convert
 */
exports.hexToHsb = function (_hex) {
  var result;

  if(_hex.length < 6) {
    result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(_hex);
  } else {
    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(_hex);
  }

  var hsb = {
    h: 0,
    s: 0,
    b: 0
  };

  if(!result) {
    return hsb;
  }

  if(result[1].length == 1) {
    result[1] = result[1] + result[1];
    result[2] = result[2] + result[2];
    result[3] = result[3] + result[3];
  }

  var rgb = {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };

  rgb.r /= 255;
  rgb.g /= 255;
  rgb.b /= 255;

  var minVal = Math.min(rgb.r, rgb.g, rgb.b),
    maxVal = Math.max(rgb.r, rgb.g, rgb.b),
    delta = maxVal - minVal,
    del_r, del_g, del_b;

  hsb.b = maxVal;

  if(delta !== 0) {
    hsb.s = delta / maxVal;

    del_r = (((maxVal - rgb.r) / 6) + (delta / 2)) / delta;
    del_g = (((maxVal - rgb.g) / 6) + (delta / 2)) / delta;
    del_b = (((maxVal - rgb.b) / 6) + (delta / 2)) / delta;

    if(rgb.r === maxVal) {
      hsb.h = del_b - del_g;
    } else if(rgb.g === maxVal) {
      hsb.h = (1 / 3) + del_r - del_b;
    } else if(rgb.b === maxVal) {
      hsb.h = (2 / 3) + del_g - del_r;
    }

    if(hsb.h < 0) {
      hsb.h += 1;
    }

    if(hsb.h > 1) {
      hsb.h -= 1;
    }
  }

  hsb.h = Math.round(hsb.h * 360);
  hsb.s = Math.round(hsb.s * 100);
  hsb.b = Math.round(hsb.b * 100);

  return hsb;
};

/**
 * Escapes a string for SQL insertion
 * @param {String} _string The string to perform the action on
 */
exports.escapeString = function (_string) {
  if(typeof _string !== "string") {
    return "\"" + _string + "\"";
  }

  return "\"" + _string.replace(/"/g, "'") + "\"";
};

/**
 * Removes HTML entities, replaces breaks/paragraphs with newline, strips HTML, trims
 * @param {String} _string The string to perform the action on
 */
exports.cleanString = function (_string) {
  if(typeof _string !== "string") {
    return _string;
  }

  _string = _string.replace(/&amp;*/ig, "&");
  _string = exports.htmlDecode(_string);
  _string = _string.replace(/\s*<br[^>]*>\s*/ig, "\n");
  _string = _string.replace(/\s*<\/p>*\s*/ig, "\n\n");
  _string = _string.replace(/<a[^h]*href=["']{1}([^'"]*)["']{1}>([^<]*)<\/a>/ig, "$2 [$1]");
  _string = _string.replace(/<[^>]*>/g, "");
  _string = _string.replace(/\s*\n{3,}\s*/g, "\n\n");
  _string = _string.replace(/[^\S\n]{2,}/g, " ");
  _string = _string.replace(/\n[^\S\n]*/g, "\n");
  _string = _string.replace(/^\s+|\s+$/g, "");

  return _string;
};

/**
 * Combination of clean and escape string
 * @param {String} _string The string to perform the action on
 */
exports.cleanEscapeString = function (_string) {
  _string = exports.cleanString(_string);

  return exports.escapeString(_string);
};

/**
 * Cleans up nasty XML
 * @param {String} _string The XML string to perform the action on
 */
exports.xmlNormalize = function (_string) {
  _string = _string.replace(/&nbsp;*/ig, " ");
  _string = _string.replace(/&(?!amp;)\s*/g, "&amp;");
  _string = _string.replace(/^\s+|\s+$/g, "");
  _string = _string.replace(/<title>(?!<!\[CDATA\[)/ig, "<title><![CDATA[");
  _string = _string.replace(/<description>(?!<!\[CDATA\[)/ig, "<description><![CDATA[");
  _string = _string.replace(/(\]\]>)?<\/title>/ig, "]]></title>");
  _string = _string.replace(/(\]\]>)?<\/description>/ig, "]]></description>");

  return _string;
};

/**
* escape string for regular expression
*/
exports.escapeRegexp = function (str) {
  var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g"); // .*+?|()[]{}\
  return str.replace(specials, "\\$&");
}

/**
* escape string for regular expression
*/
exports.escapeRegexp = function (str) {
  var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g"); // .*+?|()[]{}\
  return str.replace(specials, "\\$&");
}

/**
* if exist remove, if non-exist push
*/
exports.toggleArray = function (idList, id) {
  if(_.contains(idList, id)){
    idList = _.without(idList, id);
  }else{
    idList.push(id);
  }
  return idList;
}

/**
* backbone model or json to json
*/
exports.toObject = function (pointerData) {
  if(pointerData){
    var info = _.clone(pointerData.attributes || pointerData || {});
    // pointer를 위한 id
    // cloudCode로 오는 것을 위한 className.
    info["objectId"] = info["id"] = pointerData.id || pointerData.objectId;
    info["className"] = info["className"] || pointerData.className;
    return info;
  }else{
    return {};
  }
};
exports.toObjectList = function (list) {
  return _.map(list, function (pointerData) {
    return this.toObject(pointerData);
  }, this);
}

/**
* listview find event fired item
*/
exports.listViewFindItem = function (e, doAction) {
  if(e.section){
    var item = e.section.getItemAt(e.itemIndex);
    if(item){
      _.isFunction(doAction) && doAction(item);
      // item = _.extend(item, { backgroundColor:"blue"});
      // e.section.updateItemAt(e.itemIndex, item, {animated:false});

      return item; //되나?
    }
  }
};

/**
* listView selected Item deselect
*/
exports.listViewDeselect = function (_listview, _sectionIndex, _itemIndex) {
  if (OS_IOS) {
    _.defer(function () {
      setTimeout(function () {
        _listview.deselectItem(_sectionIndex, _itemIndex);
      }, 100);
    });
  }
};

// imageInfo에 맞춰서. width조정된 것 반환.
exports.imagePropByWidth = function(imageInfo, staticWidth) {
  if (!imageInfo) return {}; //check

  // 1개 자리 이미지는 큰거로 씀
  var imageUrl = imageInfo.thumbnailLargeUrl || imageInfo.url || imageInfo.thumbnailUrl;

  //!!중요: 넘치는 이미지를 적절하게 주려면, imageWrap은 자르고싶은고정크기.
  //내부 이미지뷰는 width와 hegiht를, 실제 이미지 비율에 맞춰서 줘야한다. 안그러면 ㅡㅡ 이상하게나옴.
  staticWidth = staticWidth || imageInfo['width'];
  var relativeHeight = imageInfo['height'] / imageInfo['width'] * staticWidth;

  return {
    image: imageUrl,
    width: staticWidth,
    height: relativeHeight
  }
}

/**
 * tryCatch wrapper
 * 비동기 콜백의 런타임에러 처리용.
 */
exports.tryCatcher = function(func, context) {
  return function( /*arguments*/ ) {
    try {
      func.apply(context, Array.prototype.slice.call(arguments));

    } catch( error ) {
      var APP = require("core");
      //경고, 스피너제거, 로그,
      error || (error = {});

      APP.closeLoading();
      APP.alert('tryAgainAlert');
      APP.log("error", error['message'], error['stack']);
    }
  }
}

/**
 * newsfeed collection include string
 * @param charCode
 */
exports.getCharType = function (char_ASCII){
  // APP.log("error", "char_ASCII",char_ASCII)
  // APP.W_F13['k'] = $.char_13_k.size.width;
  // APP.W_F13['n'] = $.char_13_n.size.width;
  // APP.W_F13['e1'] = $.char_13_e1.size.width;
  // APP.W_F13['s0'] = $.char_13_s0.size.width;
  // APP.W_F13['s1'] = $.char_13_s1.size.width;
  if((char_ASCII >= 12592) || (char_ASCII <= 12687)){
     //한글
     return 'k';
  }else if (char_ASCII == 32){
    //공백
    return 's0'
  }else if(char_ASCII >= 48 && char_ASCII <= 57 ){
    //숫자
    return 'n';
  }else if(char_ASCII>=65 && char_ASCII<=90){
    //영어(대문자)
    return 'e0';
  }else if(char_ASCII>=97 && char_ASCII<=122){
    //영어(소문자)
    return 'e1';
  }else if ((char_ASCII>=33 && char_ASCII<=47)
  || (char_ASCII>=58 && char_ASCII<=64)
  || (char_ASCII>=91 && char_ASCII<=96)
  || (char_ASCII>=123 && char_ASCII<=126)){
    //특수기호
    return 's1';
  }else{
    //기타는 그냥 한글과 같이.
    return 'k';
  }
}

/**
 * Converts a hex unicode character into a normal character
 */
String.fromCharCodePoint = function () {
  var codeunits = [];

  for(var i = 0; i < arguments.length; i++) {
    var c = arguments[i];

    if(arguments[i] < 0x10000) {
      codeunits.push(arguments[i]);
    } else if(arguments[i] < 0x110000) {
      c -= 0x10000;
      codeunits.push((c >> 10 & 0x3FF) + 0xD800);
      codeunits.push((c & 0x3FF) + 0xDC00);
    }
  }

  return String.fromCharCode.apply(String, codeunits);
};

/**
 * Decodes HTML entities
 * @param {String} _string The string to perform the action on
 */
exports.htmlDecode = function (_string) {
  var tmp_str = _string.toString();
  var hash_map = exports.htmlTranslationTable();

  tmp_str = tmp_str.replace(/&#(\d+);/g, function (_, n) {
    return String.fromCharCodePoint(parseInt(n, 10));
  }).replace(/&#x([0-9a-f]+);/gi, function (_, n) {
    return String.fromCharCodePoint(parseInt(n, 16));
  });

  for(var entity in hash_map) {
    var symbol = String.fromCharCode(hash_map[entity]);

    tmp_str = tmp_str.split(entity).join(symbol);
  }

  return tmp_str;
};

/**
 * The HTML entities table used for decoding
 */
exports.htmlTranslationTable = function () {
  var entities = {
    "&#x2013;": "8211",
    "&#x2014;": "8212",
    "&#x2018;": "8216",
    "&#x2019;": "8217",
    "&#xae;": "174",
    "&amp;": "38",
    "&bdquo;": "8222",
    "&bull;": "8226",
    "&circ;": "710",
    "&dagger;": "8224",
    "&Dagger;": "8225",
    "&fnof;": "402",
    "&hellip;": "8230",
    "&ldquo;": "8220",
    "&lsaquo;": "8249",
    "&lsquo;": "8216",
    "&mdash;": "8212",
    "&ndash;": "8211",
    "&OElig;": "338",
    "&oelig;": "339",
    "&permil;": "8240",
    "&rdquo;": "8221",
    "&rsaquo;": "8250",
    "&rsquo;": "8217",
    "&sbquo;": "8218",
    "&scaron;": "353",
    "&Scaron;": "352",
    "&tilde;": "152",
    "&trade;": "8482",
    "&Yuml;": "376",
    "&Igrave;": "204",
    "&igrave;": "236",
    "&Iota;": "921",
    "&iota;": "953",
    "&Iuml;": "207",
    "&iuml;": "239",
    "&larr;": "8592",
    "&lArr;": "8656",
    "&Aacute;": "193",
    "&aacute;": "225",
    "&Acirc;": "194",
    "&acirc;": "226",
    "&acute;": "180",
    "&AElig;": "198",
    "&aelig;": "230",
    "&Agrave;": "192",
    "&agrave;": "224",
    "&alefsym;": "8501",
    "&Alpha;": "913",
    "&alpha;": "945",
    "&and;": "8743",
    "&ang;": "8736",
    "&Aring;": "197",
    "&aring;": "229",
    "&asymp;": "8776",
    "&Atilde;": "195",
    "&atilde;": "227",
    "&Auml;": "196",
    "&auml;": "228",
    "&Beta;": "914",
    "&beta;": "946",
    "&brvbar;": "166",
    "&cap;": "8745",
    "&Ccedil;": "199",
    "&ccedil;": "231",
    "&cedil;": "184",
    "&cent;": "162",
    "&Chi;": "935",
    "&chi;": "967",
    "&clubs;": "9827",
    "&cong;": "8773",
    "&copy;": "169",
    "&crarr;": "8629",
    "&cup;": "8746",
    "&curren;": "164",
    "&darr;": "8595",
    "&dArr;": "8659",
    "&deg;": "176",
    "&Delta;": "916",
    "&delta;": "948",
    "&diams;": "9830",
    "&divide;": "247",
    "&Eacute;": "201",
    "&eacute;": "233",
    "&Ecirc;": "202",
    "&ecirc;": "234",
    "&Egrave;": "200",
    "&egrave;": "232",
    "&empty;": "8709",
    "&emsp;": "8195",
    "&ensp;": "8194",
    "&Epsilon;": "917",
    "&epsilon;": "949",
    "&equiv;": "8801",
    "&Eta;": "919",
    "&eta;": "951",
    "&ETH;": "208",
    "&eth;": "240",
    "&Euml;": "203",
    "&euml;": "235",
    "&euro;": "8364",
    "&exist;": "8707",
    "&forall;": "8704",
    "&frac12;": "189",
    "&frac14;": "188",
    "&frac34;": "190",
    "&frasl;": "8260",
    "&Gamma;": "915",
    "&gamma;": "947",
    "&ge;": "8805",
    "&harr;": "8596",
    "&hArr;": "8660",
    "&hearts;": "9829",
    "&Iacute;": "205",
    "&iacute;": "237",
    "&Icirc;": "206",
    "&icirc;": "238",
    "&iexcl;": "161",
    "&image;": "8465",
    "&infin;": "8734",
    "&int;": "8747",
    "&iquest;": "191",
    "&isin;": "8712",
    "&Kappa;": "922",
    "&kappa;": "954",
    "&Lambda;": "923",
    "&lambda;": "955",
    "&lang;": "9001",
    "&laquo;": "171",
    "&lceil;": "8968",
    "&le;": "8804",
    "&lfloor;": "8970",
    "&lowast;": "8727",
    "&loz;": "9674",
    "&lrm;": "8206",
    "&macr;": "175",
    "&micro;": "181",
    "&middot;": "183",
    "&minus;": "8722",
    "&Mu;": "924",
    "&mu;": "956",
    "&nabla;": "8711",
    "&nbsp;": "160",
    "&ne;": "8800",
    "&ni;": "8715",
    "&not;": "172",
    "&notin;": "8713",
    "&nsub;": "8836",
    "&Ntilde;": "209",
    "&ntilde;": "241",
    "&Nu;": "925",
    "&nu;": "957",
    "&Oacute;": "211",
    "&oacute;": "243",
    "&Ocirc;": "212",
    "&ocirc;": "244",
    "&Ograve;": "210",
    "&ograve;": "242",
    "&oline;": "8254",
    "&Omega;": "937",
    "&omega;": "969",
    "&Omicron;": "927",
    "&omicron;": "959",
    "&oplus;": "8853",
    "&or;": "8744",
    "&ordf;": "170",
    "&ordm;": "186",
    "&Oslash;": "216",
    "&oslash;": "248",
    "&Otilde;": "213",
    "&otilde;": "245",
    "&otimes;": "8855",
    "&Ouml;": "214",
    "&ouml;": "246",
    "&para;": "182",
    "&part;": "8706",
    "&perp;": "8869",
    "&Phi;": "934",
    "&phi;": "966",
    "&Pi;": "928",
    "&pi;": "960",
    "&piv;": "982",
    "&plusmn;": "177",
    "&pound;": "163",
    "&prime;": "8242",
    "&Prime;": "8243",
    "&prod;": "8719",
    "&prop;": "8733",
    "&Psi;": "936",
    "&psi;": "968",
    "&radic;": "8730",
    "&rang;": "9002",
    "&raquo;": "187",
    "&rarr;": "8594",
    "&rArr;": "8658",
    "&rceil;": "8969",
    "&real;": "8476",
    "&reg;": "174",
    "&rfloor;": "8971",
    "&Rho;": "929",
    "&rho;": "961",
    "&rlm;": "8207",
    "&sdot;": "8901",
    "&sect;": "167",
    "&shy;": "173",
    "&Sigma;": "931",
    "&sigma;": "963",
    "&sigmaf;": "962",
    "&sim;": "8764",
    "&spades;": "9824",
    "&sub;": "8834",
    "&sube;": "8838",
    "&sum;": "8721",
    "&sup;": "8835",
    "&sup1;": "185",
    "&sup2;": "178",
    "&sup3;": "179",
    "&supe;": "8839",
    "&szlig;": "223",
    "&Tau;": "932",
    "&tau;": "964",
    "&there4;": "8756",
    "&Theta;": "920",
    "&theta;": "952",
    "&thetasym;": "977",
    "&thinsp;": "8201",
    "&THORN;": "222",
    "&thorn;": "254",
    "&tilde;": "732",
    "&times;": "215",
    "&Uacute;": "218",
    "&uacute;": "250",
    "&uarr;": "8593",
    "&uArr;": "8657",
    "&Ucirc;": "219",
    "&ucirc;": "251",
    "&Ugrave;": "217",
    "&ugrave;": "249",
    "&uml;": "168",
    "&upsih;": "978",
    "&Upsilon;": "933",
    "&upsilon;": "965",
    "&Uuml;": "220",
    "&uuml;": "252",
    "&weierp;": "8472",
    "&#xA;": "10",
    "&#xD;": "13",
    "&Xi;": "926",
    "&xi;": "958",
    "&Yacute;": "221",
    "&yacute;": "253",
    "&yen;": "165",
    "&yuml;": "255",
    "&Zeta;": "918",
    "&zeta;": "950",
    "&zwj;": "8205",
    "&zwnj;": "8204",
    "&quot;": "34",
    "&lt;": "60",
    "&gt;": "62"
  };

  return entities;
};
