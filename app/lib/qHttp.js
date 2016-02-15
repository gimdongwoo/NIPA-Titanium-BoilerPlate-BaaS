var Q = require('q');
var httpRequest = (function() {
    function encodeData(obj, url) {
        var str = [];
        for (var p in obj) {
            str.push(Ti.Network.encodeURIComponent(p) + "=" + Ti.Network.encodeURIComponent(obj[p]));
        }

        if (_.indexOf(url, "?") == -1) {
            return url + "?" + str.join("&");
        } else {
            return url + "&" + str.join("&");
        }
    }

    return function(args) {
        var defer,
            tiHttpClient;
        var url = args.url;
        var data = args.data;
        var method = args.method || 'GET';
        var headers = args.headers;

        defer = Q.defer();

        tiHttpClient = Ti.Network.createHTTPClient({
            onload : function() {
                var parsedData,
                    error;
                if (this.status >= 200 && this.status < 300) {
                    try {
                        parsedData = JSON.parse(this.responseText);
                    } catch (e) {
                        error = e;
                    }
                } else {
                    error = "Bad HTTP Code";
                }
                if (error) {
                    defer.reject({
                        status : this.status,
                        message : error
                    });
                } else {
                    defer.resolve({
                        status : this.status,
                        data : parsedData
                    });
                }
            },
            onerror : function(e) {
                defer.reject(e);
            },
            onsendstream : function(e) {
                defer.notify(e);
            },
            timeout : 10000
        });

        if (method == 'GET' && data) {
            url = encodeData(data, url);
        }

        tiHttpClient.open(method, url, true);

        
        
        var sendData;
        if(method == 'POST' || method == 'PUT'){
            tiHttpClient.setRequestHeader('Content-Type',"application/json; charset=utf-8");
            sendData = (typeof data === 'object')?JSON.stringify(data):data;
        }
        
        _.each(headers, function(value, key) {
            tiHttpClient.setRequestHeader(key, value);
        });
        
        tiHttpClient.send(sendData);

        return defer.promise;
    };
})();

exports.httpRequest = httpRequest;

