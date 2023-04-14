// hydration JSON could be fetched from database, but for simplicity json file is used
// in the browser, react main entry script should search for application/json script in DOM with JSON content in order to hydrate
import hydration from "./index.hydration.json"
import Header from "../components/header"
import Footer from "../components/footer"

import type { HeaderJson } from "../components/header"

const isProduction = process.env["NODE_ENV"] == "production"

const Head_CSS = () => {
    return (<>
        {isProduction ?
            <link rel="stylesheet" href="/css/main.bundle.css"></link>
            :
            <script type="module" defer src="/css/main.bundle.js"></script>
        }
    </>)
}
const Head_script_cdn_React = () => {
    return (<>
        {isProduction ?
            <script crossOrigin="anonymous" defer src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
            :
            <script crossOrigin="anonymous" defer src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.min.js"></script>
        }
    </>)
}
const Head_script_cdn_ReactDOM = () => {
    return (<>
        {isProduction ?
            <script crossOrigin="anonymous" defer src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
            :
            <script crossOrigin="anonymous" defer src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.min.js"></script>
        }
    </>)
}
const Head_script_js_entry = () => {
    return (<>
        {isProduction ?
            <script defer src="/js/main.client.js"></script>
            :
            <script type="module" defer src="/js/main.client.js"></script>
        }
    </>)
}

function Page() {
    return (
        <html>
            <head>
                <Head_CSS />
                <title>Home Page</title>
                <script type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hydration) }}></script>
                <Head_script_cdn_React />
                <Head_script_cdn_ReactDOM />
                {/* entry */}
                <Head_script_js_entry />
            </head>
            <body id="body">
                <header id="header-isle">
                    <Header json={hydration.header as HeaderJson} />
                </header>
                <main>
                    <p>Main content</p>
                </main>
                <footer id="footer-isle">
                    <Footer />
                </footer>
            </body>
        </html>
    )
}



export default Page