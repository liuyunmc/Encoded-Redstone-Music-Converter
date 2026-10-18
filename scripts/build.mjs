import { mkdir, cp } from 'node:fs/promises';
const dest = new URL('../dist/', import.meta.url);
await mkdir(dest, { recursive: true });
for (const path of ['index.html', 'styles.css', 'src', 'assets', 'README.md', 'README.en.md', 'examples']) await cp(new URL('../' + path, import.meta.url), new URL(path, dest), { recursive: true });
console.log('静态页面已生成到 dist/，可部署到 GitHub Pages 或任意静态服务。');
