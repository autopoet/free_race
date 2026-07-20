---
name: "今天谁是寿司王"
description: "装进手机里的暖色像素寿司掌机"
colors:
  salmon: "#F47661"
  lacquer-red: "#D94B45"
  counter-orange: "#F3A65A"
  rice: "#FFF8E8"
  surface: "#FFFFFF"
  tamago: "#F9CB5C"
  nori: "#315447"
  soy: "#402A26"
  muted-soy: "#76554D"
  blush-shadow: "#F5B2A2"
typography:
  display:
    fontFamily: "Pixelify Sans, ui-monospace, monospace"
    fontSize: "48px"
    fontWeight: 500
    lineHeight: 1
  headline:
    fontFamily: "system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  control: "12px"
  card: "16px"
  sheet: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.salmon}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "{colors.tamago}"
    textColor: "{colors.soy}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
  sushi-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.soy}"
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: 今天谁是寿司王

## Overview

**Creative North Star: "暖机寿司"**

界面像一台放在寿司桌上的小型掌机：米饭般清楚的工作面、鲑鱼和玉子的温暖动作色、酱油色的稳定结构，加上逐像素校准的短硬阴影。像素语言只出现在数字、边缘、状态与小型寿司筹码中；中文信息继续使用平台系统字体，保证长时间用餐中的可读性。

卡片只用于真正可触摸的寿司签、比分板和关键结果。其余内容依靠留白、排版与分隔组织。常态安静，点击计数、对手得分、反超和夺冠才产生明确动势。

**Key Characteristics:**

- 暖色全调色板，但深酱油色保证结构和对比。
- 短硬偏移阴影，不使用大面积柔光。
- 玩家身份同时依靠颜色、昵称、位置和文字。
- 像素数字负责游戏感，系统中文字体负责信息。
- 原生安全区、返回行为、触觉和减少动态效果始终优先。

## Colors

鲑鱼橙承担主要动作，玉子黄负责友好次动作，海苔绿只用于稳定状态，米白和纯白形成工作层次，深酱油色承载文字与比分板。

**The Warm Table Rule.** 暖意由品牌动作色和桌面橙承担；内容表面保持清晰米白或纯白，禁止把所有元素一起染黄。

**The Two Players Rule.** 两位玩家颜色固定且必须配合昵称与位置；任何胜负信息不得只使用红绿差异。

## Typography

**Display Font:** Pixelify Sans（数字与短状态）

**Body Font:** iOS San Francisco / Android Roboto / 系统中文字体

**Character:** 像素字体制造掌机读数感，系统字体保持中文输入、寿司名称和辅助说明自然可信。

### Hierarchy

- **Display**（500，48–72px，1.0）：总比分、结算数字。
- **Headline**（700，28–32px，1.2）：产品名、冠军、寿司名称。
- **Title**（600，20–24px，1.3）：页面标题与弹层标题。
- **Body**（400，16–18px，1.5）：说明、状态和输入内容。
- **Label**（600，13–15px，1.3）：玩家归属、时间和辅助动作。

**The Pixel Accent Rule.** Pixelify Sans 禁止用于长中文、表单标签或说明段落。

## Elevation

系统采用结构化硬阴影：交互表面下方放置 4–8px 的纯色偏移层，不使用模糊半透明大阴影。按下时前景向阴影靠近，形成掌机按钮的实体反馈；弹层使用系统级遮罩与平台标准进出场。

**The Short Shadow Rule.** 阴影偏移不得超过 8px，不与细描边叠加制造“幽灵卡片”。

## Components

### Buttons

- **Shape:** 像素切角感的轻圆角（12px），最小高度 52px。
- **Primary:** 鲑鱼橙前景、漆红硬阴影、白色文字。
- **Secondary:** 玉子黄前景、深金硬阴影、酱油色文字。
- **Press / Focus:** 按下向下平移 4px并缩放至 0.98；键盘焦点和屏幕阅读器焦点必须清晰。
- **Disabled:** 保留文字对比，降低色彩强度，不只改变透明度。

### Cards / Containers

- **Corner Style:** 寿司签 16px，保持独立悬浮。
- **Background:** 纯白；激活时改为浅玉子表面。
- **Shadow Strategy:** 使用玩家色或腮红色 6px 硬偏移层。
- **Border:** 默认无描边。
- **Internal Padding:** 18–20px。

### Inputs / Fields

- **Style:** 白色实体输入面、12px 圆角、腮红色硬偏移层。
- **Focus:** 鲑鱼色底部像素游标或 2px 焦点轮廓。
- **Error / Disabled:** 错误以漆红文字和图标共同表达；禁用仍保持 4.5:1 文本对比。

### Navigation

使用原生导航栈和平台返回手势。比赛页只有一个固定比分区、寿司签滚动区和底部主动作，不增加多余标签栏。

### Score HUD

深酱油色实体比分板，左右固定玩家位置，中间为 VS 与领先状态。总分使用像素字体，昵称和领先说明使用系统字体。比分变化使用数字滚动；反超时玩家色在中线完成一次 350ms 的领地交接。

### Sushi Card

寿司名称是卡片第一层信息，双方数量为第二层，`+1` 是唯一主动作。连续点击始终可用；卡片本身不因计数重新排序。

## Do's and Don'ts

### Do:

- **Do** 保持“谁领先”和“怎样加一”在比赛首屏可见。
- **Do** 使用 4–8px 纯色硬阴影表达触感。
- **Do** 用昵称、位置和文字补充玩家颜色。
- **Do** 把庆祝动效留给反超和夺冠。
- **Do** 分别遵守 iOS 44pt 与 Android 48dp 触摸目标。

### Don't:

- **Don't** 把界面做成冷冰冰的表格、记账器或健康管理工具。
- **Don't** 使用玻璃拟态、紫色渐变、大面积软阴影或通用 SaaS 仪表盘结构。
- **Don't** 用照片、复杂卡通插画或装饰性图标掩盖计数任务。
- **Don't** 让像素字体承担长中文内容。
- **Don't** 因动画阻止连续计数，或忽略系统减少动态效果。
