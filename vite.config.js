import path from "path"
import { fileURLToPath } from "url"
import { defineConfig, splitVendorChunkPlugin } from 'vite'


const __projdir = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const __publicdir = path.join(__projdir, "/src/public")
const __wwwroot = path.join(__projdir, process.env.WWWROOT ?? "/wwwroot");

/** @type {import('vite').UserConfig} */
export default defineConfig({
    root: __wwwroot,
    publicDir: __publicdir,

    clearScreen: false,
    server: {
        host: process.env.HOSTNAME ?? "127.0.0.1",
        port: process.env.PORT ?? "9999",
        strictPort: "true",
        open: false
    }
})