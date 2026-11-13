========================================
  Carbon Trace  -  Portable Edition
  碳迹 · 便携版
========================================

【怎么用 / How to run】

  双击 start.bat，浏览器会自动打开。
  Double-click start.bat. The browser opens automatically.

  关闭那个黑色窗口即可停止。
  Close the black window to stop.

  如果浏览器没自动打开，手动访问：
  If the browser does not open, visit:
  http://localhost:5173/

【需要什么 / Requirements】

  什么都不用装。node.exe 已经打包在里面。
  Nothing to install. node.exe is bundled.

  不需要联网，不需要管理员权限。
  No internet, no admin rights needed.

【重要 / IMPORTANT】

  必须先解压整个 ZIP 再运行！
  不要直接在压缩包里双击 start.bat。
  Extract the WHOLE zip first, then run start.bat.

【数据存在哪 / Where is my data】

  存在浏览器本地（IndexedDB），不上传任何服务器。
  Stored locally in your browser (IndexedDB). Never uploaded.

  换浏览器或清理浏览器数据会丢失记录。
  建议定期在「关于」页面导出备份。
  Clearing browser data will erase records.
  Export a backup from the About page regularly.

【换设备 / Moving to another device】

  把整个文件夹拷到 U 盘或另一台电脑，
  双击 start.bat 即可，路径随便放。
  Copy the whole folder anywhere and run start.bat.

【常见问题 / Troubleshooting】

  Q: 双击后窗口一闪而过？
  A: 多半是杀毒软件拦截了 node.exe。
     把整个文件夹加入白名单后重试。
     Antivirus likely blocked node.exe.
     Add this folder to the whitelist and retry.

  Q: 提示端口被占用？
  A: 程序会自动往后找可用端口，
     看窗口里显示的地址即可。
     The port is auto-incremented. Use the URL shown.

  Q: 想指定端口？
  A: 在 start.bat 里加一行 set PORT=8080
     Add "set PORT=8080" to start.bat

【文件说明 / Files】

  node.exe      Node.js 运行时 / runtime (~82 MB)
  server.js     静态服务器 / static server (no dependencies)
  dist/         网页文件 / web app files
  start.bat     双击启动 / launcher

========================================