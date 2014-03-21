/**
 * Created by ycorneille on 21/03/14.
 */

var HAproxy = require('./ha-connect'),
    haproxy;

//non-HAProxy related functions
var checkMandatoryParams = function(params,required,callback){
    required.map(function(item){
        if(!params[item]){
            callback && callback(item+' parameter is missing');
            return;
        }
        return item;
    });

    callback && callback(null);
};

var HAFrontend= function(frontendName){

    /**
     * Disable a specific frontend
     * @param callback
     * @private
     */
    var _disableFrontend = function(callback){
        haproxy.send('disable frontend '+frontendName,callback);
    };
    /**
     * Enable a specific frontend
     * @param callback
     * @private
     */
    var _enableFrontend = function(callback){
        haproxy.send('enable frontend '+frontendName,callback);
    };
    return {
        enable: _enableFrontend,
        disable : _disableFrontend
    }

}
var HABackend = function(backendName){
    return {
        server : HAServer(backendName)
    }
}
var HAServer = function(backend){
    return function(serverName){
        /**
         * Disable a specific server
         * @param callback
         * @private
         */
        var _disableServer = function(callback){
            haproxy.send('disable server '+backend+'/'+serverName,callback);
        };
        /**
         * Enable a specific server
         * @param callback
         * @private
         */
        var _enableServer = function(callback){
            haproxy.send('enable server '+backend+'/'+serverName,callback);
        };
        return {
            enable: _enableServer,
            disable : _disableServer
        }
    };
}

/**
 * Object API for HAProxy
 * @param socket Socket to use t connect to HAProxy (either TCP or UNIX local)
 * @constructor
 */
var haRemote = function(socketDefinition){
    haproxy = new HAproxy(socketDefinition);
    /**
     * get proxy stats, in JSON Format
     * @param callback
     * @private
     */
    var _stats = function(callback){
        var formatLine = function(map){
            //var types=['frontend','backend','server','socket'];
            return function(line){
                var result={};
                for(var i=0;i<line.length;i++){
                    result[map[i]]=line[i];
                }
                return result;
            }
        };
        /**
         * Create a hierarchical structure from CSV tables
         * @param stats {Array}
         * @param callback
         */
        var organizeStatsObject = function(stats,callback){
            var result = {};
            stats.map(function(statsItem){
                result[statsItem.pxname]=result[statsItem.pxname]||{};
                result[statsItem.pxname][statsItem.svname]=statsItem;
                return;
            });
            callback && callback(null,result);
        };
        /**
         * extract fields descriptions from 1st line of the CSV
         * @param data
         * @param callback
         */
        var getDatamap = function(data,callback){
            var desc = data[0],result=[];
            for(var o in desc){
                result.push(desc[o].replace('# ',''));
            }
            data = data.slice(1);
            callback && callback(result,data);
        };
        /**
         * transform the HAProxy CSV into a human-readable JSON
         * @param csv
         * @param callback
         */
        var readCsv = function(csv,callback){
            var tabCsv = csv.split('\n')
                .map(function(line){return line.split(',')});
            getDatamap(tabCsv,function(map,data){
                var r = data.map(formatLine(map));
                organizeStatsObject(r,callback);
            });
        };
        //get stats for everything
        haproxy.send('show stat -1 5 -1',function(err,data){
            if(err){return(callback && callback(err));}
            readCsv(data,callback);
        });
    };

    return {
        stats : _stats,
        backend : HABackend,
        frontend : HAFrontend,
        connector : haproxy
    }
}

module.exports = haRemote;