import React from "react"
import { hydrateRoot } from "react-dom/client"

import Header from "../../components/header"

let ssjson: any = JSON.parse(document.querySelector(`head > script[type="application/json"]`)!.innerHTML)

console.log("ssjson", ssjson)

let isles = {
    header: document.querySelector("#header-isle"),
    footer: document.querySelector("#footer-isle")
}

hydrateRoot(isles.header!, Header({json: ssjson!.header}))
