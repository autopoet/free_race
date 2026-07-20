# 免费安装与分发

推荐组合：

- Android：使用 EAS `preview` 配置生成可直接安装的 APK。
- iPhone：打开 `https://autopoet.github.io/free_race/`，在 Safari 中选择
  “共享”→“添加到主屏幕”。
- 两端共用同一个 Supabase 房间和实时比分。
- 邀请二维码使用 HTTPS 链接，iPhone 系统相机和应用内扫码都能识别。

PWA 会在 `main` 分支更新后由 `.github/workflows/deploy-pages.yml`
自动构建并发布到 GitHub Pages，不需要 Apple Developer 账号。

项目已经包含 `eas.json`：

- `preview`：内部测试包；Android 产出可直接安装的 APK。

## 首次配置

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

`build:configure` 会把当前 Expo 项目关联到你的 EAS 账号。

如果希望 Codex 自动完成关联与构建，可在
[Expo Access Tokens](https://expo.dev/settings/access-tokens) 创建临时 Personal Access
Token，将其作为唯一一行保存到项目根目录的 `.expo-access-token`，然后告诉 Codex
“Expo 令牌已放好”。该文件已被 Git 忽略，构建触发后应删除并撤销临时令牌。

在 EAS 项目的 `preview` 环境中配置与本地 `.env` 相同的两个公开变量：

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

## Android APK

```bash
npx eas-cli@latest build --platform android --profile preview
```

构建完成后会得到一个下载链接，可把 APK 直接安装到 Android 手机。

本地直装版本使用项目根目录 `.credentials/` 中的发布密钥签名；该目录不会提交
到 Git。需要把密钥与属性文件一并安全备份，后续升级必须继续使用同一密钥，
否则手机只能卸载旧版后重新安装。

本项目只做朋友间内部使用，不配置 App Store、TestFlight 或 Google Play
商店发布流程。
