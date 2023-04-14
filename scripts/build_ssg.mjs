import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { renderToString } from "react-dom/server"
import minimist from "minimist"
import { argv } from "process"

//==============================================================================================
const __defaultImportFix = (mdl) => {
    // return mdl.default ? mdl.default : mdl
    const defCheck = (m) => m.default ? m.default : m
    // checking twice, because pages are imported as module.default.default ?
    return defCheck(defCheck(mdl))
}

let command_args = minimist(argv.slice(2), {
    default: {
        build: false
    }
})

// Must use dynamic import later in this script or process.env["NODE_ENV"] will be undefined in imported modules
process.env["NODE_ENV"] = command_args["build"] ? "production" : "development"

const __projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../")

class Pages {
    /** @type { {rootPath: string, page: () => JSX.Element}[] } */
    #pages = [];

    add(rootPath, page) {
        this.#pages.push({ rootPath: rootPath, page: page });
    }

    build(outRootDir) {
        if (this.#pages.length <= 0) {
            return;
        }

        for (let { rootPath, page } of this.#pages) {
            let outPath = path.join(outRootDir, rootPath)
            fs.mkdirSync(path.dirname(outPath), { recursive: true })
            fs.writeFileSync(outPath, "<!DOCTYPE html>" + ssr(page()), { flag: "w+" })
        }
    }
}

const ssr = renderToString
let __viteRootPath = path.join(__projectDir, "wwwroot/")
let pages = new Pages();

// simple import hoists first, before process.env["NODE_ENV"] = ... so i'm using dynamic import
// ==============================================================================================
// =======================================================================IMPORT STATIC PAGES====
// ==============================================================================================
const home_page = __defaultImportFix(await import("../dist/pages/index.js"))

// ==============================================================================================
// =============================================================ADD STATIC PAGES TO SSG BUILD====
// ==============================================================================================
pages.add("index.html", home_page)



// ==============================================================================================
// ==============================================================================================
// ==============================================================================================
pages.build(__viteRootPath)
console.log([":: SSG build DONE ::"])
