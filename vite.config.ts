import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Helper plugin to copy manifest.json and icons to dist directory
function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const publicDir = resolve(__dirname, 'public');

      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Base64 icon buffers
      const icon16Base64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA+SURBVDhPY3wpo/yfgSjAhEbDYwYGAUZGBgYGBkIm4DKACcaGqf8ZGBgY/zMwpRoxGg0DQAYmKRiVgUEAo2EAAAcOCxH+y3FMAAAAAElFTkSuQmCC";
      const icon48Base64 = "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABCSURBVHgB7cEBDEAAAMCQ969tDQ5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4MogAAASx8tE0AAAAASUVORK5CYII=";
      const icon128Base64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAAACch0nAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABMSURBVHgB7cEBDEAAAMCQ969tDHEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECbAQEAAAGU+wYyAAAAAElFTkSuQmCC";

      const icons = [
        { name: 'icon-16.png', b64: icon16Base64 },
        { name: 'icon-48.png', b64: icon48Base64 },
        { name: 'icon-128.png', b64: icon128Base64 },
      ];

      icons.forEach(({ name, b64 }) => {
        const pubPath = resolve(publicDir, name);
        const distPath = resolve(distDir, name);
        const buf = Buffer.from(b64, 'base64');
        if (!fs.existsSync(pubPath)) {
          fs.writeFileSync(pubPath, buf);
        }
        fs.writeFileSync(distPath, buf);
      });

      // Copy manifest.json
      if (fs.existsSync(resolve(__dirname, 'manifest.json'))) {
        fs.copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        );
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionAssets()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background/index.js';
          }
          if (chunkInfo.name === 'content') {
            return 'content/index.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
