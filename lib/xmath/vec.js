/**
 * Vector and Matrix Helper
 * @module xv.xmath.vec
 */

import * as THREE from 'three'

export function radian(degree) {
    return degree * Math.PI/180;
}

/**
 * round_to_precision(11, 8); // outputs 8
 * round_to_precision(3.7, 0.5); // outputs 3.5
 * @param {number} x
 * @param {number} precision, default 1
 * @return {number} round up
 */
function round_to_precision(x, precision) {
    var y = +x + (precision === undefined ? 0.5 : precision/2);
    return y - (y % (precision === undefined ? 1 : +precision));
}

/** Vector helper
 * refrence algorithm:
 * https://evanw.github.io/lightgl.js/docs/main.html
 */
export function vec3(x, y, z) {
	if (Array.isArray(x)) {
		this.x = x[0]; this.y = x[1]; this.z = x[2];
	}
    else if (x instanceof THREE.Vector3) {
		this.x = x.x || 0; this.y = x.y || 0; this.z = x.z || 0;
    }
	else {
		this.x = x || 0; this.y = y || 0; this.z = z || 0;
	}
}

vec3.prototype = {
  js: function() {
	return new THREE.Vector3(this.x, this.y, this.z);
  },

  neg: function() {
    this.x = -this.x, this.y = -this.y, this.z = -this.z;
    return this;
  },

  add: function(v) {
    if (v instanceof vec3) {
        this.x += v.x; this.y += v.y; this.z += v.z;
    }
	else if (Array.isArray(v)) {
        this.x += v[0]; this.y += v[1]; this.z += v[2];
    }
    else {
		this.x += v; this.y += v; this.z += v;
	}
    return this;
  },

  sub: function(v) {
    if (v instanceof vec3) {
		this.x -= v.x; this.y -= v.y; this.z -= v.z;
	}
	else if (Array.isArray(v)) {
		this.x -= v[0]; this.y -= v[1]; this.z -= v[2];
	}
    else {
		this.x -= v; this.y -= v; this.z -= v;
	}
    return this;
  },

  mul: function(v) {
    if (v instanceof vec3) {
		this.x *= v.x; this.y *= v.y; this.z *= v.z;
	}
	else if (Array.isArray(v)) {
		this.x *= v[0]; this.y *= v[1]; this.z *= v[2];
	}
    else {
		this.x *= v; this.y *= v; this.z *= v;
	}
	return this;
  },

  div: function(v) {
    if (v instanceof vec3) {
		this.x /= v.x, this.y /= v.y, this.z /= v.z;
	}
	else if (Array.isArray(v)) {
		this.x /= v[0]; this.y /= v[1]; this.z /= v[2];
	}
    else {
		this.x /= v; this.y /= v; this.z /= v;
	}
	return this;
  },

  eq: function(v, delta) {
	// if (delta) {
	// 	if (Array.isArray(v))
	// 		return this.x == v[0] && this.y == v[1] && this.z == v[1];
	// 	return this.x == v.x && this.y == v.y && this.z == v.z;
	// }
	// else {
	// 	if (Array.isArray(v))
	// 		return Math.abs(this.x - v[0]) <= 0.001
	// 			&& Math.abs(this.y - v[1]) <= 0.001
	// 			&& Math.abs(this.z - v[1]) <= 0.001;
	// 	return Math.abs(this.x - v.x) <= 0.001
	// 		&& Math.abs(this.y - v.y) <= 0.001
	// 		&& Math.abs(this.z - v.z) <= 0.001;
	// }
	if (!delta)
		delta = 0.001;
	if (Array.isArray(v))
		return Math.abs(this.x - v[0]) <= delta
				&& Math.abs(this.y - v[1]) <= delta
				&& Math.abs(this.z - v[1]) <= delta;
	else
		return Math.abs(this.x - v.x) <= delta
			&& Math.abs(this.y - v.y) <= delta
			&& Math.abs(this.z - v.z) <= delta;
  },

  dot: function(v) {
    if (Array.isArray(v))
      return this.x * v[0] + this.y * v[1] + this.z * v[2];
    return this.x * v.x + this.y * v.y + this.z * v.z;
  },

  cross: function(v) {
    if (Array.isArray(v))
        return new vec3(
          this.y * v[2] - this.z * v[1],
          this.z * v[0] - this.x * v[2],
          this.x * v[1] - this.y * v[0]
        );

    return new vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  },

  length: function() {
    return Math.sqrt(this.dot(this));
  },

  unit: function() {
    return this.div(this.length());
  },

  min: function() {
    return Math.min(Math.min(this.x, this.y), this.z);
  },

  max: function() {
    return Math.max(Math.max(this.x, this.y), this.z);
  },

  toAngles: function() {
    return {
      theta: Math.atan2(this.z, this.x),
      phi: Math.asin(this.y / this.length())
    };
  },

  angleTo: function(a) {
    return Math.acos(this.dot(a) / (this.length() * a.length()));
  },

  arr: function(n) {
    return [this.x, this.y, this.z].slice(0, n || 3);
  },

  clone: function() {
    return new vec3(this.x, this.y, this.z);
  },

  init: function(x, y, z) {
    this.x = x; this.y = y; this.z = z;
    return this;
  },

  mat4: function(m4) {
	var m = m4.m;
	var x = m[0] * this.x + m[1] * this.y + m[2] * this.z + m[3];
	var y = m[4] * this.x + m[5] * this.y + m[6] * this.z + m[7];
	var z = m[8] * this.x + m[9] * this.y + m[10] * this.z + m[11];
	this.x = x; this.y = y; this.z = z;
	return this.div(m[12] * this.x + m[13] * this.y + m[14] * this.z + m[15]);
  },

  mat3: function(m4) {
	var m = m4.m;
	var x = m[0] * this.x + m[1] * this.y + m[2] * this.z;
	var y = m[4] * this.x + m[5] * this.y + m[6] * this.z;
	var z = m[8] * this.x + m[9] * this.y + m[10] * this.z;
	this.x = x; this.y = y; this.z = z;
	return this;
  },

};

// Static Methods
{
	/** create a THREE.Vector3 */
	vec3.js = function(xyz) {
	  if (Array.isArray(xyz))
	    return new THREE.Vector3(xyz[0], xyz[1], xyz[2]);
	  else // {x, y, z} or vec3
	    return new THREE.Vector3(xyz.x, xyz.y, xyz.z);
	}

	vec3.neg = function(a, b) {
	  if (b) {
	    b.x = -a.x; b.y = -a.y; b.z = -a.z;
	    return b;
	  }
	  else {
		  a.x = -a.x; a.y = -a.y; a.z = -a.z;
		  return a;
	  }
	};

	vec3.add = function(a, b, c) {
	  if (! (c instanceof vec3))
	  	c = new vec3(c);
	  if (Array.isArray(a))
	  	a = new vec3(a);
	  if (b instanceof vec3) {
		  c.x = a.x + b.x; c.y = a.y + b.y; c.z = a.z + b.z;
	  }
	  else {
		  c.x = a.x + b; c.y = a.y + b; c.z = a.z + b;
	  }
	  return c;
	};

	vec3.sub = function(a, b, c) {
	  if (! (c instanceof vec3))
	  	c = new vec3(c);
	  if (Array.isArray(a))
	  	a = new vec3(a);
	  if (b instanceof vec3) { c.x = a.x - b.x; c.y = a.y - b.y; c.z = a.z - b.z; }
	  else { c.x = a.x - b; c.y = a.y - b; c.z = a.z - b; }
	  return c;
	};

	vec3.mul = function(a, b, c) {
	  if (! (c instanceof vec3))
	  	c = new vec3(c);
	  if (Array.isArray(a))
	  	a = new vec3(a);
	  if (b instanceof vec3) {
		  c.x = a.x * b.x; c.y = a.y * b.y; c.z = a.z * b.z;
	  }
	  else { c.x = a.x * b; c.y = a.y * b; c.z = a.z * b; }
	  return c;
	};

	vec3.div = function(a, b, c) {
	  if (! (c instanceof vec3))
	  	c = new vec3(c);
	  if (Array.isArray(a))
	  	a = new vec3(a);
	  if (b instanceof vec3) {
		  c.x = a.x / b.x; c.y = a.y / b.y; c.z = a.z / b.z;
	  }
	  else {
		  c.x = a.x / b; c.y = a.y / b; c.z = a.z / b;
	  }
	  return c;
	};

	// right hand rule
	vec3.cross = function(a, b, c) {
	  if (! (c instanceof vec3))
	  	c = new vec3(c);
	  if (Array.isArray(a))
	  	a = new vec3(a);

	  c.x = a.y * b.z - a.z * b.y;
	  c.y = a.z * b.x - a.x * b.z;
	  c.z = a.x * b.y - a.y * b.x;
	  return c;
	};

	vec3.unit = function(a, b) {
	  if (! (b instanceof vec3))
	  	b = new vec3(b);
	  if (Array.isArray(a))
	  	a = new vec3(a);
	  var length = a.length();
	  b.x = a.x / length;
	  b.y = a.y / length;
	  b.z = a.z / length;
	  return b;
	};

	vec3.fromAngles = function(theta, phi) {
	  return new vec3(Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi));
	};

	/** returns a vector with a length of 1 and a statistically uniform direction. */
	vec3.randomDirection = function() {
	  return vec3.fromAngles(Math.random() * Math.PI * 2, Math.asin(Math.random() * 2 - 1));
	};

	vec3.min = function(a, b) {
	  return new vec3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
	};

	vec3.max = function(a, b) {
	  return new vec3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
	};

	/** performs linear interpolation between two vectors. */
	vec3.lerp = function(a, b, fraction) {
	  return b.subtract(a).multiply(fraction).add(a);
	};

	/** Vector.lerp() performs linear interpolation between two vectors. */
	vec3.mix = vec3.lerp;

	vec3.fromArray = function(a) {
	  return new vec3(a[0], a[1], a[2]);
	};

	vec3.angleBetween = function(a, b) {
	  return a.angleTo(b);
	};
}

const hasFloat32Array = (typeof Float32Array != 'undefined');

/** Represents a 4x4 matrix stored in row-major order that uses Float32Arrays
 * when available.
 * Notes on Three.js matrix order:
 * https://threejs.org/docs/index.html#api/en/math/Matrix4
 * For users, it looks like row-major order. It shouldn't matter if two type of
 * matrix's array haven't been messed up.
 * refrence algorithm:
 * https://evanw.github.io/lightgl.js/docs/matrix.html
 */
export function mat4() {
	var m;
    if (arguments[0] instanceof THREE.Matrix4)
        m = arguments[0].transpose().toArray();
    else if (arguments[0] instanceof mat4)
        m = arguments[0].m;
    else
        m = Array.prototype.concat.apply([], arguments);
	if (!m.length) {
		m =[1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1 ];
	}
	this.m = hasFloat32Array ? new Float32Array(m) : m.clone ? m.clone()
        : [ m[0], m[1], m[2], m[3],
            m[4], m[5], m[6], m[7],
            m[8], m[9], m[10], m[11],
            m[12], m[13], m[14], m[15] ];
}

mat4.prototype = {
	js: function() {
		var mjs = new THREE.Matrix4();
		mjs.set(...this.m);
		return mjs;
	},

    /**Set this matrix value to THREE.Matrix4, jsMatrix4.
     * @param {THREE.Matrix4} jsMatrix4
     * @return {THREE.Matrix4} jsMatrix4
     */
    put2js: function(jsMatrix4) {
        jsMatrix4.set(...this.m);
        return jsMatrix4;
    },

    i: function() {
        mat4.I(this);
        return this;
    },

	/**Returns the matrix that when multiplied with this matrix results in the
	 * identity matrix. */
	inverse: function() {
		this.m = mat4.inverse(this).m;
		return this;
	},

	/**Returns this matrix, exchanging columns for rows. */
	transpose: function() {
		this.m = mat4.transpose(this).m;
		return this;
	},

	/**Returns the concatenation of the transforms for this matrix and matrix.
	 * This emulates the OpenGL function glMultMatrix().
	 * @param {mat4} matrix
	 * @return {mat4} this */
	mulpost: function(matrix) {
        if (typeof matrix === 'number')
            matrix = mat4.diag(matrix);

        var a = this.m, b = matrix.m || matrix.elements;
        if (a === undefined || b === undefined) {
            debugger;
        }
        var r = [
            a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12],
            a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13],
            a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14],
            a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15],

            a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12],
            a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13],
            a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14],
            a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15],

            a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12],
            a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13],
            a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14],
            a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15],

            a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12],
            a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13],
            a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14],
            a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15]];

        this.m.set(r);
        return this;
	},

	/**Multiply by matrix to left
	 * @param {mat4} matrix
	 * @return {mat4} this */
	mul: function(matrix) {
		// this.m = mat4.mul(matrix, this).m;
		// return this;
        if (typeof matrix === 'number')
            matrix = mat4.diag(matrix);

        var a = matrix.m, b = this.m;
        var r = [
            a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12],
            a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13],
            a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14],
            a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15],

            a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12],
            a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13],
            a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14],
            a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15],

            a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12],
            a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13],
            a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14],
            a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15],

            a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12],
            a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13],
            a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14],
            a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15]];

        this.m.set(r);
        return this;
	},

	scale: function(x, y, z) {
		if (Array.isArray(x)) {
			y = x[1]; z = x[2]; x = x[0];
		}
		else if (x.x && !y) {
			y = x.y; z = x.z; x = x.x;
		}
		var m = this.m;

		// m[0]*= x; m[1] = 0; m[2] = 0; m[3] = 0;
		// m[4] = 0; m[5]*= y; m[6] = 0; m[7] = 0;
		// m[8] = 0; m[9] = 0; m[10]*= z; m[11] = 0;
		// m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
		// FIXME FIXME FIXME not correct
		m[0]*= x;
		m[5]*= y;
		m[10]*= z;
		return this;
	},

    translate: function(x, y, z) {
        // m[0] = 1; m[1] = 0; m[2] = 0; m[3] = x;
        // m[4] = 0; m[5] = 1; m[6] = 0; m[7] = y;
        // m[8] = 0; m[9] = 0; m[10] = 1; m[11] = z;
        // m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
        var m = [1, 0, 0, x,
                 0, 1, 0, y,
                 0, 0, 1, z,
                 0, 0, 0, 1]
        this.mul({m});
        return this;
    },

    rotate: function(a, x, y, z) {
		var d = Math.sqrt(x*x + y*y + z*z);
		x /= d; y /= d; z /= d;
		var c = Math.cos(a), s = Math.sin(a), t = 1 - c;

		// m[0]  = x * x * t + c;		m[1]  = x * y * t - z * s;	m[2]  = x * z * t + y * s;	m[3]  = 0;
		// m[4]  = y * x * t + z * s;	m[5]  = y * y * t + c;		m[6]  = y * z * t - x * s;	m[7]  = 0;
		// m[8]  = z * x * t - y * s;	m[9]  = z * y * t + x * s;	m[10] = z * z * t + c;		m[11] = 0;
		// m[12] = 0;					m[13] = 0;					m[14] = 0;					m[15] = 1;
        var m =[x * x * t + c,        x * y * t - z * s,      x * z * t + y * s,    0,
		        y * x * t + z * s,    y * y * t + c,          y * z * t - x * s,    0,
		        z * x * t - y * s,    z * y * t + x * s,      z * z * t + c,        0,
		        0,                    0,                      0,                    1];
        this.mul({m});
		return this;
    },

    reflect: function(xyz, y_, z_) {
        var x, y, z;
        if (xyz instanceof vec3) {
            x = xyz.x < 0 ? -1 : 1;
            x = xyz.y < 0 ? -1 : 1;
            z = xyz.z < 0 ? -1 : 1;
        }
        else if (Array.isArray(xyz)) {
            x = xyz[0] < 0 ? -1 : 1;
            y = xyz[1] < 0 ? -1 : 1;
            z = xyz[2] < 0 ? -1 : 1;
        }
        else if ( y_ !== undefined && z_ !== undefined) {
            x = xyz < 0 ? -1 : 1;
            y = y_ < 0 ? -1 : 1;
            z = z_ < 0 ? -1 : 1;
        }
        else x = y = z = xyz < 0 ? -1 : 1;

        var m = this.m;
        m[0] *= x;
        m[5] *= y;
        m[10] *= z;
        return this;
    },

	/**Transforms the vector as a point with a w coordinate of 1.
	 * This means translations will have an effect, for example.
	 * Noet: doubting that this should been replaced by vec3.transform(m4, w) and
	 * vec4.transform(m4).
	 * @param {vec3} v
	 */
	transformPoint: function(v) {
		console.warn("Doubting that this should been replaced by vec3.transform4(m4, w) and vec4.transform4(m4).")
		var m = this.m;
		return new vec3(
			m[0] * v.x + m[1] * v.y + m[2] * v.z + m[3],
			m[4] * v.x + m[5] * v.y + m[6] * v.z + m[7],
			m[8] * v.x + m[9] * v.y + m[10] * v.z + m[11]
		).div(m[12] * v.x + m[13] * v.y + m[14] * v.z + m[15]);
	},

	transformVector: function(v) {
		console.warn("Doubting that mat4.transformVector() is not needed - norm transform?.")
		var m = this.m;
		return new Vector(
			m[0] * v.x + m[1] * v.y + m[2] * v.z,
			m[4] * v.x + m[5] * v.y + m[6] * v.z,
			m[8] * v.x + m[9] * v.y + m[10] * v.z
		);
	},

	appAfine: function(affine) {
		if (affine.translate) {
			var t = affine.translate;
			this.translate(t[0], t[1], t[2]);
		}
		if (affine.rotate) {
			var r = affine.rotate
			var a = r.deg !== undefined ? radian(r.deg) : r.rad;
			r = r.axis;
			this.rotate(a, r[0], r[1], r[2]);
		}
		if (affine.reflect) {
			this.reflect(affine.reflect);
		}
		// if (affine.shear) {
		// 	this.mul(mat4.shear(affine.shear, _m4));
		// }
		if (affine.scale) {
			this.scale(affine.scale);
		}
		return this;
	},

    eq: function(m4, delta) {
        if (!delta) delta = 0.001;
        if (m4 instanceof THREE.Matrix4) {
            m4 = {m: m4.toArray()};
            var te = m4.m;
    		var tmp;
    		tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
    		tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
    		tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

    		tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
    		tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
    		tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;
        }
        for (var ij = 0; ij < this.m.length; ij++)
            if (Math.abs(this.m[ij] - m4.m[ij]) > delta)
                return false;
        return true;
	},

    precision: function(precision) {
        this.m = this.m.map(v =>
            Number.parseInt(v) + Number((v % 1).toPrecision(precision))
        );
        return this;
    },

    log: function(precision, log) {
        var row = 'mat4 { m =\n  ';
        precision = precision ? precision : 2;
        var p = 0.1 ** precision;
        for (var rx = 0; rx < 4; rx++) {
            for (var ex = rx * 4; ex < (rx + 1) * 4; ex++) {
                var y = this.m[ex];
                var r = y % 1;
                // row += `${y - r + (Math.abs(r) < p ? '' : r.toPrecision(precision))},\t`;
                var rs = r.toPrecision(precision).replace(/^0./, '').substring(0, precision);
                row += `${y - r}.${Math.abs(r) < p ? '' : rs},\t`;
            }
            row += '\n  ';
        }
        return row + '}';
    }
};

{
	mat4.js = function(mat4js) {
		if (mat4js instanceof THREE.Matrix4) {
        	var js = new THREE.Matrix4();
            js.set(...mat4js.toArray());
            return js;
        }
        else if (mat4js instanceof Float32Array) {
        	var js = new THREE.Matrix4();
            js.set(...mat4js);
            return js;
        }
        else if (mat4js instanceof mat4) {
        	var js = new THREE.Matrix4();
            js.set(...mat4js.m);
            return js;
        }
		else return new THREE.Matrix4();
	},

	// mat4.of = function(affine) {
	// 	return affine instanceof mat4 ? affine : new mat4().appAfine(affine);
	// };

	/* https://en.wikipedia.org/wiki/Rotation_matrix */
	mat4.rotx = function(theta) {
		var s = Math.sin(theta);
		var c = Math.cos(theta);
		return new mat4([
			1, 0,  0, 0,
			0, c, -s, 0,
			0, s,  c, 0,
			0, 0,  0, 1,
		])
	};

	mat4.roty = function(theta) {
		var s = Math.sin(theta);
		var c = Math.cos(theta);
		return new mat4([
			c, 0,  s, 0,
			0, 1,  0, 0,
			-s,0,  c, 0,
			0, 0,  0, 1,
		])
	}

	mat4.rotz = function(theta) {
		var s = Math.sin(theta);
		var c = Math.cos(theta);
		return new mat4([
			c,-s,  0, 0,
			s, c,  0, 0,
			0, 0,  1, 0,
			0, 0,  0, 1,
		])
	};

	mat4.inverse = function(matrix, result) {
	  result = result || new mat4();
	  var m = matrix.m, r = result.m;

	  r[0] = m[5]*m[10]*m[15] - m[5]*m[14]*m[11] - m[6]*m[9]*m[15] + m[6]*m[13]*m[11] + m[7]*m[9]*m[14] - m[7]*m[13]*m[10];
	  r[1] = -m[1]*m[10]*m[15] + m[1]*m[14]*m[11] + m[2]*m[9]*m[15] - m[2]*m[13]*m[11] - m[3]*m[9]*m[14] + m[3]*m[13]*m[10];
	  r[2] = m[1]*m[6]*m[15] - m[1]*m[14]*m[7] - m[2]*m[5]*m[15] + m[2]*m[13]*m[7] + m[3]*m[5]*m[14] - m[3]*m[13]*m[6];
	  r[3] = -m[1]*m[6]*m[11] + m[1]*m[10]*m[7] + m[2]*m[5]*m[11] - m[2]*m[9]*m[7] - m[3]*m[5]*m[10] + m[3]*m[9]*m[6];

	  r[4] = -m[4]*m[10]*m[15] + m[4]*m[14]*m[11] + m[6]*m[8]*m[15] - m[6]*m[12]*m[11] - m[7]*m[8]*m[14] + m[7]*m[12]*m[10];
	  r[5] = m[0]*m[10]*m[15] - m[0]*m[14]*m[11] - m[2]*m[8]*m[15] + m[2]*m[12]*m[11] + m[3]*m[8]*m[14] - m[3]*m[12]*m[10];
	  r[6] = -m[0]*m[6]*m[15] + m[0]*m[14]*m[7] + m[2]*m[4]*m[15] - m[2]*m[12]*m[7] - m[3]*m[4]*m[14] + m[3]*m[12]*m[6];
	  r[7] = m[0]*m[6]*m[11] - m[0]*m[10]*m[7] - m[2]*m[4]*m[11] + m[2]*m[8]*m[7] + m[3]*m[4]*m[10] - m[3]*m[8]*m[6];

	  r[8] = m[4]*m[9]*m[15] - m[4]*m[13]*m[11] - m[5]*m[8]*m[15] + m[5]*m[12]*m[11] + m[7]*m[8]*m[13] - m[7]*m[12]*m[9];
	  r[9] = -m[0]*m[9]*m[15] + m[0]*m[13]*m[11] + m[1]*m[8]*m[15] - m[1]*m[12]*m[11] - m[3]*m[8]*m[13] + m[3]*m[12]*m[9];
	  r[10] = m[0]*m[5]*m[15] - m[0]*m[13]*m[7] - m[1]*m[4]*m[15] + m[1]*m[12]*m[7] + m[3]*m[4]*m[13] - m[3]*m[12]*m[5];
	  r[11] = -m[0]*m[5]*m[11] + m[0]*m[9]*m[7] + m[1]*m[4]*m[11] - m[1]*m[8]*m[7] - m[3]*m[4]*m[9] + m[3]*m[8]*m[5];

	  r[12] = -m[4]*m[9]*m[14] + m[4]*m[13]*m[10] + m[5]*m[8]*m[14] - m[5]*m[12]*m[10] - m[6]*m[8]*m[13] + m[6]*m[12]*m[9];
	  r[13] = m[0]*m[9]*m[14] - m[0]*m[13]*m[10] - m[1]*m[8]*m[14] + m[1]*m[12]*m[10] + m[2]*m[8]*m[13] - m[2]*m[12]*m[9];
	  r[14] = -m[0]*m[5]*m[14] + m[0]*m[13]*m[6] + m[1]*m[4]*m[14] - m[1]*m[12]*m[6] - m[2]*m[4]*m[13] + m[2]*m[12]*m[5];
	  r[15] = m[0]*m[5]*m[10] - m[0]*m[9]*m[6] - m[1]*m[4]*m[10] + m[1]*m[8]*m[6] + m[2]*m[4]*m[9] - m[2]*m[8]*m[5];

	  var det = m[0]*r[0] + m[1]*r[4] + m[2]*r[8] + m[3]*r[12];
	  for (var i = 0; i < 16; i++) r[i] /= det;
	  return result;
	};

	mat4.transpose = function(matrix, result) {
		result = result || new mat4();
		var m = matrix.m, r = result.m;
		r[0] = m[0]; r[1] = m[4]; r[2] = m[8]; r[3] = m[12];
		r[4] = m[1]; r[5] = m[5]; r[6] = m[9]; r[7] = m[13];
		r[8] = m[2]; r[9] = m[6]; r[10] = m[10]; r[11] = m[14];
		r[12] = m[3]; r[13] = m[7]; r[14] = m[11]; r[15] = m[15];
		return result;
	};

	mat4.mul = function(left, right, result) {
	  result = result || new mat4();
	  var a = left.m, b = right.m, r = result.m;

	  r[0] = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
	  r[1] = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
	  r[2] = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
	  r[3] = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];

	  r[4] = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
	  r[5] = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
	  r[6] = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
	  r[7] = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];

	  r[8] = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
	  r[9] = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
	  r[10] = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
	  r[11] = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];

	  r[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
	  r[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
	  r[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
	  r[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];

	  return result;
	};

	mat4.I = function(result) {
	  result = result || new mat4();
	  var m = result.m;
	  m[0] = m[5] = m[10] = m[15] = 1;
	  m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[11] = m[12] = m[13] = m[14] = 0;
	  return result;
	};

	mat4.diag = function(e) {
	  var result = new mat4();
	  var m = result.m;
	  m[0] = m[5] = m[10] = m[15] = e;
	  m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[11] = m[12] = m[13] = m[14] = 0;
	  return result;
	};

	/** negative I */
	mat4.nI = function(result) {
	  result = result || new mat4();
	  var m = result.m;
	  m[0] = m[5] = m[10] = m[15] = -1;
	  m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[11] = m[12] = m[13] = m[14] = 0;
	  return result;
	};

	mat4.perspective = function(fov, aspect, near, far, result) {
	  var y = Math.tan(fov * Math.PI / 360) * near;
	  var x = y * aspect;
	  return mat4.frustum(-x, x, -y, y, near, far, result);
	};

	mat4.frustum = function(l, r, b, t, n, f, result) {
	  result = result || new mat4();
	  var m = result.m;

	  m[0] = 2 * n / (r - l);
	  m[1] = 0;
	  m[2] = (r + l) / (r - l);
	  m[3] = 0;

	  m[4] = 0;
	  m[5] = 2 * n / (t - b);
	  m[6] = (t + b) / (t - b);
	  m[7] = 0;

	  m[8] = 0;
	  m[9] = 0;
	  m[10] = -(f + n) / (f - n);
	  m[11] = -2 * f * n / (f - n);

	  m[12] = 0;
	  m[13] = 0;
	  m[14] = -1;
	  m[15] = 0;

	  return result;
	};

	mat4.ortho = function(l, r, b, t, n, f, result) {
	  result = result || new mat4();
	  var m = result.m;

	  m[0] = 2 / (r - l);
	  m[1] = 0;
	  m[2] = 0;
	  m[3] = -(r + l) / (r - l);

	  m[4] = 0;
	  m[5] = 2 / (t - b);
	  m[6] = 0;
	  m[7] = -(t + b) / (t - b);

	  m[8] = 0;
	  m[9] = 0;
	  m[10] = -2 / (f - n);
	  m[11] = -(f + n) / (f - n);

	  m[12] = 0;
	  m[13] = 0;
	  m[14] = 0;
	  m[15] = 1;

	  return result;
	};

	mat4.scale = function(x, y, z, result) {
	  result = result || new mat4();
	  var m = result.m;

	  m[0] = x; m[1] = 0; m[2] = 0; m[3] = 0;
	  m[4] = 0; m[5] = y; m[6] = 0; m[7] = 0;
	  m[8] = 0; m[9] = 0; m[10] = z; m[11] = 0;
	  m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
	  return result;
	};

	mat4.translate = function(x, y, z, result) {
	  result = result || new mat4();
	  var m = result.m;
	  m[0] = 1; m[1] = 0; m[2] = 0; m[3] = x;
	  m[4] = 0; m[5] = 1; m[6] = 0; m[7] = y;
	  m[8] = 0; m[9] = 0; m[10] = 1; m[11] = z;
	  m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
	  return result;
	};

	/**Returns a matrix that rotates by a *radian* around the vector x, y, z.
	 * You can optionally pass an existing matrix in result to avoid allocating
	 * a new matrix.
	 * This emulates the OpenGL function glRotate().
	 * @param {number} a
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {mat4} result
	 */
	mat4.rotate = function(a, x, y, z, result) {
		if (!a || (!x && !y && !z)) {
			return mat4.I(result);
		}

		result = result || new mat4();
		var m = result.m;

		var d = Math.sqrt(x*x + y*y + z*z);
		// a *= Math.PI / 180;
		x /= d; y /= d; z /= d;
		var c = Math.cos(a), s = Math.sin(a), t = 1 - c;

		m[0]  = x * x * t + c;		m[1]  = x * y * t - z * s;	m[2]  = x * z * t + y * s;	m[3]  = 0;
		m[4]  = y * x * t + z * s;	m[5]  = y * y * t + c;		m[6]  = y * z * t - x * s;	m[7]  = 0;
		m[8]  = z * x * t - y * s;	m[9]  = z * y * t + x * s;	m[10] = z * z * t + c;		m[11] = 0;
		m[12] = 0;					m[13] = 0;					m[14] = 0;					m[15] = 1;
		return result;
	};

	mat4.lookAt = function(ex, ey, ez, cx, cy, cz, ux, uy, uz, result) {
	  result = result || new mat4();
	  var m = result.m;

	  var e = new Vector(ex, ey, ez);
	  var c = new Vector(cx, cy, cz);
	  var u = new Vector(ux, uy, uz);
	  var f = e.subtract(c).unit();
	  var s = u.cross(f).unit();
	  var t = f.cross(s).unit();

	  m[0] = s.x;
	  m[1] = s.y;
	  m[2] = s.z;
	  m[3] = -s.dot(e);

	  m[4] = t.x;
	  m[5] = t.y;
	  m[6] = t.z;
	  m[7] = -t.dot(e);

	  m[8] = f.x;
	  m[9] = f.y;
	  m[10] = f.z;
	  m[11] = -f.dot(e);

	  m[12] = 0;
	  m[13] = 0;
	  m[14] = 0;
	  m[15] = 1;

	  return result;
	};
}
