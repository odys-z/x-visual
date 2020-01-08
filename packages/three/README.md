# ACW

For webpack, GLFLoader can be referenced to node_modules/three/examples. But Mocha
won't tolerate this. It reports error like:

```
.../x-visual/node_modules/three/examples/jsm/loaders/GLTFLoader.js:9
import {
       ^

SyntaxError: Unexpected token {
    at new Script (vm.js:79:7)
    at createScript (vm.js:251:10)
    at Object.runInThisContext (vm.js:303:10)
    at Module._compile (internal/modules/cjs/loader.js:656:28)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:699:10)
    at Module.load (internal/modules/cjs/loader.js:598:32)
    at tryModuleLoad (internal/modules/cjs/loader.js:537:12)
    at Function.Module._load (internal/modules/cjs/loader.js:529:3)
    at Module.require (internal/modules/cjs/loader.js:636:17)
    at require (internal/modules/cjs/helpers.js:20:18)
    at eval (webpack:///external_%22three/examples/jsm/loaders/GLTFLoader%22?:1:18)
    at Object.three/examples/jsm/loaders/GLTFLoader (/home/ody/git/x-visual/dist/testBundle.js:548:1)
    at __webpack_require__ (/home/ody/git/x-visual/dist/testBundle.js:20:30)
    at eval (webpack:///./lib/xutils/assetkeepr.js?:5:95)
    at Module../lib/xutils/assetkeepr.js (/home/ody/git/x-visual/dist/testBundle.js:336:1)
    at __webpack_require__ (/home/ody/git/x-visual/dist/testBundle.js:20:30)
    at eval (webpack:///./lib/sys/thrender.js?:8:79)
    at Module../lib/sys/thrender.js (/home/ody/git/x-visual/dist/testBundle.js:288:1)
    at __webpack_require__ (/home/ody/git/x-visual/dist/testBundle.js:20:30)
    at eval (webpack:///./lib/xapp/xworld.js?:11:71)
    at Module../lib/xapp/xworld.js (/home/ody/git/x-visual/dist/testBundle.js:324:1)
    at __webpack_require__ (/home/ody/git/x-visual/dist/testBundle.js:20:30)
    at eval (webpack:///./test/xobj.case.js?:8:77)
	...
```

Guessing this is because js source not compiled into testBundle.js.

So the temporary solution for this is copy it here and compile into testBundle.js.

*Please let him know if there are better way*
