const express = require("express")
const dotenv = require("dotenv")

dotenv.config()

const vars = {
    wwwroot: "./wwwroot",
    port: process.env.PORT ?? 8080,
    hostname: process.env.HOSTNAME ?? "localhost"
}

let app = express()

app.use(express.static(vars.wwwroot))

app.listen(vars.port, vars.hostname, () => {
    console.log("-== Express Server is listening on address: %s:%d =-", vars.hostname, vars.port)
})
