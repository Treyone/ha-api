# HA API #
A NodeJS API for HAProxy

## Usage ##
    var HAApi= require('ha-api'),
		haapi = new HAApi({
			socket: {
				host : 'haproxy.address',
				port : 1234
			},
			apiPort : 1111
		})
	
## Config Parameters ##
**socket** : HAProxy socket information. It can be either a TCP socket
	{
		host : 'haproxy.address',
		port : 1234
	}
or a UNIX local socket :
{
	socket : '/tmp/haproxy.sock'
}

**app** : optional express() instance. If provided, API methods will be added to this isntance. If not, a new express() will be created.

**apiPort** : TCP port to expose the REST API.  
