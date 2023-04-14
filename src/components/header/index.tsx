import styles from "./index.sv.gen.json"

type _HeaderJson = {
    json: HeaderJson
}

function Header({ json }: _HeaderJson) {
    const { message } = json
    return (
        <>
            <div className={styles.header}>
                <p>Hydrated Message: {message ?? "could not hydrate message"}</p>
            </div>
        </>
    )
}

export default Header

type HeaderJson = {
    message: string
}

export type {
    HeaderJson
}