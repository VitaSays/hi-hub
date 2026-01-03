---
title: RRT 路径规划架构深度解析  # <-- 这决定了侧边栏显示的文字
shortTitle: RRT 架构            # <-- (可选) 如果标题太长，导航栏会优先显示这个短标题
---

# RRT 路径规划架构深度解析
> **本文档详细分析了 `scenario.py` 规划算法实现与 `ui_builder.py` 交互管理机制**

---

## 一、 算法核心逻辑：scenario.py
该文件负责 RRT (Rapidly-exploring Random Tree) 算法的具体配置、环境感知以及轨迹生成。



### 1. RRT 算法的配置与初始化 (`setup`)
RRT 的初始化需要整合机器人几何描述、运动学模型和规划器参数：

* **Lula RRT 实例化**：需要三类文件：`robot_descriptor.yaml`（描述碰撞几何）、`urdf`（动力学结构）和 `franka_planner_config.yaml`（设定采样步长、搜索边界等）。
* **迭代上限设置**：调用 `set_max_iterations(5000)`。这是一个安全阀，防止在无解的环境中无限搜索导致仿真程序卡死。
* **可视化包装**：`PathPlannerVisualizer` 将 RRT 搜索出的抽象路径点序列，转化为机器人可以直接执行的 `ArticulationActions` 动作序列。

### 2. 动态重规划触发机制 (`update`)
与 RMPflow 的连续力场不同，RRT 是离散的路径规划。为了平衡实时性与计算开销，代码采用了**基于阈值的重规划策略**：

```python
# 检测目标位姿的变化量
translation_distance = np.linalg.norm(self._target_translation - current_target_translation)
target_moved = translation_distance > 0.01  # 位移超过 1cm 视为移动

# 复合判定：每 60 帧检查一次 且 目标发生了显著位移
if self._frame_counter % 60 == 0 and target_moved:
    self._rrt.update_world()  # 告知规划器障碍物的最新位置
    self._plan = self._path_planner_visualizer.compute_plan_as_articulation_actions()
```
### 3. 动作执行流
规划生成的 `self._plan` 本质上是一个动作队列（Action Queue）。 在 `update` 函数的末尾，程序使用 `pop(0)` 每帧提取并执行一个动作点，从而实现平滑的轨迹复现。

---

## 二、 交互与生命周期：ui_builder.py
`ui_builder.py` 负责 Isaac Sim 右侧 UI 面板的渲染，并充当用户行为（点击按钮）与底层算法（Scenario 类）之间的桥梁。

### 核心回调函数映射表

| 回调函数 | 触发时机 | 核心业务操作 |
| :--- | :--- | :--- |
| `_setup_scene` | 点击 **LOAD** 按钮 | 执行 `create_new_stage()` 清空场景；添加 `SphereLight` 提供光照；调用 `scenario` 加载机器人与障碍物。 |
| `_update_scenario` | **RUN** 激活状态 | 被物理步（Physics Step）订阅，每帧调用 `scenario.update()` 驱动重规划逻辑与动作执行。 |
| `on_timeline_event` | 点击原生播放/停止 | 监控物理引擎状态。如果用户手动停止，UI 上的 `StateButton` 会自动同步重置为 **STOP** 状态。 |
| `cleanup` | 关闭插件或脚本重载 | 注销 UI 元素的回调函数，释放内存，防止在切换场景时出现残留报错。 |

> **💡 关键技术细节：**
> `create_new_stage()` 会销毁当前所有内容。 因此，必须紧随其后调用 `_add_light_to_stage()`。 如果没有手动创建灯光，场景将是全黑的，无法通过相机视角观察机械臂的运动。

---

## 三、 RRT 规划全流程总结

1. **感知 (Sensing)**：实时监控 `/World/target` 的 6 自由度位姿。
2. **决策 (Decision)**：逻辑判定位移是否达标。 若达标，规划器进入 **C-Space (配置空间)** 进行快速随机采样。
3. **约束处理**：RRT 内部会检查采样点是否与注册的 `VisualCuboid` (障碍物) 发生碰撞。
4. **离散化 (Discretization)**：找到可行路径后，将其细化为一系列密集的关节角度点位。
5. **执行 (Execution)**：物理驱动器按顺序执行动作序列，完成机械臂从当前点到目标点的避障移动。