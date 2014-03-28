/**
 * Created by ycorneille on 21/03/14.
 */

var HAproxy = require('./ha-connect'),
    haproxy,
    CACHE_TTL = 1000,
    statCache={
        updated:null,
        data:{}
    },
    GLOBAL_STATS_OPTIONS = {
        proxyid : -1,
        serverid : -1,
        types : 7
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
     * get HAProxy instance information
     * @param callback
     * @private
     */
    var _info = function(callback){
        var formatInfo = function(info,callback){
            var result={};
            info = info.split('\n').map(function(line){
                line = line.split(':');
                if(line.length==2){
                    result[line[0].trim()]=line[1].trim();
                }
                return;
            })
            callback && callback(null,result);
        }
        haproxy.send('show info',function(err,data){
            if(err){return(callback && callback(err));}
            formatInfo(data, callback);
        });
    }
    /**
     * get proxy stats, in JSON Format
     * @param callback
     * @private
     */
    var _stats = function(options,callback){

        if(arguments.length==1 && typeof(arguments[0])=='function'){
            callback=arguments[0];
            options={};
        }

        options = options ||{};
        options.proxyid = options.proxyid||GLOBAL_STATS_OPTIONS.proxyid;
        options.serverid = options.serverid||GLOBAL_STATS_OPTIONS.serverid;
        options.types =     options.types||GLOBAL_STATS_OPTIONS.types;


        var formatLine = function(map){
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
            var types=['frontend','backend','server','socket'];
            var result = {};
            stats.map(function(statsItem){
                if(!statsItem.pxname||statsItem.pxname===''){return};
                result[statsItem.pxname] = result[statsItem.pxname]||{};
                result[statsItem.pxname][types[statsItem.type]]=result[statsItem.pxname][types[statsItem.type]]||{};
                result[statsItem.pxname][types[statsItem.type]][statsItem.svname]=statsItem;

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
         *
         * @param raw
         * @param callback
         */
        var filterData = function(raw,callback){
            var results=[];

            for(var service in raw){

                if( (options.serverid==-1 || raw[service].sid == options.serverid)
                    &&(options.proxyid==-1 ||raw[service].iid==options.proxyid)
                  ){
                    results.push(raw[service]);
                  }
            }
            //console.log(JSON.stringify(options), raw.length, results)
            callback && callback(null,results);
        }

        /**
         * Transform the HAProxy CSV into a human-readable JSON
         * @param csv
         * @param callback
         */
        var readCsv = function(csv,callback){
            var tabCsv = csv.split('\n')
                .map(function(line){return line.split(',')});

            getDatamap(tabCsv,function(map,data){
                var r = data.map(formatLine(map));
                filterData(r,function(err,filtered){
                    organizeStatsObject(filtered,callback);
                })

            });
        };
        //get stats for everything

        readCsv(statCache.data,callback);
    };
    /* CONSTRUCTOR */
    var collectStats = function(options,callback){
        haproxy.send('show stat '+options.proxyid+' '+options.types+' '+options.serverid,callback);
    };
    setInterval(function(){
        collectStats(GLOBAL_STATS_OPTIONS,function(err,data){
            if(err){return(callback && callback(err));}
            statCache.data=data;
            statCache.updated=Date.now();
        });
    },CACHE_TTL);

    return {
        stats : _stats,
        backend : HABackend,
        frontend : HAFrontend,
        info : _info,
        connector : haproxy

    }
}

module.exports = haRemote;