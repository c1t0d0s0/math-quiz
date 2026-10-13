// public/favicon.svg を、ホーム画面と同じリスザルの絵 (src/monkey.js) から作る。
//   node scripts/build-favicon.mjs
// favicon.ico と apple-touch-icon.png は、この SVG を画像にしたもの (絵を変えたら作り直す)
import { writeFileSync } from 'node:fs';
import { monkeyFace } from '../src/monkey.js';

// 顔 (たて 26〜106) が正方形のまん中に来るように切り取る
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 6 120 120">${monkeyFace()}</svg>\n`;
writeFileSync(new URL('../public/favicon.svg', import.meta.url), svg);
console.log(`public/favicon.svg (${svg.length} bytes)`);
