/** <h3>Tiles manage</h3>
 * <p>1. Mangage tiles, handling goe-coordinate system convertion to three.js.</p>
 * <p>2. Multithread manager for accessing networ, (and json mesh convertion?)
 */

// Add a listener to message: 'ping', 'osm', 'stop', 'tile'
self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {
    case 'ping':
      self.postMessage('Pong: ' + data.msg.name);
      break;
    case 'osm':
      // self.postMessage('Pong: ' + data.msg.name);
	  // endup with postMessage({code: 'texture'}, tile s)
	  console.log('osm:data', data);
	  loadOsm(data.xyz);
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg );
      self.close(); // Terminates the worker.
      break;
    case 'tile': // handle tile
      console.log(data);
	  break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);

function loadOsm(xyzs) {
	console.log('loading', xyzs);
	if (Array.isArray(xyzs)) {
		xyzs.forEach(function(xyz, ix){
			loadTile(xyz);
		});
	}
	else if (typeof xyzs === 'object' && typeof xyzs.z === 'number')
		loadTile(xyzs);
}

function loadTile(xyz) {
	var url;
	if (typeof xyz === 'string' ) {
		url = 'https://a.tile.openstreetmap.org/'
				+ xyz.z + '/' + xyz.x + '/' + xyz.y + '.png';
	}
	else {
		url = 'https://a.tile.openstreetmap.org/'
				+ xyz[2] + '/' + xyz[0] + '/' + xyz[1] + '.png';
	}
	console.log(url);
	Request.getOsm(url, e => {
		console.log(e.length, e);
		var e0 = new Uint8Array(e);
		postMessage({code: 'tile', img: e0, xyz}, [e0.buffer]);
	});
}

/**Http request used by worker.
 * For request in worker, see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
 * @class
 */
class Request {
	static load (url, callback) {
		const req = new XMLHttpRequest();
		req.responseType = "arraybuffer";

		const timer = setTimeout(t => {
				if (req.readyState !== 4) {
					req.abort();
					callback('status');
				}
			}, 10000);

		req.onreadystatechange = () => {
			if (req.readyState !== 4) {
				return;
			}

			clearTimeout(timer);

			if (!req.status || req.status < 200 || req.status > 299) {
				callback('status');
				return;
			}

			callback(null, req);
		};

		req.open('GET', url);
		req.send(null);

		return {
		  abort: () => {
		    req.abort();
		  }
		};
	}

	static getOsm (url, callback) {
		return this.load(url, (err, res) => {
			if (err) {
				callback(err);
				return;
			}
			if (!res.response) {
				callback('content not correct');
				return;
			}

			let json;
			try {
				console.log(res.response);
				// json = JSON.parse(res.responseText);
				callback(res.response);
			} catch (ex) {
				// console.warn('Could not parse JSON from ' + url);
				callback('content');
			}
		});
	}

	static getJSON (url, callback) {
	    return this.load(url, (err, res) => {
	      if (err) {
	        callback(err);
	        return;
	      }
	      if (!res.responseText) {
	        callback('content');
	        return;
	      }

	      let json;
	      try {
	        json = JSON.parse(res.responseText);
	        callback(null, json);
	      } catch (ex) {
	        console.warn('Could not parse JSON from ' + url);
	        callback('content');
	      }
	    });
	}
}
