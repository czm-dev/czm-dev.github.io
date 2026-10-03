# Personal website · 本地预览

英文个人主页，当前只有个人简介、论文集、文章集、联系链接四个内容块。采用石墨黑、银灰与少量冰蓝，银色卡片装在半透明卡套中，整体略微倾斜。卡套顶部有腰型孔，织物长挂带通过金属连接件挂住卡套，并延伸至页面顶端。鼠标悬停时整个卡套放大并轻微三维偏转，移出后复位。

挂带末端采用宽扁拉丝金属夹扣，下方搭片加宽并略微伸入腰型孔上沿，露出折边厚度。连接件为本地 SVG，在不同屏幕尺寸下保持清晰。

卡片右下角使用提供的宇宙之眼图案作为低对比度底纹。图案固定为 440px × 440px，各屏幕保持相同尺寸，超出卡片的部分自然裁切，文字位于图案上方。原图保存在 assets/eye-of-universe.png，黑色背景通过 CSS 遮罩变为透明。

银灰卡片叠加淡虹彩镭射材质，鼠标位置控制色带与局部高光，与现有三维偏转联动。移出后复位；手机与减少动效模式显示静态材质。

主题默认跟随设备明暗设置，设备设置改变时自动更新。顶部可选择 System、Light 或 Dark；手动选择会在本机保存，切回 System 后恢复跟随设备。浅色采用冷灰背景与深墨色文字。

此前三个方案的效果图保存在 output/playwright，主页面已采用组合方案。预览文件位于 output，均不进入网站构建。

## 本地预览

需要 Node.js 20 或更高版本，无需安装依赖。

```powershell
npm run dev
```

打开 [本地预览](http://127.0.0.1:4173/)。修改源文件后刷新浏览器；Ctrl+C 停止服务。

## 构建与检查

```powershell
npm test
npm run build
```

构建重新生成项目内的 dist 文件夹，只包含公开页面和 assets。请修改源文件，随后重新构建。

如需预览构建结果，先停止开发服务器，再运行：

```powershell
npm run preview
```

模拟 GitHub Pages 仓库子路径：

```powershell
npm run preview -- --prefix=/mypage/
```

对应地址为 [子路径预览](http://127.0.0.1:4173/mypage/)。如需两种服务同时运行，在另一个 PowerShell 终端设置端口：

```powershell
$env:PORT = '4174'
npm run preview -- --prefix=/mypage/
```

此时地址为 http://127.0.0.1:4174/mypage/。

## 需要补充的资料

在 index.html 中搜索 PERSONALIZE 注释或方括号内容。

- 姓名、照片、职称、单位、研究方向与简短个人简介。
- 论文标题、作者、年份、期刊或会议、简介，以及真实 PDF、DOI 和代码链接。
- 文章标题、日期、主题、摘要，以及正文或真实文章链接。
- 联系邮箱、GitHub、Google Scholar、ORCID；无需展示的条目可删除。
- 网页标题、描述和图标。

目前资源和联系方式均为明确占位。真实地址补充后，再将对应文本改为链接；不要填入虚构的地址。

## 文件位置

| 文件 | 用途 |
| --- | --- |
| index.html | 四个内容块、资料占位与元信息 |
| styles.css | 配色、证件卡片、列表、响应式布局与减少动效规则 |
| app.js | 明暗主题、鼠标放大与三维偏转、离开复位、导航状态 |
| assets/favicon.svg | 证件卡片图标 |
| assets/lanyard-clasp.svg | 宽扁金属夹扣与短搭片 |
| assets/eye-of-universe.png | 宇宙之眼底纹原图 |
| scripts/ | 本地服务器、构建脚本与工具测试 |
| docs/design.md | 当前设计说明 |
| docs/verification.md | 本次检查记录 |

之前的插画保存在 assets 中，但当前页面不引用它们。新增公开图片请放在 assets，使用 ./assets/文件名 等相对路径。

## GitHub Pages

准备上线时运行 npm run build，再将 dist 内部的内容（包含 .nojekyll）作为静态发布文件。当前仅提供本地预览，没有执行发布。

