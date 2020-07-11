import React from "react";

function FacesJson({ data }) {
    let defaultData = {"message": ["Loading..."]}
    if (!data) {
        data = defaultData
    }

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