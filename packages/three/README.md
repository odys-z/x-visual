# ACW

For webpack, SVGLoader can referencing to node_modules/three/examples. But Mocha
won't tolerate this. It reports error like:

```

/home/ody/d/git/x-visual/node_modules/three/examples/jsm/loaders/SVGLoader.js:7
import {
       ^

SyntaxError: Unexpected token {
    at new Script (vm.js:79:7)
    at createScript (vm.js:251:10)
    at Object.runInThisContext (vm.js:303:10)
    at Module._compile (internal/modules/cjs/loader.js:657:28)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:700:10)
    at Module.load (internal/modules/cjs/loader.js:599:32)
    at tryModuleLoad (internal/modules/cjs/loader.js:538:12)
    at Function.Module._load (internal/modules/cjs/loader.js:530:3)
    at Module.require (internal/modules/cjs/loader.js:637:17)
    at require (internal/modules/cjs/helpers.js:22:18)
    at eval (webpack:///external_%22three/examples/jsm/loaders/SVGLoader%22?:1:18)
    at Object.three/examples/jsm/loaders/SVGLoader (/home/ody/d/git/x-visual/dist/testBundle.js:717:1)
    at __webpack_require__ (/home/ody/d/git/x-visual/dist/testBundle.js:20:30)
    at eval (webpack:///./lib/xutils/assetkeepr.js?:6:94)
    at Module../lib/xutils/assetkeepr.js (/home/ody/d/git/x-visual/dist/testBundle.js:372:1)
    at __webpack_require__ (/home/ody/d/git/x-visual/dist/testBundle.js:20:30)
    at eval (webpack:///./lib/xapp/xworld.js?:8:79)
    at Module../lib/xapp/xworld.js (/home/ody/d/git/x-visual/dist/testBundle.js:360:1)
    at __webpack_require__ (/home/ody/d/git/x-visual/dist/testBundle.js:20:30)
    at eval (webpack:///./test/api-visual-obj3.case.js?:10:74)
    at Module../test/api-visual-obj3.case.js (/home/ody/d/git/x-visual/dist/testBundle.js:555:1)
    at __webpack_require__ (/home/ody/d/git/x-visual/dist/testBundle.js:20:30)
    at webpackContext (webpack:///./test_sync_\.case\.js$?:16:9)
    at Array.forEach (<anonymous>)
    at eval (webpack:///./test/all.js?:10:16)

	...
```

Guessing this is due to js source not compiled into testBundle.js.

So the temporary solution for this is copy it here and compile into testBundle.js.

Seam as GLFLoader, but it's already been changed to x-visual version.

*Please let him know if there are better way*
