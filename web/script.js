function createPage() {
    let body = document.getElementById("body");
    const keys = Object.keys(valgrindData);
    for (const key of keys) {
        const element = valgrindData[key];
        console.log(key);
        let header = document.createElement("h1");
        header.textContent = key + " " + element;
        body.appendChild(header);
    }
};

window.onload = createPage;
