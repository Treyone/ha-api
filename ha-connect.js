/**
 * Created by ycorneille on 21/03/14.
 */
var net = require('net');
/**
 * Connects to HA Socket
 * @param socket
 * @constructor
 */
var haConnector = function(socket){
    var _socket = socket;
    /**
     * connects to HAProxy through the specified socket
     * @param callback
     */
    var connectToHA = function(callback){
        try{
            var client = net.connect(_socket, function() {
                callback && callback(null,client);
            });
        }
        catch(ex){
            callback && callback(ex);
        }

    };
    /**
     * sends a message to HA, gathers the response and passes it to the callback
     * @param message
     * @param callback
     */
    var _talkToHa = function(message,callback){
        connectToHA(function(err,ha){
            if(err){return (callback && callback(err));}

            var output = "";
            ha.on('data', function(data) {
                output += data;
            });

            ha.on('end', function() {
                 callback && callback(null,output);
                ha.end();
            });
            if(message.indexOf('\n'==-1)){message+='\n';}
            //console.log('sending '+message)
            ha.write(message);
        });
    }
    /**
     * Exposed methods
     */
    return {
        send : _talkToHa
    }
}

module.exports = haConnector;