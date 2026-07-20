# 今天谁是寿司王

一款使用 Expo React Native 构建的 iOS / Android 跨端寿司计数对战应用。

## 当前实现

- 无账号创建比赛与昵称输入
- 二维码展示、扫码入口和深链参数
- 两人到齐后自动进入比赛
- 自定义共享寿司名称
- 独立悬浮寿司卡片
- 自己计数、修正和即时撤销
- Supabase 匿名身份、双人房间和扫码加入
- 双机共享菜单、计数事件与比分实时同步
- 服务端事件幂等、成员级 RLS 和双方结束确认
- 未配置云端时自动使用本机演示模式
- 比分板、操作记录和结束确认
- 冠军结算、系统分享和本地历史
- AsyncStorage 本地恢复
- iOS / Android 原生安全区、触觉与减少动态效果适配

当前版本已经接入 Supabase 实时房间。配置 Project URL 和 Publishable Key 后，两台 iOS / Android 手机可以扫码进入同一场比赛；未配置时，等待页保留“本机演示：模拟对手加入”以便直接体验。

完整云端配置见 [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)。完整离线事件队列仍在后续范围内。

## 本地运行

```bash
npm install
npm run android
```

其他目标：

```bash
npm run ios
npm run web
```

Windows 无法直接执行本地 iOS 模拟器，可使用 Expo Go 在 iPhone 真机预览，或在 macOS 上运行 iOS 模拟器。

## 安装包

项目已经提供 EAS Build 配置。Android 内测 APK、iOS 内测包与正式商店包的命令见 [docs/BUILD.md](./docs/BUILD.md)。

## 验证

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform web --clear
```

当前验证结果：

- TypeScript 类型检查通过
- Expo Doctor 20/20 通过
- Web 正式导出通过
- 浏览器端完整主流程通过且无控制台错误

## 目录

```text
src/
  components/   像素按钮、硬阴影表面、比分板和寿司签
  hooks/        减少动态效果等跨端能力
  navigation/   页面路由类型
  screens/      创建、扫码、比赛、结算和历史页面
  services/     Supabase 匿名认证、RPC、快照与实时订阅
  store/        比赛状态与本地持久化
  theme/        颜色、尺寸和动效令牌
  types/        比赛领域模型
design/         视觉原型与运行截图
supabase/       数据库迁移、RLS 与服务端 RPC
docs/           云端配置和双端安装包说明
```

产品范围详见 [PRD.md](./PRD.md)，视觉系统详见 [DESIGN.md](./DESIGN.md)。
