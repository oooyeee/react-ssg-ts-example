import path from "path"
import fs from "fs"
import { randomBytes } from "crypto"
import chokidar from "chokidar"
import { fileURLToPath } from "url"

import minimist from "minimist"
import { argv } from "process"

const __projdir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");
const __componentsroot = path.join(__projdir, "/src/components");

let command_args = minimist(argv.slice(2), {
    default: {
        build: false
    }
})

process.env["NODE_ENV"] = command_args["build"] ? "production" : "development"

/** @type { (options?: {onlyBuild?: boolean, sv_src_suffix?: string, sv_generated_suffix?: string }) => void } */
function WatchStylevarsJsonFiles(options = {}) {

    let sv_src_suffix = options.sv_src_suffix ?? ".sv"
    let sv_generated_suffix = options.sv_generated_suffix ?? ".sv.gen"

    let json_glob_sv = path.join(__componentsroot, `**/*${sv_src_suffix}.json`).split("\\").join("/")
    let watcher = chokidar.watch(json_glob_sv, { ignoreInitial: false })

    if(options.onlyBuild) {
        watcher.on("ready", async ()=>{
            await watcher.close();
            return;
        })
    }

    /** @type { (str: string, seekStrFromEnd: string)=> string | null } */
    const cutStrFromEnd = (str, seekStrFromEnd) => {
        if (!str.endsWith(seekStrFromEnd)) return null;

        return str.substring(0, str.length - seekStrFromEnd.length)
    }

    const styleVarsGenerator = (fPath) => {
        try {
            let basename = cutStrFromEnd(fPath, sv_src_suffix + ".json")
            let sv_generated_sass_path = basename + sv_generated_suffix + ".sass";
            let sv_generated_json_path = basename + sv_generated_suffix + ".json";

            let jsonString = Buffer.from(fs.readFileSync(fPath)).toString();

            // JSON MUST BE AN ARRAY
            let json = JSON.parse(jsonString)
            if (!Array.isArray(json)) {
                let error = new Error("JSON is not an array")
                error["jsonFilePath"] = fPath
                console.error(error);
                return;
            }


            let jsonGenerated = {}

            for (let varName of json) {
                jsonGenerated[varName] = "G" + Buffer.from(randomBytes(3)).toString("hex")
            }

            fs.writeFileSync(sv_generated_json_path, JSON.stringify(jsonGenerated), { flag: "w+" })

            let vars = []
            for (let varName of Object.keys(jsonGenerated)) {
                vars.push(`$${varName}: "${jsonGenerated[varName]}"`)
            }

            fs.writeFileSync(sv_generated_sass_path, vars.join("\n\n"), { flag: "w+" })

        } catch (err) {
            console.error(err);
        }
    }

    const styleVarsCleaner = (fPath) => {
        try {
            let basename = cutStrFromEnd(fPath, sv_src_suffix + ".json")
            let sv_generated_sass_path = basename + sv_generated_suffix + ".sass";
            let sv_generated_json_path = basename + sv_generated_suffix + ".json";

            fs.promises.unlink(sv_generated_json_path);
            fs.promises.unlink(sv_generated_sass_path);
        } catch (err) {
            console.error(err);
        }
    }

    watcher.on("add", (fPath, fStats) => {
        styleVarsGenerator(fPath)
    })

    watcher.on("change", (fPath, fStats) => {
        styleVarsGenerator(fPath)
    })

    watcher.on("unlink", (fPath) => {
        styleVarsCleaner(fPath)
    })
}


WatchStylevarsJsonFiles({ onlyBuild: command_args["build"] ? true : false });
