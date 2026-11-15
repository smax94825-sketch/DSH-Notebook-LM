# Sky Learning 云服务器部署

以下以安装了 Node.js 24 和 Caddy 的 Linux 云服务器为例。两个 Next.js 进程共用一份持久化数据。用户入口在 3101，开发者后台在 3100。

## 安装与配置

在服务器上解压并进入 `learning-studio` 目录后执行。

```bash
npm ci
cp .env.example .env.local
mkdir -p .local
```

在 `.env.local` 填好实际公网域名、持久化目录和模型密钥。数据目录需要允许运行服务的账号读写。以下域名和路径请按实际环境替换。

```dotenv
STUDIO_PUBLIC_ORIGIN=https://learn.example.com
STUDIO_DATA_DIR=/srv/learning-studio/.local
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-flash
```

本机保存的开发者密码和模型密钥位于本机数据目录。云端请在服务器项目目录运行 `npm run developer:password`，按提示设置云端的开发者密码。

在云端开发者后台「全平台模型接口」测试并保存，所有账号的问答和新生成的学习资料即使用该配置。仅在后台没有保存配置时，才使用服务器环境变量 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_MODEL`。开发者进程和公网进程必须指向同一个绝对路径的 `STUDIO_DATA_DIR`。Windows 上保存的设置不会自动同步到云端。升级时保留服务器现有的数据目录和 `.env.local`，构建后重启两个进程。

```bash
npm run build
npm run developer:password
```

如果内测海报已经印好，可以在新服务器登记海报上的同一个公开码。下面的命令使用当前海报上的码，登记后在云端单独计算 30 天有效期。要生成新码，使用 `npm run invite -- --public`。

```bash
npm run invite -- --public SKY-32AEB8CA3A
```

## 启动服务

在项目目录分别运行下面两个长期进程。正式运行时可由 systemd 或服务器面板托管，工作目录均设为项目根目录。

```bash
# 用户入口
STUDIO_MODE=invite STUDIO_DEVELOPER_MODE=0 node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3101
```

```bash
# 开发者后台
STUDIO_MODE=local STUDIO_DEVELOPER_MODE=1 node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100
```

把域名解析到服务器，放行 TCP 80 和 443。Caddy 配置如下。公网反向代理仅指向用户端的 3101。Caddy 向 HTTP 上游保留原有 Host，应用用它核对访问域名。网页并行上传使用最多 8 MiB 的分片，反向代理和 CDN 需允许相应请求体及 PUT 请求。

学习资料的 PDF 导出需要中文字体。Debian 或 Ubuntu 可安装 `fonts-noto-cjk`。其他环境可用 `STUDIO_PDF_FONT` 配置字体绝对路径，TTC 字体集合可用 `STUDIO_PDF_FONT_FACE` 指定字体名称。

```caddyfile
learn.example.com {
    reverse_proxy 127.0.0.1:3101
}
```

访问远程开发者后台时，从自己的电脑建立 SSH 转发，然后打开浏览器中的 [开发者后台](http://127.0.0.1:13100/developer)。

```bash
ssh -NT -L 13100:127.0.0.1:3100 user@server
```

## 上线验收

通过 SSH 转发进入云端后台，测试并保存全平台模型接口。再从公网用测试 QQ 号登录，向 DeepSeek 发一条问题，确认收到回答。上传带文字层的 PDF 并生成学习资料，确认讲义的引用能打开对应页，再测试 PDF 导出。最后在开发者后台检查「账号与资料」。如果云端后台提示无法连接接口，请检查服务器出站网络和日志中的模型连接错误代码。上线后备份 `STUDIO_DATA_DIR`。

使用 DeepSeek 官方接口生成学习资料还需要在服务器安装 DeepSeek Harness，并将 `DSH_ENTRY` 指向其 `lib/bin.js`。视频旁白当前依赖 Windows 语音，Linux 部署仍需适配这一功能。

参考 [Next.js 自托管](https://nextjs.org/docs/app/guides/self-hosting) · [Caddy 反向代理](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) · [Caddy 自动 HTTPS](https://caddyserver.com/docs/automatic-https)
