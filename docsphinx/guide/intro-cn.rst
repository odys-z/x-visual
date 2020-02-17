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
   :lines: 1-15
   :linenos:

程序创建了一个xworld，作为渲染3D空间，然后添加定义的立方体，之后调用xworld.startUpdate()开始反复渲染更新场景。

zh: The main app is this similar alike. The task is now create subsystem rendering
a cube.

.. literalinclude:: ../../examples/cube/hello.js
   :language: javascript
   :lines: 1-14
   :linenos:

在hellocube中定义了一个立方体:

.. literalinclude:: ../../examples/cube/hellocube.js
   :language: javascript
   :lines: 1-50
   :linenos:


3. 应用程序基本结构
-------------------

基于x-visual的应用程序包括如下部分：

- 主程序模板

    包括创建XWorld、添加Entity和启动渲染循环等代码。

- Entity定义

    Entity由若干Component构成。实际是一组数据和System动作规则。

- System实现

    继承ECS.XObj基础类，实现用户处理逻辑。

    用户处理逻辑在这里应该只处理与渲染有关的工作，包括用户输入响应、数据展示方式处理等。更多复杂逻辑处理应当推到后台处理。


4. 框架基本功能范围
-------------------

x-visual封装了Three.js渲染引擎，全部包装在Thrender system中，是ECS处理的最后环节。（之后可能扩展post effect system）

在Thrender处理渲染之前，所有的数据展示约束、tween动画处理已经分解到不同的子系统中处理完成，为最后渲染做好了准备。x-visual为
这一系列处理提供了一个基本结构，包括一个MVC模式的view结构封装，若干个system来处理视效配置、动画脚本到渲染对象的分解转换。

具体功能包括：

- 全局静态Asset管理

- 用户输入映射
    目前版本只考虑了键盘鼠标事件。用户输入被翻译成UserCmd component，保存在一个特殊的Entity管理，entity.id = 'xview'.
    x-visual实现了一个利用渲染结果拾取场景模型的子系统，可以拾取透明材质后面的模型对象。拾取对象放在Entity包含的
    Pickable.picktick中。

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

.. literalinclude:: ../../test/html/tween-rot.html
   :language: javascript
   :lines: 58-65
   :linenos:

上例中，模型将被xtweener驱动绕X轴旋转45°, time 1 second.

see `test/html/tween-rot.html </test/html/tween-rot.html>`_

6. shader uniform动画
---------------------

AnimType.UNIFORMS

示例： see `test/html/model-morph.html </test/html/model-morph.html>`_

zh: first, it created 2 cube:

.. literalinclude:: ../../test/html/model-morph.html
   :language: javascript
   :lines: 20-72
   :linenos:

then referencing points (vertices) moving between the corresponding vertices.

.. literalinclude:: ../../test/html/model-morph.html
   :language: javascript
   :lines: 74-110
   :linenos:

这个动画脚本将使Points的位置在两个模型的顶点位置间移动。因为u_morph设置了两个模型顶点的权重。

7. Particles动画
----------------

AnimType.U_VERT_TRANS

示例： see `test/html/voxel-morph-particles.html </test/html/voxel-morph-particles.html>`_

.. literalinclude:: ../../test/html/voxel-morph-particles.html
   :language: javascript
   :lines: 70-101
   :linenos:

这个动画脚本被解释为创建等距分布的顶点，并使顶点在不同目标位置间取权重。同时还不断更新颜色透明度。

8. 示例
-------

see test/html

TODO docs ...

载入GLTF模型
++++++++++++

渲染HTML页面材质
++++++++++++++++

空间动画
++++++++

shader + uniform动画
++++++++++++++++++++
