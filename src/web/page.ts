// Tells the script that the page defines the data set
declare var valgrindData: any;
declare var acquireVsCodeApi: any;

const vscode = acquireVsCodeApi();

function openFile(this: any, ev: MouseEvent) {
    vscode.postMessage({
        command: 'open',
        text: this.textContent
    });
}

function createPage() {
    let body = document.getElementById('body');
    if (body === null) {
        throw new Error('No body no game');
    }
    let keys = Object.keys(valgrindData);
    for (const key of keys) {
        const element = valgrindData[key];

        let div = document.createElement("div");
        body.appendChild(div);

        let file = document.createElement("code");
        file.textContent = element;
        file.onclick = openFile;
        div.appendChild(file);
    }
};

window.onload = createPage;
