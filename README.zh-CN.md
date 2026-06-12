# ERP PrintAgent

ERP PrintAgent 是一个面向珠宝饰品 ERP 的本地打印组件。它以 Electron 托盘应用运行，在本机启动 HTTP 服务，让 ERP 网页系统可以调用本地热敏标签打印机完成标签预览、测试打印和正式打印。

## 功能特性

- 本地服务地址：`http://127.0.0.1:17688`
- 支持健康检查、打印机列表、标签模板渲染、标签打印和测试打印
- 支持根据 ERP 标签模板 JSON 渲染文字、条码、二维码、线条、矩形和图片
- 通过 Electron `webContents.print` 调用系统打印能力
- 托盘菜单支持查看状态、打开设置、测试打印、打开配置文件、打开日志和退出
- 配置和日志默认存放在 `%APPDATA%/ERP-PrintAgent`
- 接口通过 `X-PrintAgent-Token` 做本地调用保护
- Windows 支持 NSIS 安装包，macOS 支持 DMG 和 ZIP 构建

## 安装依赖

```bash
npm install
```

## 本地运行

```bash
npm run dev
```

启动后可以访问：

- `http://127.0.0.1:17688/`：本地状态页
- `http://127.0.0.1:17688/health`：公开健康检查
- `http://127.0.0.1:17688/printers?token=local-secret-token`：浏览器调试打印机列表

除 `/health` 外，接口默认都需要 Token。ERP 调用时应传入：

```http
X-PrintAgent-Token: local-secret-token
```

浏览器临时调试也可以使用 `?token=local-secret-token`。

## 测试

```bash
npm test
```

## 打包

安装包由 `electron-builder` 生成，输出目录为：

```text
release/
```

应用图标资源位置：

- `build/icon.png`
- `build/icon.ico`
- `build/icon.icns`
- `src/assets/icon.png`

构建脚本默认设置：

- 使用本地 Electron 运行时：`node_modules/electron/dist`
- electron-builder 工具缓存：`.runtime/electron-builder-cache`
- electron-builder 二进制镜像：`https://npmmirror.com/mirrors/electron-builder-binaries/`
- 如果当前没有代理环境变量，默认使用代理：`http://127.0.0.1:7897`

如果你的代理端口不同，可以在运行打包命令前覆盖环境变量。

### Windows 安装包

在 Windows 上运行：

```bash
npm run dist:win
```

输出示例：

```text
release/ERP-PrintAgent-Setup-1.0.0-win-x64.exe
```

Windows 安装包使用 NSIS，支持安装目录选择、桌面快捷方式和开始菜单快捷方式。用户配置保存在 `%APPDATA%/ERP-PrintAgent`，升级安装时不会丢失。

### macOS 安装包

在 macOS 上运行：

```bash
npm run dist:mac
```

输出示例：

```text
release/ERP-PrintAgent-1.0.0-mac-x64.dmg
release/ERP-PrintAgent-1.0.0-mac-arm64.dmg
release/ERP-PrintAgent-1.0.0-mac-x64.zip
release/ERP-PrintAgent-1.0.0-mac-arm64.zip
```

第一版 macOS 包默认未签名。首次运行时可能需要在系统设置的“隐私与安全性”中允许打开。正式对外分发时建议配置 Apple Developer ID 证书和公证流程。

### 开发版打包

只生成未压缩的应用目录，不生成安装包：

```bash
npm run pack:win
npm run pack:mac
```

Windows 可以构建 Windows 安装包。macOS 的 DMG 建议在 macOS 上构建，因为签名、公证和 DMG 工具链依赖 macOS 环境。

## 接口说明

### GET /health

健康检查接口，不需要 Token。

### GET /printers

获取本机打印机列表，需要 `X-PrintAgent-Token`。

### POST /print/html

直接打印 HTML，需要 `X-PrintAgent-Token`。

```json
{
  "printerName": "HPRT D35BT",
  "silent": true,
  "copies": 1,
  "widthMm": 40,
  "heightMm": 30,
  "html": "<html>...</html>"
}
```

### POST /render/label

根据 ERP 标签模板和数据渲染可打印 HTML，主要用于预览，需要 `X-PrintAgent-Token`。

```json
{
  "template": {
    "templateName": "SKU 标签",
    "widthMm": 50,
    "heightMm": 30,
    "templateJson": "{\"widthMm\":50,\"heightMm\":30,\"elements\":[]}"
  },
  "rows": [
    {
      "skuNo": "es00001-01",
      "productCode": "es00001"
    }
  ]
}
```

### POST /print/label

根据 ERP 标签模板和数据渲染 HTML，并发送到指定打印机，需要 `X-PrintAgent-Token`。

```json
{
  "printerName": "HPRT D35BT",
  "copies": 1,
  "template": {
    "templateName": "SKU 标签",
    "widthMm": 50,
    "heightMm": 30,
    "templateJson": "{\"widthMm\":50,\"heightMm\":30,\"elements\":[]}"
  },
  "rows": [
    {
      "skuNo": "es00001-01",
      "productCode": "es00001"
    }
  ]
}
```

### POST /print/test

发送一张默认测试标签到当前配置的打印机，需要 `X-PrintAgent-Token`。

## 标签模板数据

模板元素支持字段占位符，例如：

```text
{{skuNo}}
{{productCode}}
{{styleName}}
{{supplierName}}
```

渲染时会从 `rows` 中对应的数据对象取值。条码和二维码内容不能为空，否则会返回明确错误，避免打印出无效标签。

## Windows 打印机设置建议

以 HPRT D35BT 等热敏标签打印机为例，标签尺寸需要在三个地方保持一致：

1. ERP 标签模板尺寸
2. PrintAgent 渲染出的 HTML `@page size`
3. Windows 打印机首选项中的纸张尺寸

如果预览位置正确但实际打印偏移，优先检查打印机驱动里的纸张尺寸、边距、缩放和标签校准设置。

## 常见问题

### 接口返回 Unauthorized

说明没有传 Token。请确认请求头包含：

```http
X-PrintAgent-Token: local-secret-token
```

或在浏览器调试时使用：

```text
?token=local-secret-token
```

### 打包时下载失败

构建脚本已经默认使用国内镜像和 `127.0.0.1:7897` 代理。如果你的代理端口不同，请先设置：

```powershell
$env:HTTP_PROXY="http://127.0.0.1:你的端口"
$env:HTTPS_PROXY="http://127.0.0.1:你的端口"
npm run dist:win
```

### 打印位置和模板预览不一致

通常不是 PrintAgent 的坐标问题，而是打印机驱动纸张尺寸、边距或缩放不一致。请确保 ERP 模板、HTML 页面尺寸和系统打印机纸张尺寸一致。
