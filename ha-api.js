var HAApi = function(options){
    'use strict';
    options = options ||{};


    var HARemote = require('./ha-remote'),
        haremote = this.haremote = new HARemote(options.socket),
        express = require('express'),
        app;

    if(options.app){
        app = options.app;
    }else{

        app = express();
    }
    /**
     * handles REST answers
     * @param res Express response object
     * @returns {Function}
     */
    var responder = function(res){
        return function(err,obj){
            var response;
            res.contentType('application/json');
            //there's an error on my side
            if(err){
                response = JSON.stringify(err);
                res.status(400).send(response);
            }
            else{
                //HA returns '\n' when he's happy.
                if(obj=='\n'){
                    response='OK';
                }
                else{
                    //and an error message when he's not.
                    response=JSON.stringify(obj);
                }
                res.send(response);
            }
            res.end();
        };
    };
    app.configure(function(){
        app.use(express.bodyParser());
    });

    app.post('/backend/:backend/server/:server/:operation',function(req,res){
        switch(req.params.operation){
            case 'disable':{
                haremote.backend(req.params.backend).server(req.params.server).disable(responder(res));
                break;
            }
            case 'enable':{
                haremote.backend(req.params.backend).server(req.params.server).enable(responder(res));
                break;
            }
            default:{
                responder(res).call(null,'Incorrect operation: '+req.params.operation);
            }
        }
    });

    app.get('/stats',function(req,res){
        haremote.stats(responder(res));
    });

    app.post('/frontend/:frontend/:operation',function(req,res){
        switch(req.params.operation){
            case 'disable':{
                haremote.frontend(req.params.frontend).disable(responder(res));
                break;
            }
            case 'enable':{
                haremote.frontend(req.params.frontend).enable(responder(res));
                break;
            }
            default:{
                responder(res).call(null,'Incorrect operation: '+operation);
            }
        }
    });

    if(options.apiPort){
        var server = require('http').createServer(app);
        server.listen(options.apiPort);
    }


};

module.exports = HAApi;