/**
 * Affine Transformation Helper
 */
import {Quaternion, Vector3} from '../../packages/three/three.module-MRTSupport'
import {vec3, mat4} from './vec'
import xmath from "./math"

/**Affine transformation buffer of scale, translate &amp; quaternion.
 * @class Affine
 */
export class Affine {
    constructor() {
		this.scale = new vec3(1, 1, 1);
		this.translate = new vec3();
		this.quaternion = new Quaternion;
	}

	i () {
		this.scale.set(1, 1, 1,);
		this.translate.set(0);
		this.quaternion.set(0, 0, 0, 1);
		return this;
	}

	copy(aff) {
		this.scale.set(aff.scale);
		this.translate.set(aff.translate);
		this.quaternion.copy(aff.quaternion);
		return this;
	}

	decompose(jsMatrix) {
		var s = new Vector3();
		var p = new Vector3();
		jsMatrix.decompose(p, this.quaternion, s);
		this.scale.set(s.x, s.y, s.z);
		this.translate.set(p.x, p.y, p.z);
		return this;
	}

	/**
	 * <a href='https://github.com/mrdoob/three.js/blob/25d16a2c3c54befcb3916dbe756e051984c532a8/src/math/Matrix4.js#L704'>
	 * Three.js Matrix.compose()</a>
	 */
	composeTo(jsMatrix) {
		const te = jsMatrix.elements;

		const x = this.quaternion._x, y = this.quaternion._y, z = this.quaternion._z, w = this.quaternion._w;
		const x2 = x + x,  y2 = y + y,  z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;

		const sx = this.scale.x, sy = this.scale.y, sz = this.scale.z;

		te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
		te[ 1 ] = ( xy + wz ) * sx;
		te[ 2 ] = ( xz - wy ) * sx;
		te[ 3 ] = 0;

		te[ 4 ] = ( xy - wz ) * sy;
		te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
		te[ 6 ] = ( yz + wx ) * sy;
		te[ 7 ] = 0;

		te[ 8 ] = ( xz + wy ) * sz;
		te[ 9 ] = ( yz - wx ) * sz;
		te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
		te[ 11 ] = 0;

		te[ 12 ] = this.translate.x;
		te[ 13 ] = this.translate.y;
		te[ 14 ] = this.translate.z;
		te[ 15 ] = 1;

		return this;
	}

	mul(aff) {
		this.scale.mul(aff.scale);
		this.translate.add(aff.translate);
		// this.quaternion.mul(aff.quaternion);
		Affine.multiply(aff.quaternion, this.quaternion, this.quaternion);
		return this;
	}

	mulpost(aff) {
		this.scale.mul(aff.scale);
		this.translate.add(aff.translate);
		Affine.multiply(this.quaternion, aff.quaternion, this.quaternion);
		return this;
	}

	/**<a href='https://github.com/mrdoob/three.js/blob/25d16a2c3c54befcb3916dbe756e051984c532a8/src/math/Quaternion.js#L525'>
	 * Three.js Quaternion.multiplyQuaternions()</a>
	 */
	static multiply ( a, b, c ) {
		if (!c)
			c = new Quaternion();
		// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
		const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
		const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

		c._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		c._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		c._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		c._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
		return c;
	}

	/**Combine an affine transformation.
	 * @param {AffineTrans} transf affine transformation object
	 * @return {mat4} this
	 * @member Affine#appAffine
	 */
    appAffine (transf) {
        if (transf.translate) {
          	this.translate.add(transf.translate);
        }
        else if (transf.interpos) {
            // a + (b - a) * t, where t [0, 1]; a, b are vec3
            // do not affect the original position values
            var t = transf.interpos.t;
            var v = transf.vec3;
            if (transf.interpos.positions) {
                v.set(transf.interpos.positions[0])
                v.lerpTo(transf.interpos.positions[1], t.t);
            	this.translate.add(v);
            }
            if (transf.interpos.scale) {
                v.set(transf.interpos.scale[0])
                v.lerpTo(transf.interpos.scale[1], t.t);
            	// this.scale(v.x, v.y, v.z);
            	this.scale.mul(v);
            }

            if(transf.interpos.rotate){

            	var r = transf.interpos.rotate;
            	var t = transf.interpos.t;
            	//
            	var deg0 = r.deg[0];
            	var deg1 = r.deg[1];
            	/*
            	if(r.set === true){
            		var a =  xmath.radian(r.deg[0]);
            		var b = xmath.radian(r.deg[1]);
            		r.startQuaternion = rotate(a, r.axis);
            		r.endQuaternion = rotate(b, r.axis);
            		r.set = false;
            	}


            	Quaternion.slerp( r.startQuaternion, r.endQuaternion, this.quaternion, t.t );
            	*/
            	let t1 = t.t;
            	let mdeg = deg0 * (1 - t1) + deg1 * t1;
            	this.quaternion.setFromAxisAngle({x:r.axis[0],y:r.axis[1],z:r.axis[2]},xmath.radian(mdeg));

            }
        }
        else if (transf.rotate) {
        	//console.log(transf.rotate);
            var r = transf.rotate
            var a = r.deg !== undefined ? xmath.radian(r.deg) : r.rad;
            r.q = rotate(a, r.axis, r.q);
            this.quaternion.multiply(r.q);
        }
        else if (transf.reflect) {
            this.scale.reflect(transf.reflect);
        }
        // if (transf.shear) {
        //     this.mul(mat4.shear(transf.shear, _m4));
        // }
        else if (transf.scale) {
            this.scale.mul(transf.scale);
        }
        return this;

		/**Get quaternion from rotation definition.
		 * @param {number} theta rotating angle in radian.
		 * @param {vec3} axis must normalized
		 * @param {Quaternion} q
		 */
		function rotate(theta, axis, q) {
            if (!q)
                q = new Quaternion();
			// https://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
			var ax = [0, 0, 0];
			vec3.unit(axis, axis);

			// var ax = axis.x, ay = axis.y, az = axis.z;
			var ax = axis[0], ay = axis[1], az = axis[2];
			q.x = ax * Math.sin(theta/2)
			q.y = ay * Math.sin(theta/2)
			q.z = az * Math.sin(theta/2)
			q.w = Math.cos(theta/2)
            return q;
		}
    }
}
