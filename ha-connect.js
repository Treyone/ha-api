/**
 * Created by ycorneille on 21/03/14.
 */
var net = require('net');

//{socket:'/tmp/haproxy.sock'}
//{host:'bdxrev002',port:1234}
/**
 *
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
            var output = "";
            ha.on('data', function(data) {
                output += data;
            });

            ha.on('end', function() {
                                callback && callback(null,output);
            });
            if(message.indexOf('\n'==-1)){message+='\n';}
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