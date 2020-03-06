/** Configuration for test with Mocha.
 * For basic example (tutorial), see <a href='https://github.com/odys-z/hello/blob/master/mocha/README.md'>
 * his Hello/Mocha repository</a>
 * This is configured for testing without Node server:<pre>
	npm run build
	npm test</pre>
 */

// context = require.context('.', true, /\.case\.js$/);
// context = require.context('.', true, /tweener.case\.js$/);
// context = require.context('.', true, /basic-vec3.case\.js$/);
// context = require.context('.', true, /api-script-affines.case\.js$/);

// context = require.context('.', true, /basic-affines-.*.case\.js$/);
// context = require.context('.', true, /basic-affines-array.case\.js$/);
// context = require.context('.', true, /basic-affines-orbit.case\.js$/);
// context = require.context('.', true, /basic-affines-parallel-issue.case\.js$/);

// context.keys().forEach(context)
// module.exports = context;

// context = require.context('.', true, /basic-affines-array.case\.js$/);
// context = require.context('.', true, /basic-affines-orbit.case\.js$/);

context = require.context('.', true, /basic-obj-layers\.case\.js$/);

context.keys().forEach(context)
module.exports = context;
