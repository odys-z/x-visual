Examples
========

Chart Extensions
----------------

.. _ex-chart-bar:

case: XBar
__________

html file::

    test/html/ext/12vec-bar.html

data file::

    test/html/data/bar-2.json

The json file section has 2 separate sections. The chart section define how chart
axes and data serials label should been showed.

.. code-block:: json

    "chart": {
        "name": "x-bar vec4 (1)",
        "domain": [[0, 2], [0, 10], [0, 2]],
        "range": [[0, 2], [0, 10], [0, 2]],
        "grid": [4, 4, 3],
        "grid-space": [30, 10, 30],
        "axes": ["1-coord", "y-label", "2-coord"],
        "label-bg": "#000",
        "label-boxes": [
            {"x": 0, "y": 0, "w": 64, "h": 16, "size": 256, "margin": 0},
            {"x": 0, "y": 0, "w": 64, "h": 24, "size": 256, "margin": 0},
            {"x": 0, "y": 0, "w": 64, "h": 16, "size": 256, "margin": 0}
        ]
    }
..

- name

    not used

- domain

    data value range

    Domain and range are the seam as `D3 data/range <https://www.tutorialsteacher.com/d3js/scales-in-d3>`_.

- range

    showing range

- grid & grid-space

    chart space definition

- axes

    x, y, z labels

- label-bg & label-boxes

    label's texture alignment

The second part is an object define how data been presented as bars.

.. code-block:: json

    "serials": {
        "pos0": [1, 0, 1],
        "label-offsets": [[0, -0.1, -0.2], [-0.1, 0.5, -0.1], [-0.25, -0.1, 0]],

        "label-desc": "in bar serials, labels always a 2d array of stirngs, with rows' cardinality of 3",
        "labels": [ ["A", "B", "C"],
                    ["X"],
                    ["- I -", "- II -", "- III -"] ],
        "label-colors": ["red", "green", "#24f"],
        "label-font": "Arial",
        "label-bg": "#000",

        "label-boxes": [
            {"x": 0, "y": 0, "w": 16, "h": 20, "size": 64, "margin": 0},
            {"x": 0, "y": 0, "w": 16, "h": 18, "size": 64, "margin": 0},
            {"x": 0, "y": 0, "w": 16, "h": 12, "size": 64, "margin": 0}
        ],
        "v0.3-label-canvas-desc": "deprecated",
        "label-canvas": [],

        "docking-format": "elements in same order of vectors, [[x, y, z], ...], where x, y, z are grid index",
        "docking-format2": "in this example, x = vector.x, z = vector.z, y = 0, 1",
        "docking": [
            [0, 1, 0, 0], [0, 1, 1, 1], [0, 1, 2, 2],
            [1, 0, 0, 3], [1, 0, 1, 4], [1, 0, 2, 5],
            [2, 1, 0, 6], [2, 1, 1, 7], [2, 1, 2, 8],
            [3, 0, 0, 9], [3, 0, 1,10], [3, 0, 2,11]]
    }
..

- babel-box

    x, y: text offset;

    w, h: canvas width, height

    size: font size

See :ref:`details of xywh in docs<render-dynatex-xywh>`.

Docing ...
