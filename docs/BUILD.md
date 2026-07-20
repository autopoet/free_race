# Android / iOS 安装包

项目已经包含 `eas.json`：

- `preview`：内部测试包；Android 产出可直接安装的 APK。
- `production`：商店发布包；Android 默认产出 AAB。

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

在 EAS 项目环境变量中配置与本地 `.env` 相同的两个公开变量：

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

## Android APK

```bash
npx eas-cli@latest build --platform android --profile preview
```

构建完成后会得到一个下载链接，可把 APK 直接安装到 Android 手机。

## iOS 测试包

```bash
npx eas-cli@latest build --platform ios --profile preview
```

iPhone 真机分发需要 Apple Developer 账号与签名。内部分发通常使用 Ad Hoc 设备清单；需要更广泛的测试时可改用 TestFlight。

## 正式商店包

```bash
npx eas-cli@latest build --platform all --profile production
```

正式提交 App Store / Google Play 前还需要补充商店元数据、隐私说明、截图和审核账号设置。
