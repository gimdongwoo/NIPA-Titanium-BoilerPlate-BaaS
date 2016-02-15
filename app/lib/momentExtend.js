// https://npmjs.org/package/moment.twitter 참조하여 구현
var moment = require('alloy/moment');

// Times in millisecond
var second = 1e3, minute = 6e4, hour = 36e5, day = 864e5, week = 6048e5,
	formats = {
		seconds : {
			short : 's',
			long : ' sec'
		},
		minutes : {
			short : 'm',
			long : ' min'
		},
		hours : {
			short : 'h',
			long : ' hr'
		},
		days : {
			short : 'd',
			long : ' day'
		}
	};

var format = function(format) {
	var diff = Math.abs(this.diff(moment()));

	if (diff < week) {
		return this.fromNow();
	} else {
		return this.format('L');
	}
};

moment.fn.twitter = moment.fn.twitterShort = function() {
	return format.call(this, 'short');
};

moment.lang('ko', {
	//주어진 이름만 쓸수있는것같음. 문서참조.
    longDateFormat : {
		l : "YY.MM.DD", //custom
		ll : "MM.DD", //custom
        LT : "A h시 mm분",
        L : "YYYY.MM.DD",
        LL : "YYYY년 MMMM D일",
        LLL : "YYYY년 MMMM D일 LT",
        LLLL : "YYYY년 MMMM D일 dddd LT"
    },

    relativeTime : {
        future : "in %s",
        past : "%s",
        s : "1초 전",
        ss : "%d초 전",
        m : "1분 전",
        mm : "%d분 전",
        h : "1시간 전",
        hh : "%d시간 전",
        d : "1일 전",
        dd : "%d일 전",
        M : "1달 전",
        MM : "%d달 전",
        y : "1년 전",
        yy : "%1년 전"
    }
});

moment.lang('en',{
	longDateFormat : {
		l : "YY.MM.DD", //custom
		ll : "MM.DD", //custom
        LT : "HH:mm",
        L : "DD/MM/YYYY",
        LL : "D MMMM YYYY",
        LLL : "D MMMM YYYY LT",
        LLLL : "dddd, D MMMM YYYY LT"
   },
       relativeTime : {
        future : "in %s",
        past : "%s",
        s : "1s",
        ss : "%ds",
        m : "1m",
        mm : "%dm",
        h : "1h",
        hh : "%dh",
        d : "1d",
        dd : "%dd",
        M : "1M",
        MM : "%dM",
        y : "1Y",
        yy : "%dY"
	}
});

module.exports = moment;
