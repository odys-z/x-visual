.. _guide-app-architecture-cn:

X-visual应用程序基本结构
========================

.. note:: 搭建并运行x-visual examples后有更助于阅读下文内容细节。

..

x-visual是一个ECS WebGl渲染程序javascript框架。应用程序需要遵循ECS （Entity, Component, System)
设计思想才能与x-visual步调一致，提高开发效率。

1. 引用x-visual
---------------

x-visual可以用npm管理依赖包，也可以plain javascript方式引用。详情参见example readme.

2. Hello XWorld
---------------

以下是一个最简单的应用程序。

.. literalinclude:: ../../examples/cube/app.js
   :language: javascript
   :lines: 1-25
   :linenos:

主程序创建了一个xworld，作为渲染3D空间，然后添加定义的立方体，之后调用xworld.startUpdate()开始反复渲染更新场景。

基于x-visual的应用程序主入口与以上程序片段一致。应用程序的业务处理由各种继承的System来实现。比如下文中的Cube类。

.. literalinclude:: ../../examples/cube/hellocube.js
   :language: javascript
   :lines: 1-45
   :linenos:

在Cube中定义了一个立方体, zh: and id, Obj3, Visual, update(), query...

zh: All examples are using Webpack for transpiling.

::

    npm i
    webpack

zh: If everything goes well, open the examples/cube/index.html and it will show
a cube.

.. image:: imgs/001-hellocube.png
    :width: 300px

3. 应用程序基本结构
-------------------

基于x-visual的应用程序包括如下部分：

- 主程序模板

    包括创建XWorld、添加Entity和启动渲染循环等代码。

- Entity定义

    Entity由若干Component构成。实际是一组数据和System动作规则。

- System实现

    继承ECS.XSys基础类，实现用户处理逻辑。

    用户处理逻辑在这里应该只处理与渲染有关的工作，包括用户输入响应、数据展示方式处理等。更多复杂
    逻辑处理应当推到后台处理。


4. 框架基本功能范围
-------------------

x-visual封装了Three.js渲染引擎，全部包装在Thrender system中，是ECS处理的最后环节。
（之后可能扩展post effect system）

在Thrender处理渲染之前，所有的数据展示约束、tween动画处理已经分解到不同的子系统中处理完成， 为
最后渲染做好了准备。x-visual为这一系列处理提供了一个基本结构，包括一个MVC模式的view结构封装，
若干个system来处理视效配置、动画脚本到渲染对象的分解转换。

具体功能包括：

- 全局静态Asset管理

- 用户输入映射
    目前版本只考虑了键盘鼠标事件。用户输入被翻译成UserCmd component，保存在一个特殊的Entity
    管理，entity.id = 'xview'. x-visual实现了一个利用渲染结果拾取场景模型的子系统，可以拾
    取透明材质后面的模型对象。拾取对象放在Entity包含的Pickable.pickId中，(picktick =
    update-tick)。

.. attention:: This is deprecated, docs is coming soon.
..

- GLTF载入

- 初等几何体创建展示准备
    如立方体、球体、环等。

- 静态动画脚本解释
    可解释的动画类型由AnimType定义。

- tween动画驱动

- 基于Three.js渲染

5. 模型空间属性动画
-------------------

包括AnimType.ROTATXYZ等。

示例：

.. code-block:: javascript

    ModelSeqs: { script:
        [[{ mtype: xv.XComponent.AnimType.ROTATEX,
            paras: {start: 0,        // auto start
                    duration: 1,     // seconds
                    deg: [0, 45],    // from, to
                    ease: undefined} // default linear
          },
          { mtype: xv.XComponent.AnimType.OBJ3ROTAXIS,
            paras: {start: Infinity, // follow the first
                    duration: 3.5,   // seconds
                    axis: [0, 1, 0],
                    deg: [0, 90],    // from, to
                    ease: xv.XEasing.Elastic.InOut}
          }
        ]]
     }
..

上例中，模型将被xtweener驱动绕X轴旋转45°, 动画时长1秒。

see `test/html/tween-rot.html <https://github.com/odys-z/x-visual/blob/master/test/html/tween-rot.html>`_

5.1 仿射变换(Affine Transformation)
___________________________________

线性变换有一类特殊的变换 - Affine Transformation, 三维空间模型的常见变换
可以分解为基本变换。Affine Transformation的组合可以形成新的空间动画，如Orbit。

关于Affine Transformation的介绍较多，如`Geometry Operations-Affine <https://homepages.inf.ed.ac.uk/rbf/HIPR2/affine.htm>`_

6. shader uniform动画
---------------------

AnimType.UNIFORMS

示例： see `test/html/morph/lerp-model.html <https://github.com/odys-z/x-visual/blob/master/test/html/morph/lerp-model.html>`_

这段首先定义了两个用于做位置参照的模型：

.. literalinclude:: ../../test/html/morph/lerp-model.html
   :language: javascript
   :lines: 20-72
   :linenos:

然后定义了若干顶点（points / vertices)，并且控制在这两个模型对应顶点间移动。

.. literalinclude:: ../../test/html/morph/lerp-model.html
   :language: javascript
   :lines: 74-107
   :linenos:

这个动画脚本将使Points的位置在两个模型的顶点位置间移动。因为u_morph设置了两个模型顶点的权重。

7. Particles动画
----------------

AnimType.U_MORPHi

示例： see `test/html/voxel-morph-particles.html <https://github.com/odys-z/x-visual/blob/master/test/html/voxel-morph-particles.html>`_

.. literalinclude:: ../../test/html/voxel-morph-particles.html
   :language: javascript
   :lines: 70-101
   :linenos:

这个动画脚本被解释为创建等距分布的顶点，并使顶点在不同目标位置间取权重。同时还不断更新颜色透明度。

8. 示例
-------

see test/html

TODO docs ...

- 载入GLTF模型

- 渲染HTML页面材质

- 空间动画

- shader + uniform动画
