var APP = require("core");

var platformWidth = APP.Device.width;
var prevContainerStartLeft = -1 * platformWidth / 3;

$.prevContainer = null;
$.container = null;

//컨테이너가 해제될때 호출을 해줘야 중복된 이벤트리스너가 동작하지않음.
$.close = function() {
    Ti.API.debug("touchend close");
    var containerWidth = $.container.size.width;
    $.container.width = containerWidth;

    //오른쪽끝으로 버림..
    $.container.animate({
        right:"-100%",
        duration : 200,
    }, function() {
        APP.ContentWrapper.remove($.container);
        $.container.applyProperties({zIndex:0});
        $.container.isAdded = false;
        $.container = null;
        APP.removeCurrentScreen();
    });

    //본래 형태로 돌려준다.
    $.prevContainer && $.prevContainer.animate({
        left:0,
        duration : 200
    }, function() {
        $.prevContainer.applyProperties({left:0, zIndex:1});
        $.prevContainer = null;
    });
}

// $.onSwipe = function(e) {
//     Ti.API.error(e);
// }

$.onTouchStart = function(e) {
    Ti.API.debug("touchstart", e.x);
    var nowPrevContainer = APP.previousScreen || APP.getPreviousScreen();
    var nowContainer = APP.currentScreen || APP.getCurrentScreen();
    if(!nowPrevContainer){ return; }

    $.prevContainer = nowPrevContainer;
    $.container = nowContainer;

    Ti.API.info('$.prevContainer.isAdded :', $.prevContainer.isAdded);
    if ($.prevContainer && $.container && !$.prevContainer.isAdded) {
        $.prevContainer.applyProperties({width:"100%", left:"-100%", zIndex:0});

        $.container.applyProperties({width:"100%", zIndex:1});

        $.prevContainer.isAdded = true;
        APP.ContentWrapper.add($.prevContainer);
    }
}

//_.throttle가 없으면 밀린이벤트가 발생해서 딱떨어지게 동작안함.
$.onTouchMove = _.throttle(function(e) {
    if(!$.prevContainer){ $.onTouchStart(e); }

    if($.prevContainer && $.container){
        if(e.x >= 20){
            $.container.applyProperties({right : -e.x + 20});
            $.prevContainer.applyProperties({left : prevContainerStartLeft + (e.x / 3)});
        }else{
            $.container.applyProperties({right : 0});
            $.prevContainer.applyProperties({left : prevContainerStartLeft});
        }
    }
});

//TODO move에서 throttle사용때문인지. 이벤트 두번발생해서 되돌리기/없에기가 꼬이는경우가생김. 그래서 여기도 throttle.
$.onTouchEnd = _.throttle(function(e) {
    if(!$.prevContainer){ return; }

    var curX = Math.round(e.x);
    //반절이하 영역이면 되돌림.
    if(curX <= platformWidth/2){
        Ti.API.debug("touchend restore", curX);
        if($.prevContainer && $.container){
            //본래 형태로 돌려준다.
            $.container.animate({
                right:0,
                duration : 200
            }, function() {
                $.container.applyProperties({right:0});
            });
            //본래위치로 돌아간다.
            $.prevContainer.animate({
                left:prevContainerStartLeft,
                duration : 200
            }, function() {
                $.prevContainer.applyProperties({left: "-100%"});
            });
        }

    }else{
        $.close();
    }
});

// event listener
$.leftBar.addEventListener('touchstart', $.onTouchStart);
$.leftBar.addEventListener('touchmove', $.onTouchMove);
$.leftBar.addEventListener('touchend', $.onTouchEnd);
// $.leftBar.addEventListener('swipe', $.onSwipe);
