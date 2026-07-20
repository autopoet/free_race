# Supabase 实时联机配置

应用没有配置 Supabase 时会自动使用本机演示模式；配置完成后，创建比赛和扫码加入会自动切换为真实双机模式。

## 让 Codex 自动配置

如果希望 Codex 代为创建项目、执行迁移并填写客户端配置：

1. 登录 [Supabase Access Tokens](https://supabase.com/dashboard/account/tokens)。
2. 创建一个临时 Personal Access Token。
3. 把令牌作为唯一一行保存到项目根目录的 `.supabase-access-token`。
4. 告诉 Codex“令牌已放好”。

`.supabase-access-token` 已被 Git 忽略。自动配置完成后应立即删除本地文件，并在 Supabase 页面撤销该临时令牌。不要把令牌粘贴到聊天、`.env` 或源码中。

## 1. 创建项目

1. 在 Supabase 新建一个项目。
2. 打开 `Authentication → Providers → Anonymous Sign-Ins`。
3. 启用匿名登录。用户仍然不需要注册或填写手机号。

## 2. 建立数据库

在 Supabase Dashboard 的 SQL Editor 中打开并执行：

```text
supabase/migrations/202607200001_sushi_battle_realtime.sql
```

迁移会创建：

- 双人比赛、玩家、共享寿司与不可变计数事件表；
- 创建房间、原子加入、添加寿司、计数和双方结束确认 RPC；
- 仅允许比赛成员读取的 RLS 策略；
- Realtime 表发布；
- 服务端昵称、房间状态、负数计数与事件幂等校验。

客户端没有任何表的直接写权限。请勿把 `service_role` 或 Secret Key 放进应用。

## 3. 配置客户端

复制 `.env.example` 为 `.env`，然后从 `Project Settings → API` 填入：

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的_publishable_key
```

保存后清理缓存并重启：

```bash
npx expo start --clear
```

等待页出现“实时房间已连接”即表示配置生效。

## 4. 双机验收

1. 手机 A 填昵称创建比赛，停留在二维码等待页。
2. 手机 B 点击“扫码加入”，扫描 A 的二维码并填昵称。
3. 两台手机应自动进入同一比赛。
4. A 新增一种寿司，B 应立即看到同名寿司签。
5. A、B 分别点击自己的 `+1`，双方总分和明细应一致。
6. A 申请结束，B 应自动看到确认弹层；B 确认后两台手机进入战报。

## 当前边界

- 已实现在线实时同步、服务端幂等、应用重启后的房间恢复。
- 断网时界面会提示并重试；完整的离线事件队列与重连合并尚未实现。
- MVP 当前要求双方确认结束；PRD 中“对方离线 10 分钟后单方结束”尚未实现。
- 完成比赛的服务端自动清理任务尚未配置。
