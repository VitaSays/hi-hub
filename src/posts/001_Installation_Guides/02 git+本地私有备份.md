---
title: 02 Git + GitHub 代码备份
---
# Git + GitHub 代码备份（Ubuntu20.04）

## 一、日常备份
进入项目目录：
```bash
cd ~/Bank/my_github/ur10e_ocs_2
```

执行备份三步：

### 1. 添加所有修改
```bash
git add .
```
### 2. 提交并写备注
```bash
git commit -m "本次更新内容说明"
```
### 3. 推送到 GitHub 云端
```bash
git push
```

---

## 二、新项目备份流程
1. 登录 GitHub 网页，点击右上角 **+ → New repository**
2. 创建私有仓库（按下图填写）：
   - Repository name：项目名称（英文，无空格）
   - Description：项目描述（可选）
   - **Visibility 选择 Private（私有，必须选）**
   - 勾选 Add a README file（可选，方便识别仓库）
   - 点击 **Create repository**
3. 进入仓库页面，点击绿色 **Code → 复制 HTTPS 地址**
4. 打开 Ubuntu 终端，克隆仓库到本地：
```bash
cd ~/Bank/my_github
git clone 刚才复制的HTTPS地址
```
5. 把你要备份的项目代码，全部复制到克隆出来的项目文件夹内
6. 进入项目目录，执行备份命令：
```bash
cd 你的项目文件夹名
git add .
git commit -m "初始化项目"
git push
```

---

## 三、换电脑/重装系统：拉回代码
```bash
git clone https://github.com/VitaSays/ur10e_ocs_2.git
```
验证信息：
- 用户名：`VitaSays`
- 密码：你的 `ghp_` 开头 Token

---

## 四、常用辅助命令
```bash
# 查看修改状态
git status

# 查看提交历史
git log

# 同步云端最新代码
git pull
```

---

## 五、重要说明（第一次必看）
### 1. 终端提示登录时怎么填？
- **Username（用户名）**：固定填你的 GitHub 账号名 → `VitaSays`
- **Password（密码）**：**绝对不填 GitHub 登录密码**
  必须填：以 `ghp_` 开头的 **Token**

### 2. Password 对应的 Token 在哪里找？
- 打开 GitHub → 右上角头像 → **Settings**
- 左侧菜单拉到最下 → **Developer settings**
- 点击 **Personal access tokens → Tokens (classic)**
- 能看到你创建过的 Token（**只显示一次，丢失只能重新生成**）
- 重新生成方法：
  - 点击 **Generate new token (classic)**
  - Note 填写 `ubuntu`
  - Expiration 选择 `90 days` 或 `No expiration`
  - 勾选权限 **repo**
  - 拉到底部点击 **Generate token**
  - 复制出现的 `ghp_` 开头字符串，这就是 Password

### 3. 终端粘贴不上 Token？用这条命令直接跳过输入
如果在终端无法粘贴密码，**直接使用带 Token 的克隆命令**，无需输入账号密码：
```bash
git clone https://ghp_你的Token@github.com/Username（用户名）/项目名.git
```
比如
```bash
git clone https://ghp_你的Token@github.com/VitaSays/项目名.git
```


---

## 六、终身核心命令（只记这 3 条）
```bash
git add .
git commit -m "更新说明"
git push
```