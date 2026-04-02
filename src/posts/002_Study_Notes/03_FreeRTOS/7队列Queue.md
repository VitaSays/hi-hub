---
title:7 队列Queue
---
# 队列Queue知识点总结

## 一、什么是队列

在 FreeRTOS 中，**队列（Queue）** 是一种最基础、最常用的任务间通信机制。

你可以先把它理解成一个 **“带缓存的消息传递通道”**。

它的核心作用是：

- 在 **任务与任务之间** 传递数据
- 在 **中断与任务之间** 传递数据
- 在传递数据的同时，实现一定的 **同步与阻塞唤醒**

---

## 二、队列的本质

队列本质上是 FreeRTOS 在内存中开辟的一块 **先进先出（FIFO）** 的缓冲区。

所谓先进先出，就是：

- 先发送进去的数据
- 先被接收出来

例如：

- 任务A先发 100
- 任务B后发 200

那么接收时通常就是：

- 先收到 100
- 再收到 200

这就和现实中的排队很像：

- 先排队的人先出来
- 后排队的人后出来

所以，**队列就是一种按照顺序缓存和传递数据的机制**。

---

## 三、为什么需要队列

在裸机程序里，如果两个模块之间要传数据，很多人会直接用全局变量。

但是在 RTOS 里，多个任务可能同时运行，如果还只是用全局变量，就容易出现这些问题：

- 数据被覆盖
- 访问冲突
- 无法缓存多条消息
- 不能自动阻塞等待
- 程序耦合度高

而队列可以很好地解决这些问题，因为它具备：

- **数据缓存能力**
- **阻塞等待能力**
- **任务唤醒机制**
- **更清晰的任务解耦方式**

所以在 FreeRTOS 里，队列是非常重要的通信手段。

---

## 四、队列的几个核心特点

### 1. 队列可以传递“数据”

这是队列最本质的特征。

它不是简单地告诉你“有事发生了”，而是能真正传递内容，比如：

- 一个整数
- 一个字符
- 一个结构体
- 一个指针
- 一帧消息

例如：

- 按键任务发送按键值
- 串口中断发送接收到的字节
- 传感器任务发送温度结构体

---

### 2. 队列可以缓存多个数据项

队列不是只能放一个值，它可以放很多个元素。

例如：

```c
QueueHandle_t q;
q = xQueueCreate(5, sizeof(int));
```

这表示这个队列可以缓存 **5 个 int 类型的数据**。

也就是说，它不是“来了一个就必须马上取走”，而是可以先存起来，后面再慢慢接收。

---

### 3. 队列中的每个元素大小固定

创建队列时，必须指定：

- 队列最多能装多少个元素
- 每个元素占多少字节

例如：

```c
xQueueCreate(10, sizeof(char));
```

表示：

- 最多存 10 个元素
- 每个元素大小为 `char`

所以：

**一个队列中的元素类型应该统一，单个元素大小固定。**

---

### 4. 队列支持阻塞等待

这是队列非常实用的地方。

#### 发送时

如果队列满了：

- 可以立即返回失败
- 也可以阻塞等待，直到有空位

#### 接收时

如果队列空了：

- 可以立即返回失败
- 也可以阻塞等待，直到有新数据

所以队列不仅能传数据，还能让任务在条件不满足时自动休眠，不浪费 CPU。

---

### 5. 队列一般是先进先出

默认情况下，FreeRTOS 队列按 FIFO 工作：

- 从队尾发送
- 从队头接收

当然，也有插到队头的函数，但最常用的还是普通发送。

---

## 五、队列和信号量的区别

这一点很容易混。

### 队列

重点是：

**传递具体数据**

比如：

- 发送一个 `int`
- 发送一个结构体
- 发送一个消息指针

### 信号量

重点是：

**表示资源或事件状态**

比如：

- 某资源可用了
- 某任务完成了
- 某中断发生了

所以一句话总结就是：

**队列传数据，信号量传状态。**

---

## 六、队列相关函数总结

下面按“创建、发送、接收、中断版、辅助函数”来梳理。

---

# 1. 创建队列

队列的创建有 2 种方法：**动态分配内存、静态分配内存**

## 1.1 `xQueueCreate()`动态创建函数

函数原型：

```c
QueueHandle_t xQueueCreate(UBaseType_t uxQueueLength, UBaseType_t uxItemSize);
```

### 作用

动态创建一个队列。

### 参数解释

#### `uxQueueLength`

表示队列长度，也就是这个队列最多能放多少个数据项。

#### `uxItemSize`

表示每个数据项的大小，单位是字节。

### 返回值

- 成功：返回队列句柄
- 失败：返回 `NULL`

### 示例

```c
QueueHandle_t myQueue;
myQueue = xQueueCreate(5, sizeof(int));
```

表示：

- 创建一个队列
- 最多存 5 个元素
- 每个元素是一个 `int`

也就是：**创建一个可以缓存 5 个整数的队列**

---


## 1.2 `xQueueCreateStatic()`静态创建函数

作用：

静态创建队列。

和 `xQueueCreate()` 的区别在于：

- `xQueueCreate()`：动态分配内存
- `xQueueCreateStatic()`：用户自己提供内存

在很多嵌入式项目里，为了避免动态内存问题，静态创建也很常见。

# 2. 发送队列数据的函数

---

## 2.1 `xQueueSend()`

函数原型：

```c
BaseType_t xQueueSend(
    QueueHandle_t xQueue,
    const void *pvItemToQueue,
    TickType_t xTicksToWait
);
```

### 作用

把一个数据项发送到队列中。

### 参数解释

#### `xQueue`

要发送到哪个队列。

#### `pvItemToQueue`

要发送的数据地址。

注意：

这里传的是地址，不是值本身。

#### `xTicksToWait`

如果队列满了，最多等待多少个 tick。

- `0`：不等待，立即返回
- `portMAX_DELAY`：一直等

### 返回值

- `pdPASS`：发送成功
- 失败：队列满且等待超时

### 示例

```c
int data = 100;
xQueueSend(myQueue, &data, portMAX_DELAY);
```

表示：

- 把 `data` 的值复制到队列中
- 如果队列满了，就一直等

---

## 2.2 `xQueueSendToBack()`

作用和 `xQueueSend()` 基本一样，表示：

**把数据发送到队尾**

```c
xQueueSendToBack(myQueue, &data, 0);
```

通常：

```c
xQueueSend() == xQueueSendToBack()
```

---

## 2.3 `xQueueSendToFront()`

作用：

**把数据插入到队头**

```c
xQueueSendToFront(myQueue, &data, 0);
```

这样这个数据会比之前队列中的数据更早被接收。

适合某些高优先级消息插队的场景。

---

# 3. 接收队列数据的函数

---

## 3.1 `xQueueReceive()`

函数原型：

```c
BaseType_t xQueueReceive(
    QueueHandle_t xQueue,
    void *pvBuffer,
    TickType_t xTicksToWait
);
```

### 作用

从队列中取出一个数据项，并复制到用户提供的缓冲区中。

### 参数解释

#### `xQueue`

从哪个队列中取数据。

#### `pvBuffer`

接收到的数据存放到哪里。

#### `xTicksToWait`

如果队列为空，最多等待多少个 tick。

- `0`：不等待
- `portMAX_DELAY`：一直等

### 返回值

- `pdPASS`：接收成功
- `pdFALSE`：接收失败，一般是队列为空且等待超时

### 示例

```c
int recvData;
xQueueReceive(myQueue, &recvData, portMAX_DELAY);
```

表示：

- 从 `myQueue` 中接收一个元素
- 拷贝到 `recvData`
- 如果没数据就一直等

---

# 4. 中断中使用的发送与接收函数

在中断服务函数里，**不能直接用普通的 `xQueueSend()` 和 `xQueueReceive()`**，因为它们是给任务环境使用的。

中断里要用 `FromISR` 版本。

---

## 4.1 `xQueueSendFromISR()`

函数原型：

```c
BaseType_t xQueueSendFromISR(
    QueueHandle_t xQueue,
    const void *pvItemToQueue,
    BaseType_t *pxHigherPriorityTaskWoken
);
```

### 作用

在中断中向队列发送数据。

### 额外参数说明

#### `pxHigherPriorityTaskWoken`

用于通知内核：

发送数据后，是否唤醒了更高优先级任务。

一般写法：

```c
BaseType_t xHigherPriorityTaskWoken = pdFALSE;
xQueueSendFromISR(myQueue, &data, &xHigherPriorityTaskWoken);
portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
```

---

## 4.2 `xQueueReceiveFromISR()`

作用：

在中断中从队列接收数据。

不过实际开发中，最常见的是中断里发送，任务里接收。

---

# 5. 队列状态相关函数

---

## 5.1 `uxQueueMessagesWaiting()`

作用：

获取当前队列中已有多少个数据项。

```c
UBaseType_t num = uxQueueMessagesWaiting(myQueue);
```

例如：

- 队列长度是 5
- 当前存了 3 个元素

那么返回值就是 3。

---

## 5.2 `uxQueueSpacesAvailable()`

作用：

获取队列中还剩多少空位。

```c
UBaseType_t freeNum = uxQueueSpacesAvailable(myQueue);
```

如果队列长度是 5，现在用了 3 个，那么剩余空位就是 2。

---

## 5.3 `vQueueDelete()`

作用：

删除一个动态创建的队列。

```c
vQueueDelete(myQueue);
```

一般用于不再需要该队列时释放资源。

---





## 七、发送和接收时要理解的关键点

### 1. 队列传递的是“数据副本”

比如：

```c
int data = 10;
xQueueSend(myQueue, &data, 0);
data = 20;
```

即使后面把 `data` 改成 20，队列里原来发进去的仍然是 10。

因为队列存的是复制进去的数据，不是原变量本身。

---

### 2. 第二个参数通常都传地址

发送时：

```c
xQueueSend(myQueue, &data, 0);
```

接收时：

```c
xQueueReceive(myQueue, &recvData, 0);
```

因为 FreeRTOS 需要根据元素大小，从指定地址拷贝数据。

---

### 3. 如果传的是指针，要特别小心

如果队列创建成：

```c
xQueueCreate(5, sizeof(char *));
```

那么队列里存的就是“指针值”，不是指针指向的内容本体。

这时候你必须保证：

- 指针指向的内存没有失效
- 接收时这块数据仍然有效

否则就容易出错。

---

## 八、队列使用示例

下面给你一个最典型的例子：

- 创建一个整型队列
- 一个任务负责发送数据
- 一个任务负责接收数据

---

### 示例代码

```c
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include <stdio.h>

QueueHandle_t myQueue;

/* 发送任务 */
void SendTask(void *pvParameters)
{
    int num = 1;

    while (1)
    {
        if (xQueueSend(myQueue, &num, portMAX_DELAY) == pdPASS)
        {
            printf("发送成功: %d\r\n", num);
            num++;
        }

        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

/* 接收任务 */
void ReceiveTask(void *pvParameters)
{
    int recvNum;

    while (1)
    {
        if (xQueueReceive(myQueue, &recvNum, portMAX_DELAY) == pdPASS)
        {
            printf("接收到数据: %d\r\n", recvNum);
        }
    }
}

int main(void)
{
    /* 创建队列：最多存 5 个 int */
    myQueue = xQueueCreate(5, sizeof(int));

    if (myQueue == NULL)
    {
        printf("队列创建失败\r\n");
        while (1);
    }

    /* 创建任务 */
    xTaskCreate(SendTask, "SendTask", 256, NULL, 2, NULL);
    xTaskCreate(ReceiveTask, "ReceiveTask", 256, NULL, 2, NULL);

    /* 启动调度器 */
    vTaskStartScheduler();

    while (1);
}
```

---

## 九、这个例子怎么理解

### 第一步：创建队列

```c
myQueue = xQueueCreate(5, sizeof(int));
```

表示：

- 队列最多能存 5 个元素
- 每个元素大小是 `int`
- 也就是最多缓存 5 个整数

---

### 第二步：发送任务

```c
xQueueSend(myQueue, &num, portMAX_DELAY);
```

表示：

- 把 `num` 的值发送到队列里
- 如果队列满了，就一直等待

发送一次后，`num++`，所以下次会发送更大的数。

---

### 第三步：接收任务

```c
xQueueReceive(myQueue, &recvNum, portMAX_DELAY);
```

表示：

- 从队列中取出一个整数
- 拷贝到 `recvNum`
- 如果队列空了，就一直等待

---

### 第四步：整体运行效果

程序运行后，大致会表现为：

```c
发送成功: 1
接收到数据: 1
发送成功: 2
接收到数据: 2
发送成功: 3
接收到数据: 3
```

这就体现了队列的基本流程：

- 发送方往里放数据
- 接收方从里取数据
- 队列在中间起到缓存和同步作用

---

## 十、面试时怎么回答“什么是队列”

如果面试官问你：

**什么是 FreeRTOS 队列？**

你可以这样回答：

> FreeRTOS 队列是一种任务间通信机制，本质上是由内核管理的一块先进先出缓冲区，用于在任务与任务、任务与中断之间传递数据。  
> 创建队列时需要指定队列长度和每个数据项大小。  
> 发送方将数据复制到队列中，接收方从队列中取出数据。  
> 当队列满时发送任务可以阻塞等待，当队列空时接收任务也可以阻塞等待，因此队列不仅可以实现数据通信，还可以实现任务同步。

---

## 十一、最后总结

你可以把 FreeRTOS 队列总结成下面这几句话：

### 1. 队列是什么

队列是 FreeRTOS 提供的一种 **带缓存的任务间通信机制**，本质上是一个 **先进先出 FIFO 缓冲区**。

### 2. 队列能干什么

它可以用于：

- 任务和任务之间传数据
- 中断和任务之间传数据
- 在传数据的同时实现阻塞与唤醒

### 3. 队列的核心特点

- 能传递具体数据
- 能缓存多个数据项
- 元素大小固定
- 支持阻塞等待
- 默认先进先出

### 4. 最核心的函数

- `xQueueCreate()`：创建队列
- `xQueueSend()`：发送数据
- `xQueueReceive()`：接收数据
- `xQueueSendFromISR()`：中断发送
- `uxQueueMessagesWaiting()`：查看当前消息数
- `vQueueDelete()`：删除队列

### 5. 最核心的一句话

**FreeRTOS 队列 = 带缓存、可阻塞、先进先出的数据通信机制。**

---

如果你愿意，我下一步可以继续帮你整理成一版更适合背诵的：

**“FreeRTOS 队列面试题答案版”**  
也就是压缩成 3 分钟内可以直接说出来的版本。