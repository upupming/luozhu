import vscode from 'vscode';
import execa from 'execa';
import path from 'path';

/**
 * 获取基于 umijs 的 webview 内容
 * @param context 扩展上下文
 * @param webviewPanel webview 面板对象
 * @param rootPath webview 所在路径，默认 web
 * @returns string
 */
export const getUmiHTMLContent = (
  context: vscode.ExtensionContext,
  webviewPanel: vscode.WebviewPanel,
  rootPath = 'web'
): string => {
  // 获取内容的 Uri
  const getDiskPath = (fileName: string) => {
    return webviewPanel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, rootPath, 'dist', fileName))
    );
  };
  const { stdout: umiVersion } = execa.commandSync('umi --version');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no"
        />
        <link rel="stylesheet" href="${getDiskPath('umi.css')}" />
        <style>
          html, body, #root {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          // 给 webview 内容加上主题
          body.vscode-light {
            color: black;
            background-color: var(--vscode-editor-background);
          }
          body.vscode-light h1, h2, h3, h4, h5, h6 {
            color: black;
          }
          body.vscode-dark {
            color: white;
            background-color: var(--vscode-editor-background);
          }
          body.vscode-dark h1, h2, h3, h4, h5, h6 {
            color: white;
          }
          body.vscode-high-contrast {
            color: red;
            background-color: var(--vscode-editor-background);
          }
          body.vscode-high-contrast h1, h2, h3, h4, h5, h6 {
            color: red;
          }
        </style>
        <script>
          //! umi version: ${umiVersion}
          window.vscodeEnv = ${JSON.stringify(vscode.env)}
        </script>
      </head>
      <body>
        <div id="root"></div>

        <script src="${getDiskPath('umi.js')}"></script>
      </body>
    </html>
  `;
};

// 追踪当前 webview 面板
let currentPanel: vscode.WebviewPanel | undefined;
/**
 * 获取基于 umijs 的 webview 内容
 * @param context 扩展上下文
 * @param viewType webview 面板的唯一标识符
 * @param title webview 面板的标题
 * @param iconPath webview 面板的 Icon
 * @param umiVersion umi 版本
 * @returns vscode.WebviewPanel
 */
export const createUmiWebviewPanel = (
  context: vscode.ExtensionContext,
  viewType: string,
  title: string,
  iconPath: string,
  umiVersion?: string
) => {
  const columnToShowIn = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.viewColumn
    : undefined;
  if (currentPanel) {
    // 如果我们已经有了一个面板，那就把它显示到目标列布局中
    currentPanel.reveal(columnToShowIn);
  } else {
    // 否则，创建并显示新的 Webview
    currentPanel = vscode.window.createWebviewPanel(
      viewType, // 只供内部使用，这个 webview 的标识
      title, // 给用户显示的面板标题
      vscode.ViewColumn.One, // 给新的 webview 面板一个编辑器视图
      {
        // webview 面板的内容配置
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'web/dist'))], // 只允许 webview 加载我们插件的 `web/dist` 目录下的资源
        retainContextWhenHidden: true, // 隐藏时保留上下文
      }
    );
    // 设置 Logo
    currentPanel.iconPath = vscode.Uri.file(path.join(context.extensionPath, iconPath));
    // 设置 HTML 内容
    currentPanel.webview.html = getUmiHTMLContent(context, currentPanel, umiVersion);
  }
  // 当前面板被关闭后重置
  currentPanel.onDidDispose(
    () => {
      currentPanel = undefined;
    },
    null,
    context.subscriptions
  );
  return currentPanel;
};
