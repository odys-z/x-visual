# About


X-visual is a lib for data visiualization, include:

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
    # npm install --save-dev jquery
    # npm install --save-dev style-loader
    # npm install --save-dev @babel/core @babel/preset-env
    # npm install --save-dev babel-loader
    # npm i three
	# npm i uuid
	npm i
~~~

## test (without server)

For installing and troubleshooting, see
[A test project](https://github.com/odys-z/hello/blob/master/mocha/README.md)

build and test
~~~
    npm run build
    npm test
~~~

## troubleshooting

If the test reporting error around "chai.use(chaiStats)":
```
    TypeError: fn is not a function
```

try replace

```
    import {chaiStats} from 'chai-stats'
```

with

```
    import chaiStats from 'chai-stats'
```

## hello world

TODO
