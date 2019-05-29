
A NodeJS API for HAProxy.
This can be used to expose a REST API or to control haproxy from Javascript.


# DEPRECATION NOTICE
This project is not maintained anymore. If you want to get ownership, please contact me. Otherwise, you can have a look at [haproxy-sdk](https://github.com/jackpinetech/haproxy-sdk) and [haproxy-api](https://github.com/jackpinetech/haproxy-api)


# Usage #
    var HAApi= require('ha-api'),
		haapi = new HAApi({
			socket: {
				host : 'haproxy.address',
				port : 1234
			},
			apiPort : 1111
		})
	
# Prerequisites #
HAProxy must open its configuration socket. This is done in the haproxy.cfg file using the followinf syntax:

**TCP socket**

	 stats socket ipv4@0.0.0.0:1234 level admin

**Local domain UNIX socket**

 	stats socket /tmp/haproxy.sock level admin
	

# Config Parameters #
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

# Operations #
## Get HAProxy Info ##
**REST**

	GET /info
**Javascript**

	haapi.info(callback);

## Get Stats ##
**REST**

	GET /stats
**Javascript**

	haapi.stats(callback);

Returns a JSON formatted view of HAProxy stats

## Disable and enable frontend ##
**REST**

	POST /frontend/[frontend name]/disable
	POST /frontend/[frontend name]/enable
**Javascript**
	
	haapi.frontend('name').disable(callback);


## Disable and enable a backend server ##
**REST**

	POST /backend/[backend name]/server/[server name]/disable
	POST /backend/[backend name]/server/[server name]/enable

**Javascript**
	
	haapi.backend('name').server('name').disable(callback);
	haapi.backend('name').server('name').enable(callback);
