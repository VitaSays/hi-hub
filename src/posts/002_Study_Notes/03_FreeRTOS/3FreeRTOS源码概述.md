# 第7章 FreeRTOS源码概述

## 1 FreeRTOS目录结构

使用 STM32CubeMX 创建 FreeRTOS 工程后，和 FreeRTOS 相关的源码主要分布在两个目录中：

### 1.1 Core 目录
这是用户应用层和配置层所在目录。

- `Core/Inc/FreeRTOSConfig.h`  
  FreeRTOS 的配置文件，用来配置内核的功能和运行参数。

- `Core/Src/freertos.c`  
  由 STM32CubeMX 自动生成，通常用于创建默认任务、信号量、队列等，是用户接触 FreeRTOS 的主要入口文件之一。

### 1.2 `Middlewares/Third_Party/FreeRTOS/Source` 目录
这是 FreeRTOS 内核源码目录。

- 根目录下存放 FreeRTOS 的核心源码文件，这些文件是与具体硬件平台无关的通用文件。
- `portable` 目录下存放移植相关文件。  
  目录形式一般为：

  `portable/[compiler]/[architecture]`

  例如：

  `RVDS/ARM_CM3`

  表示在 **RVDS/Keil 编译器** 下，针对 **Cortex-M3 架构** 的移植文件。

---

## 2 核心文件

FreeRTOS 的核心文件中，最重要的两个文件是：

- `FreeRTOS/Source/tasks.c`
- `FreeRTOS/Source/list.c`

### 2.1 作用说明
- `tasks.c`  
  是任务管理的核心文件，涉及任务创建、删除、调度、延时、任务状态切换等内容，可以认为是 FreeRTOS 内核的“核心中的核心”。

- `list.c`  
  是链表实现文件。FreeRTOS 中许多对象管理都依赖链表，例如就绪列表、延时列表、挂起列表等，因此它是内核调度机制的重要基础。

### 2.2 其他常见文件作用
- `queue.c`：实现队列，也为信号量、互斥量等机制提供基础
- `timers.c`：实现软件定时器
- `event_groups.c`：实现事件组
- `stream_buffer.c`：实现流缓冲区和消息缓冲区
- `croutine.c`：实现协程功能，一般较少使用

---

## 3 移植时涉及的文件

FreeRTOS 在不同芯片、不同编译器下运行时，需要用到移植层文件。  
这些文件位于：

`FreeRTOS/Source/portable/[compiler]/[architecture]`

例如：

`RVDS/ARM_CM3`

在这个目录下，最重要的文件有两个：

- `port.c`
- `portmacro.h`

### 3.1 作用说明
- `port.c`  
  实现与具体硬件平台相关的底层功能，例如任务切换、临界区管理、时钟节拍处理等。

- `portmacro.h`  
  定义与体系结构相关的数据类型、宏、临界区操作方法等，是 FreeRTOS 适配某一硬件平台的重要头文件。

因此可以理解为：  
**内核源码是通用的，而 `port.c` 和 `portmacro.h` 负责让 FreeRTOS 真正运行在指定 MCU 上。**

---

## 4 头文件相关

### 4.1 头文件目录

使用 FreeRTOS 时，一般需要包含 3 类头文件目录：

#### 4.1.1 FreeRTOS 内核头文件目录
`Middlewares/Third_Party/FreeRTOS/Source/include`

该目录下存放 FreeRTOS 通用内核头文件，例如：

- `FreeRTOS.h`
- `task.h`
- `queue.h`
- `semphr.h`
- `timers.h`
- `event_groups.h`

#### 4.1.2 移植相关头文件目录
`Middlewares/Third_Party/FreeRTOS/Source/portable/[compiler]/[architecture]`

该目录下最典型的头文件是：

- `portmacro.h`

#### 4.1.3 配置文件目录
`Core/Inc`

该目录中存放：

- `FreeRTOSConfig.h`

这是 FreeRTOS 的配置文件，必须能够被内核源码找到。

---

### 4.2 常见头文件说明

- `FreeRTOS.h`  
  FreeRTOS 的总头文件，很多其他头文件都会依赖它。

- `task.h`  
  任务管理相关函数声明。

- `queue.h`  
  队列相关函数声明。

- `semphr.h`  
  信号量和互斥量相关声明，本质上基于队列机制实现。

- `timers.h`  
  软件定时器相关声明。

- `event_groups.h`  
  事件组相关声明。

- `portable.h` / `portmacro.h`  
  与移植层相关。

---

## 5 内存管理

FreeRTOS 的内存管理文件位于：

`Middlewares/Third_Party/FreeRTOS/Source/portable/MemMang`

这个目录下默认提供了 5 种动态内存管理实现方式：

- `heap_1.c`
- `heap_2.c`
- `heap_3.c`
- `heap_4.c`
- `heap_5.c`

### 5.1 基本理解
这些文件本质上是 FreeRTOS 提供的不同内存分配方案，用于实现：

- `pvPortMalloc()`
- `vPortFree()`

不同的 `heap_x.c` 在以下方面存在差异：

- 是否支持内存释放
- 是否容易产生内存碎片
- 是否支持多个内存区域
- 实现复杂度和使用场景不同

在实际工程中，较常见的是：

- `heap_4.c`
- `heap_5.c`

---

## 6 入口函数

在 STM32CubeMX 生成的工程中，FreeRTOS 的入口通常位于 `main.c` 中。

典型代码如下：

```c
/* Init scheduler */
osKernelInitialize();   /* 初始化FreeRTOS运行环境 */
MX_FREERTOS_Init();     /* 创建任务 */

/* Start scheduler */
osKernelStart();        /* 启动调度器 */
```

### 6.1 执行流程说明
1. `osKernelInitialize()`  
   初始化 FreeRTOS 内核运行环境。

2. `MX_FREERTOS_Init()`  
   创建任务、队列、信号量等对象。

3. `osKernelStart()`  
   启动调度器，开始多任务调度。

也就是说，**FreeRTOS 并不是在 `main()` 一开始就立即运行，而是先完成初始化和任务创建，再启动调度器。**

---

## 7 数据类型和编程规范

### 7.1 数据类型

每个移植版本的 `portmacro.h` 中，都会定义与体系结构相关的数据类型，其中最重要的是：

#### 7.1.1 `TickType_t`
它表示系统节拍计数值的数据类型。

FreeRTOS 会配置一个周期性的时钟中断，即 Tick Interrupt。  
每发生一次 Tick 中断，系统节拍计数值加 1，这个计数变量的类型就是 `TickType_t`。

- 当 `FreeRTOSConfig.h` 中定义 `configUSE_16_BIT_TICKS` 时，`TickType_t` 通常为 `uint16_t`
- 否则通常为 `uint32_t`

对于 32 位架构，通常建议使用 32 位 Tick 类型，以便获得更大的计数范围。

#### 7.1.2 `BaseType_t`
它表示当前架构下最高效的基本数据类型。

- 32 位架构中通常为 `long` 或 `int32_t`
- 16 位架构中通常为 16 位类型
- 8 位架构中通常为 8 位类型

它常用于：
- 函数返回值
- 布尔逻辑值
- 状态标志值

例如：

- `pdTRUE`
- `pdFALSE`
- `pdPASS`
- `pdFAIL`

---

### 7.2 变量命名规则

FreeRTOS 中变量名一般带有前缀，用于表示变量类型，便于阅读和维护。

常见规则如下：

- `c`：`char`
- `s`：`short`
- `l`：`long`
- `x`：`BaseType_t` 或结构体中常用变量
- `u`：`unsigned`
- `p`：指针
- `uc`：`unsigned char`
- `pc`：`char *`
- `px`：指向某种结构体的指针

这种命名方式能帮助开发者快速判断变量类型和用途。

---

### 7.3 函数命名规则

FreeRTOS 的函数名一般由两部分前缀组成：

#### 7.3.1 返回值类型前缀
例如：
- `v`：返回 `void`
- `x`：返回 `BaseType_t`
- `pv`：返回指针
- `ux`：返回无符号类型

#### 7.3.2 所在模块前缀
例如：
- `Task`：任务相关
- `Queue`：队列相关

例如：

- `vTaskDelay()`  
  `v` 表示返回值为 `void`，`Task` 表示任务相关函数

- `xTaskCreate()`  
  `x` 表示返回值为 `BaseType_t`，`Task` 表示任务相关函数

这种命名方式体现了 FreeRTOS 较强的工程规范性。

---

### 7.4 宏命名规则

FreeRTOS 中宏名通常采用全大写形式，必要时可带模块前缀，用来表示宏定义所属文件或功能模块。

例如：

- `pdTRUE`
- `pdFALSE`
- `portMAX_DELAY`
- `configUSE_PREEMPTION`

其中一些常见前缀含义如下：

- `pd`：project definition，常用于逻辑值和状态值
- `port`：与移植层相关
- `config`：配置项相关

这种命名方式能够帮助开发者快速区分宏的作用来源。

---

## 8 本章小结

本章主要从源码结构角度对 FreeRTOS 进行了总体认识。

主要内容包括：

1. FreeRTOS 在 STM32CubeMX 工程中主要涉及 `Core` 和 `Middlewares/Third_Party/FreeRTOS/Source` 两个目录
2. `tasks.c` 和 `list.c` 是最核心的源码文件
3. `portable` 目录下的 `port.c` 和 `portmacro.h` 是与具体平台移植密切相关的文件
4. 使用 FreeRTOS 时，需要正确添加内核头文件目录、移植层头文件目录以及 `FreeRTOSConfig.h` 所在目录
5. 内存管理通过 `MemMang` 目录下的 `heap_1.c` 到 `heap_5.c` 实现
6. FreeRTOS 的启动入口通常在 `main.c` 中，先初始化内核和任务，再启动调度器
7. FreeRTOS 在数据类型、变量名、函数名和宏命名方面具有鲜明的工程规范特征

通过本章学习，可以对 FreeRTOS 的源码组织方式和基本规范建立整体认识，为后续深入学习任务调度、队列机制、中断管理和内存分配打下基础。