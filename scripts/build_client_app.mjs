import path from "path"
import fs from "fs"
import glob from "glob"
import chokidar from "chokidar"
import { fileURLToPath } from "url"
import { splitVendorChunkPlugin, build } from 'vite'

import react from "@vitejs/plugin-react"
import sass from "sass"
import minimist from "minimist"
import { argv } from "process"

const __projdir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");
const __clientroot = path.join(__projdir, "/src/pages");
const __pubdir = path.join(__projdir, "/src/public");
const __wwwroot = path.join(__projdir, "/wwwroot");

let command_args = minimist(argv.slice(2), {
    default: {
        build: false
    }
})

process.env["NODE_ENV"] = command_args["build"] ? "production" : "development"

// files ending in *.client.ts
/** @type { (options?: {onlyBuild?: boolean, entrySuffix?: string, minify?: boolean, externals?: import("rollup").ExternalOption, format?: import("rollup").ModuleFormat, globals?: import("rollup").GlobalsOption} = {}) => void } */
function compile_ts_client_entries(options = {}) {
    let entries_globs = path.join(__clientroot, `**/*${options.entrySuffix ?? ".client"}.ts`)
    // let entries_globs = path.join(__clientroot, `**/*${options.entrySuffix ?? ".client"}.tsx`)
    let watcher = chokidar.watch(entries_globs, { cwd: __clientroot, ignoreInitial: false })

    /** @type { {[uniquePath: string]: import("rollup").RollupWatcher} } */
    let entries_list = {}

    if (options.onlyBuild) {
        watcher.on("ready", () => {
            watcher.close();
            return;
        });
    }

    let iife_globals = {
        "react": "React",
        "react-dom": "ReactDOM"
    }



    watcher.on("add", async (fPath, fStats) => {

        console.log(["TS found entry", fPath]);

        let frompath = path.join(__clientroot, fPath);
        // let topath = path.join(__wwwroot, fPath) // @NOTE has .ts extension
        let topath = path.join(__wwwroot, path.dirname(fPath), path.basename(fPath, path.extname(fPath))) + ".js";

        entries_list[fPath] = await build({
            configFile: false,
            plugins: [
                react({
                    jsxRuntime: "classic"
                }),
                // splitVendorChunkPlugin()
            ],
            css: {
                modules: {
                    scopeBehaviour: "local"
                }
            },
            publicDir: false,
            build: {
                watch: options.onlyBuild === false ? true : false,
                emptyOutDir: false,
                minify: options.minify ?? false,
                write: true,
                rollupOptions: {
                    input: frompath,
                    external: options.externals ?? Object.keys(iife_globals),
                    output: {
                        dir: path.dirname(topath),
                        format: options.format ?? "iife",
                        entryFileNames: path.basename(topath),
                        globals: options.globals ?? iife_globals

                    }
                }
            }
        });

    })

    watcher.on("unlink", async (fPath) => {
        await entries_list[fPath]?.close().then(() => {
            delete entries_list[fPath];
        });

        let topath = path.join(__wwwroot, path.dirname(fPath), path.basename(fPath, path.extname(fPath))) + ".js";

        if (fs.existsSync(topath)) {
            fs.unlink(topath, (err) => {
                console.error(err);
            })
        }
    })
}

// files ending in *.bundle.sass
// in development html entry should put javascript file that includes sass (conditionally if process.env["NODE_ENV"] is production)
// ex: if there is src/pages/css/main.bundle.sass
// should have:    src/pages/css/main.bundle.js
/** @type { (options?: {shouldWatch?: boolean} = {}) => void } */
function compile_sass_bundles(options = {}) {
    if (options.shouldWatch) {
        let js_bundles_globs = path.join(__clientroot, "**/*.bundle.js").split("\\").join("/")
        let watcher = chokidar.watch(js_bundles_globs, { cwd: __clientroot, ignoreInitial: false });

        watcher.on("change", (fPath, fstats) => {
            let frompath = path.join(__clientroot, fPath)
            let topath = path.join(__wwwroot, fPath)
            fs.mkdir(path.dirname(topath), { recursive: true }, (err, pth) => {
                fs.copyFile(frompath, topath, (err) => {
                    if (err) {
                        console.error(err)
                    }
                })
            })
        })

        watcher.on("add", (fPath, fStats) => {
            let frompath = path.join(__clientroot, fPath)
            let topath = path.join(__wwwroot, fPath)
            fs.mkdir(path.dirname(topath), { recursive: true }, (err, pth) => {
                fs.copyFile(frompath, topath, (err) => {
                    if (err) {
                        console.error(err)
                    }
                })
            })
        })

        watcher.on("unlink", (fPath) => {
            let topath = path.join(__wwwroot, fPath)
            fs.unlink(topath, (err) => {
                if (err) {
                    if (err.code === "ENOENT") {
                        console.error("[Error: ", err.code, "] file: ", err.path, "was probably forcefully deleted already by watcher");
                    } else {
                        console.error(err)
                    }
                }
            })
        })

        return;
    }

    let sass_globs = path.join(__clientroot, "**/*.bundle.sass").split("\\").join("/")
    let sass_bundles = glob.sync(sass_globs)
    console.log(["SASS BUNDLES FOUND", sass_bundles]);

    for (let fPath of sass_bundles) {
        let relPath = path.relative(__clientroot, fPath)
        let topath = ((tp) => path.join(path.dirname(tp), path.basename(tp, path.extname(tp)) + ".css"))(path.join(__wwwroot, relPath))
        fs.mkdir(path.dirname(topath), { recursive: true }, (err, pth) => {
            let compiled = sass.compile(fPath)
            fs.writeFileSync(topath, compiled.css, { flag: "w+" })
        })
    }
}

// files ending in *.module.sass
function pack_sass_modules() {

}

// copy /src/public contents into /wwwroot
/** @type { (options?: {onlyBuild?: boolean} = {}) => void } */
function copy_public_folder(options = {}) {
    let watcher = chokidar.watch(__pubdir, { cwd: __pubdir, ignoreInitial: false });
    if (options.onlyBuild) {
        watcher.on("ready", () => {
            watcher.close();
            return;
        });
    }

    watcher.on("change", (fPath, fstats) => {
        let frompath = path.join(__pubdir, fPath)
        let topath = path.join(__wwwroot, fPath)
        fs.mkdir(path.dirname(topath), { recursive: true }, (err, pth) => {
            fs.copyFile(frompath, topath, (err) => {
                if (err) {
                    console.error(err)
                }
            })
        })
    })

    watcher.on("add", (fPath, fStats) => {
        let frompath = path.join(__pubdir, fPath)
        let topath = path.join(__wwwroot, fPath)
        fs.mkdir(path.dirname(topath), { recursive: true }, (err, pth) => {
            fs.copyFile(frompath, topath, (err) => {
                if (err) {
                    console.error(err)
                }
            })
        })
    })

    watcher.on("unlink", (fPath) => {
        let topath = path.join(__wwwroot, fPath)
        fs.unlink(topath, (err) => {
            if (err) {
                if (err.code === "ENOENT") {
                    console.error("[Error: ", err.code, "] file: ", err.path, "was probably forcefully deleted already by watcher");
                } else {
                    console.error(err)
                }
            }
        })
    })

}


function Run() {

    console.log([" IS BUILD ?", command_args.build]);

    copy_public_folder({ onlyBuild: command_args.build });
    // pack_sass_modules();
    compile_sass_bundles({ shouldWatch: command_args.build === false ? true : false });
    compile_ts_client_entries({ onlyBuild: command_args.build === false ? false : true });
}

Run();
