import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  "/demo/",
  {
    text: "博文",
    icon: "pen-to-square",
    prefix: "/posts/",
    children: [
      // --- 新增：安装指南 ---
      {
        text: "安装指南",
        icon: "gear", // 你可以根据需要更换图标
        prefix: "001_Installation_Guides/",
        children: [
           // 这里填写该文件夹下的具体文件名（不带.md）
           // 例如：{ text: "Isaac Sim 安装", icon: "potted-plant", link: "isaac-sim-install" },
        ],
      },
      // --- 新增：学习笔记 ---
      {
        text: "学习笔记",
        icon: "book",
        prefix: "002_Study_Notes/",
        children: [
          {
            text: "IsaacSim 4.5",
            icon: "robot",
            link: "01_Isaacsim4.5/", // 对应你的子文件夹
          },
          {
            text: "IsaacLab 2.1.1",
            icon: "flask",
            link: "02_Isaaclab2.1.1/", // 对应你的子文件夹
          },
        ],
      },


     
      
      
    ],
  },
  {
    text: "V2 文档",
    icon: "book",
    link: "https://theme-hope.vuejs.press/zh/",
  },
]);
