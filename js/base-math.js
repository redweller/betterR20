function baseMath () {
	d20plus.math = {
		vec2: {
			/**
			 * Normalize a 2d vector.
			 * @param out Result storage
			 * @param a Vector to normalise
			 */
			normalize (out, a) {
				const x = a[0],
					y = a[1];
				let len = x*x + y*y;
				if (len > 0) {
					len = 1 / Math.sqrt(len);
					out[0] = a[0] * len;
					out[1] = a[1] * len;
				}
				return out;
			},

			/**
			 * Scale a 2d vector.
			 * @param out Resulst storage
			 * @param a Vector to scale
			 * @param b Value to scale by
			 */
			scale (out, a, b) {
				out[0] = a[0] * b;
				out[1] = a[1] * b;
				return out;
			}
		}
	};
}

SCRIPT_EXTENSIONS.push(baseMath);
