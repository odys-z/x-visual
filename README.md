MRT Support: ![npm](https://img.shields.io/npm/v/x-visual?logo=npm)

# About

X-visual is a lib for data visiualization using [Three.js](https://threejs.org)
for rendering.

Before v1.0, it's a part of a research project and a prototype of a comercial system used to verify and accumulate any usefull tech.

## NPM Version

Currently there are two main branches:

- **master** with even least minor version number for developing based on WebGL 2.

	E.g, 0.3.52

- **webgl1** with odd least minor version number for legacy function support.

	The latest branch version is 0.3.63.

# Quick Start

~~~
    npm i x-visual
~~~


## Start from the source

~~~
    git clone https://github.com/odys-z/x-visual.git
    # npm install webpack
    # npm i three
    npm i
~~~

## test (without server)

X-visual using two ways to test.

### html pages

This way needing clone from git repository like:

~~~
   git clone https://github.com/odys-z/x-visual.git
~~~

Then using webpack to transpile the tests.

There html test pages are located in test/html, which can be opened directly from
local file system:

```
    test/html/index.html
```

Some of them are explained in [docs/tests & examples](https://odys-z.github.io/x-visual/tests)

### npm test

**X-visual initially use Mocha for unit test, but is considering reducing test
cases currently. So the "npm test" way is not always working.**

The project uses Mocha and Chai for testing, imports like this.

```
    import chaiStats from 'chai-stats'
```

To build and test

~~~
    npm run build
    npm test
~~~

For installing and troubleshooting, there is a trying page may be helpful. See
[Mocha project example](https://github.com/odys-z/hello/blob/master/mocha/README.md)

- debug tip

The Mocha & Chai test cases support debugging with Node:

```
    npm test -- --inspect --inspect-brk
```

Chrome will show the inspect list at

```
    chrome://inspect
```

[\[1\]](https://developers.google.com/web/tools/chrome-devtools/javascript/breakpoints)
[[2](https://blog.andrewray.me/how-to-debug-mocha-tests-with-chrome/)]
[[3](https://nodejs.org/en/docs/guides/debugging-getting-started/)]

## Hello World

For ecs "hello world", try test/ecs.html. You should see something like this (v0.1.11)

![ecs plain js example](./docsphinx/imgs/000%20ecs-html.png)

- tip

The html pages can be load from local file system if browser allow cross domain
file access. Try (tested on Ubuntu):

```
    vim chrome
    # add this: google-chrome --allow-file-access-from-files --allow-file-access --allow-cross-origin-auth-prompt
    chmod +x chrome
    ./chrome
```

Since v0.3.56, some page can not been loaded without issue of CORS plus local files
loaded from file system, due to the new version of browser's policies.

The testing page can be visited for runing python server at x-visual's root folder:

```
    python3 -m http.server 8000 --bind 127.0.0.1
```

### Some Other Examples

- Test Case: GLTFLoader (test/html/gltf-city.html)

<img src='./docsphinx/imgs/001%20gltf-loader.png' width='800px'></img>


- Test Case: using html DOM as texture

To update rendering texture, use

```
    Htmltex.refresh();
```

see [test/html/svg-canvas.html](./test/html/svg-canvas.html).

- Test Case: Model Animization

- Test Case: Particle Animation Script

# Documents

All the documents are updating.

[updating: Introduction, Guide & Reference](https://odys-z.github.io/x-visual/)

[API jsdoc](https://odys-z.github.io/javadoc/x-visual/index.html)

# Acknowledgement

## [Three.js](https://threejs.org)

###### Note

Since v0.3.54, x-visual no longer directly depends on Three.js directly, via npm
pacakge. It's using a forked and modified version of [Three.js](https://github.com/odys-z/three.js).

## ECS - Powered by @fritzy/ecs

x-visual is a js ECS framework inspired by [fritz's ecs-js](https://github.com/fritzy/ecs-js).
The ECS part of x-visual is modified from his source. See change log in x-visual
depending package's [README in packages/ecs-js](./packages/ecs-js/README.md).

## extension: [html2canvas](https://github.com/niklasvh/html2canvas)

14 Jan. 2020:

According to it's README: "The script is still in a very experimental state".

So A tested working version is provided as packages/misc/html2canvas.esm.js

## extension: [Tween.js](https://github.com/tweenjs/tween.js)

Modified for adapting to ecs framework, together with unit tests.

## Asset Resources

- Low Poly City

Used by [x-visual gltf loader test case](./test/html/gltf-city.html), etc.

Referenced by [Three.js tutorial: Three.js Loading a .GLTF File](https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html)

Download: [scene.gltf @ threejsfundamentals](https://threejsfundamentals.org/threejs/resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf)
and together with referenced resources like scene.bin and textures/\*.png.

or [low poly city @ sketchfab](https://sketchfab.com/3d-models/cartoon-lowpoly-small-city-free-pack-edd1c604e1e045a0a2a552ddd9a293e6)

- Simple Scene GLTF

Used by [x-visual gltf mesh BuffereGeometry test case](./test/gltf-mesh.case.js), etc.

Referenced by [Gltf tutorial: A Minimal glTF File](https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/gltfTutorial_003_MinimalGltfFile.md)

- Earth GLTF Assets

By Bisnessniper, Can be [Downloaded @ CGTrader](https://www.cgtrader.com/items/2407021/download-page#),
licensed under *Royalty Free License*

It's texture also been used in another low polygon model.

- Simple Route 66 Low Poly Scene

free 3D model by hj7880, download [@ CGTrader](https://www.cgtrader.com/free-3d-models/architectural/other/simple-route-66-low-poly-scene),
licensed under *Royalty Free License*.
