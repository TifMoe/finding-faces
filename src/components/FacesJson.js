import React from "react";

function FacesJson({ data }) {
    console.log(data)
    let defaultData = {"message": ["Loading..."]}
    if (!data) {
        data = defaultData
    }
    console.log(data)
    return (
        <div className="code-block">
            <pre>
                <code>
                    {JSON.stringify(data, null, 4)}
                </code>
            </pre>
        </div>
    )
}

export default FacesJson