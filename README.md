# About


X-visual is a lib for data visiualization using [Three.js](https://threejs.org)
as renderer. It includes:

- ECS framework

- OSM3

3D Osm with THREE.js lib, an [OSM](https://www.openstreetmap.org/)
[tiles](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)
3D rendere based on [Three.js](http://threejs.org/).

- Particle Cluster

...

It's also the npm package name.

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

```
    import chaiStats from 'chai-stats'
```

For installing and troubleshooting, see
[Mocha project example](https://github.com/odys-z/hello/blob/master/mocha/README.md)

build and test
~~~
    npm run build
    npm test
~~~


## Hello World

For ecs "hello world", try test/ecs.html. You should see something like this (v0.1.11)

![ecs plain js example](./docsphinx/source/imgs/000%20ecs-html.png)

- tip

The html can be load from local file system if browser allow cross domain file access.
Try (tested on Ubuntu):

```
    vim chrome
    # add this: google-chrome --allow-file-access-from-files --allow-file-access --allow-cross-origin-auth-prompt
    chmod +x chrome
    ./chrome
```

### Some Other Examples

- Test Case: GLTFLoader (test/html/gltf-city.html)

<img src='./docsphinx/source/imgs/001%20gltf-loader.png' width='800px'></img>


- Test Case: using html DOM as texture

To update rendering texture, use

```
    Htmltex.refresh();
```

see [test/html/svg-canvas.html](./test/html/svg-canvas.html).

# Acknowledgement

## ECS - Powered by @fritzy/ecs

x-visual is a js ECS framework inspired by [fritz's ecs-js](https://github.com/fritzy/ecs-js).
The ECS part of x-visual is modified from his source. See change log in x-visual
depending package's [README in packages/ecs-js](./packages/ecs-js/README.md).

## extension: [html2canvas](https://github.com/niklasvh/html2canvas)

14 Jan. 2020:

According to it's README: "The script is still in a very experimental state".

So A tested working version is provided as packages/misc/html2canvas.esm.js

## Asset Resources

- Low Poly City

Used by [x-visual gltf loader test case](./test/html/gltf-city.html), etc.

Referenced by [Three.js tutorial: Three.js Loading a .GLTF File](https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html)

Download: [scene.gltf @ threejsfundamentals](https://threejsfundamentals.org/threejs/resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf) and together with referenced
resources like scene.bin and textures/\*.png.

or [low poly city @ sketchfab](https://sketchfab.com/3d-models/cartoon-lowpoly-small-city-free-pack-edd1c604e1e045a0a2a552ddd9a293e6)

# Reference

TODO move to docs

## Usable Components

Currently usable (can registered by user) are

```
    UserCmd, CmdFlag, XCamera, Geometry, Visual.
```

For latest version, see exports in lib/xv.js.
