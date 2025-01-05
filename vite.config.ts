import { defineConfig, normalizePath, loadEnv } from "vite";
import path from "path";
import { resolve } from "path";
import postcssPresetEnv from "postcss-preset-env";
import { createVitePlugins } from "./build/vite-plugin";
const themePath = normalizePath(path.normalize("./src/style/global-theme.scss"));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 根路径
  const root = process.cwd();
  // 获取跟路径对应的文件
  const env: any = loadEnv(mode, root);
  return {
    // 生产环境服务的公共基础路径-用于生出环境的代理的路径
    base: env.VITE_PUBLIC_PATH,
    server: {
      host: "0.0.0.0",
      open: true,
      // 为开发服务器配置自定义代理规则-用于开发时的代理
      proxy: {
        "/api": {
          target: env.VITE_APP_BASE_URL,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, "")
        }
      }
    },
    // 插件：路径build/vite-plugin
    plugins: createVitePlugins(env),
    resolve: {
      // 配置别名-绝对路径
      alias: {
        "@assets": path.join(__dirname, "src/assets"),
        "@": resolve(__dirname, "./src")
      }
    },
    css: {
      postcss: {
        plugins: [postcssPresetEnv()]
      },
      preprocessorOptions: {
        scss: {
          // additionalData的内容会在每个scss文件的开头自动注入
          additionalData: `@import "${themePath}";
          `
        }
      }
    },
    build: {
      outDir: "dist", // 指定打包路径，默认为项目根目录下的dist目录
      // minify: "esbuild", // esbuild打包更快但是不能去除console.log，terser打包慢但能去除console.log
      minify: "terser", // Vite 2.6.x 以上需要配置 minify："terser"，terserOptions才能生效，terser可以去除 console.log
      terserOptions: {
        compress: {
          keep_infinity: true, // 防止 Infinity 被压缩成 1/0，这可能会导致 Chrome 上的性能问题
          drop_console: true, // 生产环境去除 console
          drop_debugger: true // 生产环境去除 debugger
        },
        format: {
          comments: false // 删除注释
        }
      },
      assetsInlineLimit: 50 * 1024, // 打包内联阈值100kb
      chunkSizeWarningLimit: 50000, // 规定触发警告的 chunk 大小, 这里设置阈值为50kb, 消除打包大小超过500kb警告
      // 静态资源打包到dist下的不同目录,将文件类型css、js、jpg等文件分开存储
      rollupOptions: {
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]"
        }
      }
    }
  };
});
