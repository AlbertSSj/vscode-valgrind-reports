// Tells the script that the page defines the data set
declare var valgrindData: any;

function createPage() {
    let body = document.getElementById('body');
    if (body === null) {
        throw new Error('No body no game');
    }
    let keys = Object.keys(valgrindData);
    for (const key of keys) {
        const element = valgrindData[key];
        console.log(key);
        let header = document.createElement("h1");
        header.textContent = key + " " + element;
        body.appendChild(header);
    }
};

window.onload = createPage;
