// يتأكد إن الشاشات والمكونات تلتزم بقواعد CLAUDE.md:
// لا ألوان مكتوبة يدويًا، لا fontWeight، ولا left/right (استخدم start/end).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src/app', 'src/components'];
const rules = [
  { re: /#[0-9a-fA-F]{3,8}\b(?![^'"]*url)/, msg: 'لون مكتوب يدويًا، استخدم useColors()' },
  { re: /rgba?\(/, msg: 'لون مكتوب يدويًا، استخدم useColors()' },
  { re: /fontWeight/, msg: 'لا تستخدم fontWeight، الوزن من ملف الخط' },
  { re: /\b(marginLeft|marginRight|paddingLeft|paddingRight|left|right|borderLeft\w*|borderRight\w*)\s*:/, msg: 'استخدم start/end بدل left/right' },
];
// ملفات الشعار: ألوان قناع SVG (أبيض/أسود) جزء من الرسم نفسه
const allow = new Set(['src/components/brand/logo.tsx', 'src/components/brand/wordmark-path.ts']);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
}

let bad = 0;
for (const file of roots.flatMap(walk)) {
  if (allow.has(file)) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      for (const r of rules) {
        if (r.re.test(line)) {
          bad++;
          console.log(`${file}:${i + 1}  ${r.msg}\n    ${line.trim()}`);
        }
      }
    });
}
if (bad) {
  console.log(`\n${bad} مخالفة`);
  process.exit(1);
}
console.log('قواعد التصميم: تمام');
