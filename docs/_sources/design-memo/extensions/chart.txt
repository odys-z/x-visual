Charts
======

Chart XCommon
-------------

Axis
____

To add axes x, y, z to a 3D chart, create `xv.chart.Axisys <../../jsdoc/Axisys.html>`_
together with `xv.XComponents.Axes <../../jsdoc/chart.Axes.html>`_ to add the
arrow objects.

test: html/ext/12vec-bar.html

Axis can be configured in json file's *chart* section:

.. code-block:: json

 "chart": {
    ...
    "axes": ["1-coord", "y-label", "2-coord"],
    "label-sytle": ["white", "white", "white"],
    "label-font": "italic 8em \"Fira Sans\", serif"
  }

The above configuration will produce the following font visualization.

.. image:: ../imgs/003-axes-font.jpeg

The *label-style* and *label-font* are used as canvas style and font attribute,
the same as html canvas style, see `MDN Canvas.style <https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle>`_
and `css font <https://developer.mozilla.org/en-US/docs/Web/CSS/font>`_.

Also note that in version 0.3, all axis labels are using a 256x256 canvas for
rendering, with text at x = 0, y = 128. Configuration for longer string will
have to be adjusted by user.

Visual Auxiliaries
__________________

This includes showing a group of 3 axis planes and a group of value indicating
lines that always start from the planes.

test: html/ext/12vec-bar.html & html/ext/chart-grid.html

Chart Extensions
----------------

XBar
____

Using json object generating a 3D bar chart.

test: html/ext/12vec-bar.html

Data Serial Labels
++++++++++++++++++

Serial labels are text strings that shows along axis, etc.

XBar currently support only 3 groups of labels, along x, y, z respectively.

Json Example
++++++++++++

see test/html/data/bar-2.json

D3Pie
_____

Draw a pie chart on a 3D plane in xworld.

test: html/ext/4vec-pie.html

data: html/data/pie.json

Resources & References
----------------------

- `D3 Data Binding (Tutorial) <https://www.tutorialsteacher.com/d3js/data-binding-in-d3js>`_

- `Shader Shape Functions <https://thebookofshaders.com/05/>`_
    & `Shader Shape <https://thebookofshaders.com/07/>`_
