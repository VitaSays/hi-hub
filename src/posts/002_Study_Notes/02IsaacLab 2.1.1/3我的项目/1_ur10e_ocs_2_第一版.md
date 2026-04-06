---
title: ur10e_ocs_2_第一版
---

#  ur10e_ocs_2_第一版

# 1. 任务的整体定位

这套代码任务是：

**UR10 末端执行器 `ee_link` 跟踪不断生成的目标末端位姿的强化学习任务。**  
也就是说，当前任务的目标是让机械臂末端去跟踪一个动态生成的目标位姿，而不是去恢复某组固定关节角。:contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}

从结构上看，你现在的任务已经很接近官方 Reach 任务的组织方式，主要由以下几部分组成：

- Scene
- Commands
- Actions
- Observations
- Event
- Rewards
- Terminations
- Curriculum
- 最终统一组装成 `EnvCfg` :contentReference[oaicite:2]{index=2}

---

# 2. `ur10e_ocs_2_env_cfg.py` 的分析

这个文件本质上就是你当前任务的“总装图”。  
它并不是把所有逻辑都塞进一个大类里，而是把环境拆成多个配置类，再在最后统一组合。

你现在的主要配置类有：

- `Ur10eOcs2SceneCfg`
- `CommandsCfg`
- `ActionsCfg`
- `ObservationsCfg`
- `EventCfg`
- `RewardsCfg`
- `TerminationsCfg`
- `CurriculumCfg`
- `Ur10eOcs2EnvCfg` :contentReference[oaicite:3]{index=3}

这种写法的好处是：

- 结构清晰
- 各个部分职责明确
- 后面调 reward、observation、action 时更方便定位

---

# 3. Scene 部分是怎么写的

Scene 部分定义在：

```python
class Ur10eOcs2SceneCfg(InteractiveSceneCfg):
```

这一部分主要负责“场景里有什么”。  
你当前场景里包含四个核心元素：

- 地面 `ground`
- 桌子 `table`
- 机器人 `robot`
- 灯光 `light` :contentReference[oaicite:4]{index=4}

## 3.1 地面
你使用了标准地面：

- `GroundPlaneCfg()`

作用是提供基础碰撞平面。:contentReference[oaicite:5]{index=5}

## 3.2 桌子
你加载了官方桌子资产：

- `SeattleLabTable/table_instanceable.usd`

并且给桌子设定了初始位置与姿态。  
这说明你当前任务不再是空场景，而是一个机械臂在实验台前执行 reach / pose tracking 任务的场景。:contentReference[oaicite:6]{index=6}

## 3.3 机器人
机器人直接写成：

- `UR10_CFG.replace(prim_path="{ENV_REGEX_NS}/Robot")`

这表示你已经把场景中的主体替换成了 UR10。:contentReference[oaicite:7]{index=7}

## 3.4 灯光
用了一个 `DomeLightCfg`，主要用于渲染显示。:contentReference[oaicite:8]{index=8}

### Scene 部分的作用总结
这一部分只负责：

> 场景里有哪些物体，以及它们如何初始化。

它本身不负责目标、不负责奖励、不负责训练。

---

# 4. Commands 部分是怎么写的

Commands 部分定义在：

```python
class CommandsCfg:
```

这一部分决定的是：

> 任务目标“要去哪里”。

你当前定义了一个最核心的命令：

- `ee_pose = mdp.UniformPoseCommandCfg(...)` :contentReference[oaicite:9]{index=9}

这说明你现在的目标不是固定死的，而是由命令生成器不断采样出来的目标末端位姿。

## 4.1 目标跟踪的对象
你指定了：

- `body_name="ee_link"`

这说明你当前要求跟踪目标的是 UR10 的末端执行器 `ee_link`。:contentReference[oaicite:10]{index=10}

## 4.2 目标多久变化一次
你设置了：

- `resampling_time_range=(4.0, 4.0)`

意思是目标命令每 4 秒重新采样一次。  
所以这不是“一个 episode 一个固定目标”的任务，而是训练过程中周期性刷新目标。:contentReference[oaicite:11]{index=11}

## 4.3 目标位置范围
你定义了目标位置的采样范围：

- `pos_x=(0.35, 0.65)`
- `pos_y=(-0.2, 0.2)`
- `pos_z=(0.15, 0.5)` :contentReference[oaicite:12]{index=12}

这表示目标点会在机械臂前方的一个三维区域内随机生成。

## 4.4 目标姿态范围
你定义了：

- `roll=(0.0, 0.0)`
- `pitch=(math.pi / 2, math.pi / 2)`
- `yaw=(-3.14, 3.14)` :contentReference[oaicite:13]{index=13}

说明：

- roll 固定
- pitch 固定为 `pi/2`
- yaw 可以随机变化

这说明你考虑了 UR10 末端方向的几何特性，不是完全随便设的。

### Commands 部分的作用总结
这一部分的本质是：

> 目标生成器，负责不断给末端执行器生成新的位姿命令。

---

# 5. Actions 部分是怎么写的

Actions 部分定义在：

```python
class ActionsCfg:
```

这里最关键的是：

- `arm_action = mdp.JointPositionActionCfg(...)` :contentReference[oaicite:14]{index=14}

这说明你当前的控制方式是：

> 关节位置控制

而不是关节力矩控制或关节速度控制。

## 5.1 关节选择
你用了：

- `joint_names=[".*"]`

表示控制 UR10 的所有关节。:contentReference[oaicite:15]{index=15}

## 5.2 动作幅度
你设置了：

- `scale=0.5`

这会直接影响策略每一步动作的幅度大小。  
这个参数和你后面回放时出现抖动是密切相关的，因为 scale 越大，动作更新越容易偏猛。:contentReference[oaicite:16]{index=16}

## 5.3 默认偏移
你设置了：

- `use_default_offset=True`

这通常表示动作是在默认关节位置附近做偏移控制，而不是直接给绝对位置。

## Actions 部分的作用总结
这一部分负责：

> 把策略网络输出变成机器人实际执行的控制命令。

---

# 6. Observations 部分是怎么写的

Observations 定义在：

```python
class ObservationsCfg:
    class PolicyCfg(ObsGroup):
```

这一部分定义的是：

> 策略网络能看到什么。

你当前给策略的观测包括 4 项：

- `joint_pos`
- `joint_vel`
- `pose_command`
- `actions` :contentReference[oaicite:17]{index=17}

## 6.1 `joint_pos`
当前关节相对位置，并加入了均匀噪声。:contentReference[oaicite:18]{index=18}

## 6.2 `joint_vel`
当前关节相对速度，也加入了均匀噪声。:contentReference[oaicite:19]{index=19}

## 6.3 `pose_command`
目标末端位姿命令。  
这是 reach / pose tracking 任务里最关键的一项，因为没有这项，策略就不知道自己要去哪里。:contentReference[oaicite:20]{index=20}

## 6.4 `actions`
上一时刻动作。  
这一项通常有助于提高动作连续性，减少策略输出突然跳变。:contentReference[oaicite:21]{index=21}

## 6.5 `__post_init__` 中的两个设置
你写了：

- `self.enable_corruption = True`
- `self.concatenate_terms = True` :contentReference[oaicite:22]{index=22}

含义分别是：

- 启用观测扰动 / 噪声
- 把各项观测拼接成一个大向量送给策略

## Observations 部分的作用总结
你当前 observation 的逻辑是：

> 当前关节状态 + 当前目标位姿 + 上一步动作

这已经很符合官方 reach 任务的思路。

---

# 7. Event 部分是怎么写的

Events 定义在：

```python
class EventCfg:
```

你当前只有一个重置事件：

- `reset_robot_joints = EventTerm(func=mdp.reset_joints_by_scale, ...)` :contentReference[oaicite:23]{index=23}

## 7.1 重置范围
你设置了：

- `position_range=(0.75, 1.25)`
- `velocity_range=(0.0, 0.0)` :contentReference[oaicite:24]{index=24}

这意味着：

- 每次 reset 时，关节位置会在默认状态附近做一定范围的随机缩放
- 关节速度会被重置为 0

## Event 部分的作用总结
这一部分决定：

> 每个 episode 从什么样的初始状态开始。

它会影响训练的难度和策略的泛化能力。

---

# 8. Rewards 部分是怎么写的

Rewards 定义在：

```python
class RewardsCfg:
```

这是当前任务最核心的部分之一。  
你现在的 reward 已经不是单一项，而是一个多项组合。共有 5 项：

- `end_effector_position_tracking`
- `end_effector_position_tracking_fine_grained`
- `end_effector_orientation_tracking`
- `action_rate`
- `joint_vel` :contentReference[oaicite:25]{index=25}

## 8.1 末端位置跟踪误差
`end_effector_position_tracking`

- 函数：`mdp.position_command_error`
- 权重：`-0.2`
- 跟踪对象：`ee_link`
- 命令来源：`ee_pose` 

作用：

> 末端离目标位置越远，惩罚越大。

---

## 8.2 精细位置奖励
`end_effector_position_tracking_fine_grained`

- 函数：`mdp.position_command_error_tanh`
- 权重：`0.1`
- `std=0.1` 

作用：

> 当末端接近目标时，提供更细致、更平滑的正向奖励。

这项有助于提高末端在目标附近的精细跟踪能力。

---

## 8.3 末端姿态跟踪误差
`end_effector_orientation_tracking`

- 函数：`mdp.orientation_command_error`
- 权重：`-0.1` 

作用：

> 不仅位置要对，末端姿态也要尽量对齐目标姿态。

---

## 8.4 动作变化惩罚
`action_rate`

- 函数：`mdp.action_rate_l2`
- 权重：`-0.0001` :contentReference[oaicite:29]{index=29}

作用：

> 相邻两步动作不要差太大。

用于抑制动作突变、减少抖动。

---

## 8.5 关节速度惩罚
`joint_vel`

- 函数：`mdp.joint_vel_l2`
- 权重：`-0.0001` :contentReference[oaicite:30]{index=30}

作用：

> 关节速度不要太大。

用于让机械臂运动更稳、更柔和。

## Rewards 部分的整体作用总结
你当前 reward 的总体思想是：

> 既要让末端去跟踪目标位姿，又要让整个控制过程平滑稳定。

---

# 9. `mdp/rewards.py` 里的 reward 函数是怎么实现的

这个文件实现了你自定义的 3 个核心 reward 函数。:contentReference[oaicite:31]{index=31}

### 9.1 `position_command_error`
这个函数的逻辑是：

1. 从 `command_manager` 取出当前目标命令
2. 提取目标位置
3. 把目标位置从机器人基座坐标系转换到世界坐标系
4. 读取当前末端执行器的世界坐标位置
5. 计算两者之间的欧氏距离 :contentReference[oaicite:32]{index=32}

本质上，它就是：

> 末端当前位置和目标位置之间的距离误差。

---

## 9.2 `position_command_error_tanh`
这个函数的逻辑和上面类似，但不是直接返回距离，而是：

- 先计算距离
- 再做 `1 - tanh(distance / std)` 映射 :contentReference[oaicite:33]{index=33}

这样做的效果是：

- 远离目标时，奖励变化没那么敏感
- 越接近目标时，奖励越细致

本质上，它是一个：

> 近目标精细化奖励函数。

---

## 9.3 `orientation_command_error`
这个函数的逻辑是：

1. 从命令里取出目标四元数
2. 转到世界坐标系
3. 读取当前末端四元数
4. 计算当前姿态和目标姿态之间的四元数误差 :contentReference[oaicite:34]{index=34}

本质上，它就是：

> 末端姿态误差。

---

# 10. Terminations 部分是怎么写的

Terminations 定义在：

```python
class TerminationsCfg:
```

你当前只有一个终止条件：

- `time_out = DoneTerm(func=mdp.time_out, time_out=True)` :contentReference[oaicite:35]{index=35}

### 这说明什么
说明当前任务没有：

- 成功终止
- 失败终止
- 碰撞终止

而是：

> 每个 episode 跑满固定时长后结束。

### 这一部分的作用总结
Terminations 决定的是：

> episode 在什么时候结束。

你现在采用的是最简单、也最稳定的一种方式。

---

# 11. Curriculum 部分是怎么写的

Curriculum 定义在：

```python
class CurriculumCfg:
```

你当前定义了两项课程学习：

- `action_rate`
- `joint_vel` :contentReference[oaicite:36]{index=36}

它们的作用是随着训练推进，逐步加强：

- 动作变化惩罚
- 关节速度惩罚

具体参数是：

- `action_rate` 最终权重增强到 `-0.005`
- `joint_vel` 最终权重增强到 `-0.001`
- 都在 `4500` 步内逐步调整完成 :contentReference[oaicite:37]{index=37}

## Curriculum 的作用总结
这一部分体现的是：

> 先让策略学会追目标，再逐渐要求动作更平滑、更稳定。

---

# 12. 最终环境 `Ur10eOcs2EnvCfg` 是怎么组装的

最后你在：

```python
class Ur10eOcs2EnvCfg(ManagerBasedRLEnvCfg):
```

里把前面所有模块组装起来了：

- `scene`
- `observations`
- `actions`
- `commands`
- `rewards`
- `terminations`
- `events`
- `curriculum` :contentReference[oaicite:38]{index=38}

然后又在 `__post_init__()` 里设置了：

- `decimation = 2`
- `render_interval = decimation`
- `episode_length_s = 12.0`
- `viewer.eye = (3.5, 3.5, 3.5)`
- `sim.dt = 1.0 / 60.0` :contentReference[oaicite:39]{index=39}

### 这一部分的作用总结
这一部分做的事情就是：

> 把所有零件拼装成一个完整强化学习环境。

---

# 13. 对你当前写法的整体评价

从结构上看，你现在这套写法已经很成熟了，具备以下特点：

### 已经完成得比较好的地方
- 场景已经完全替换成 UR10
- 目标已经从固定关节角改成动态末端位姿命令
- observation 已经包含目标命令
- reward 已经变成多项组合
- termination 保持简单稳定
- curriculum 也已经加入 

### 当前值得继续关注的地方
- `arm_action` 的 `scale=0.5` 可能偏大，会影响动作平滑性
- `enable_corruption=True` 训练时有利，但回放时可能带来抖动感
- `action_rate` 和 `joint_vel` 的初始权重可能还偏小
- `num_envs=1024` 是你根据机器条件设置的，不是官方默认规模 :contentReference[oaicite:41]{index=41}

---

# 14. 一句话总结

你现在这套代码已经可以概括为：

> 你已经把项目改造成了一个 UR10 末端位姿跟踪强化学习任务：目标由命令生成器周期性生成，策略根据关节状态、目标位姿和上一步动作输出关节位置动作，reward 由末端位置误差、姿态误差和动作平滑项组成，episode 只靠 timeout 结束，并通过 curriculum 逐步增强平滑约束。 