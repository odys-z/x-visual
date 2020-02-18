/**
 * Vector and Matrix Helper
 * @module xv.opensource.vec
 */

/** Vector helper
 * refrence algorithm: https://evanw.github.io/lightgl.js/docs/main.html
 */
export function vec3(x, y, z) {
	if (Array.isArray(x)) {
		this.x = x[0];
		this.x = y[0];
		this.x = z[0];
	}
	else {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
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

  eq: function(v) {
    if (Array.isArray(v))
      return this.x == v[0] && this.y == v[1] && this.z == v[1];
    return this.x == v.x && this.y == v.y && this.z == v.z;
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
  }
};

// Static Methods
// vec3.randomDirection() returns a vector with a length of 1 and a statistically uniform direction.
// Vector.lerp() performs linear interpolation between two vectors.

vec.js = function(xyz) {
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
  if (b instanceof vec3) {
	  c.x = a.x + b.x; c.y = a.y + b.y; c.z = a.z + b.z;
  }
  else {
	  c.x = a.x + b; c.y = a.y + b; c.z = a.z + b;
  }
  return c;
};

vec3.subtract = function(a, b, c) {
  if (b instanceof vec3) { c.x = a.x - b.x; c.y = a.y - b.y; c.z = a.z - b.z; }
  else { c.x = a.x - b; c.y = a.y - b; c.z = a.z - b; }
  return c;
};

vec3.mul = function(a, b, c) {
  if (b instanceof vec3) { c.x = a.x * b.x; c.y = a.y * b.y; c.z = a.z * b.z; }
  else { c.x = a.x * b; c.y = a.y * b; c.z = a.z * b; }
  return c;
};

vec3.div = function(a, b, c) {
  if (b instanceof vec3) {
	  c.x = a.x / b.x; c.y = a.y / b.y; c.z = a.z / b.z;
  }
  else {
	  c.x = a.x / b; c.y = a.y / b; c.z = a.z / b;
  }
  return c;
};

vec3.cross = function(a, b, c) {
  c.x = a.y * b.z - a.z * b.y;
  c.y = a.z * b.x - a.x * b.z;
  c.z = a.x * b.y - a.y * b.x;
  return c;
};

vec3.unit = function(a, b) {
  var length = a.length();
  b.x = a.x / length;
  b.y = a.y / length;
  b.z = a.z / length;
  return b;
};

vec3.fromAngles = function(theta, phi) {
  return new vec3(Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi));
};

vec3.randomDirection = function() {
  return vec3.fromAngles(Math.random() * Math.PI * 2, Math.asin(Math.random() * 2 - 1));
};

vec3.min = function(a, b) {
  return new vec3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
};

vec3.max = function(a, b) {
  return new vec3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
};

vec3.lerp = function(a, b, fraction) {
  return b.subtract(a).multiply(fraction).add(a);
};

vec3.mix = vec3.lerp;

vec3.fromArray = function(a) {
  return new vec3(a[0], a[1], a[2]);
};

vec3.angleBetween = function(a, b) {
  return a.angleTo(b);
};
