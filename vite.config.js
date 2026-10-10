import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    // サブパス配信（GitHub Pages など）でも動くように相対パスで出力する
    base: './',
    plugins: [vue()],
});
