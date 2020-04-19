// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "valgrind-reports" is now active!');

	// The command to open the report windows
	context.subscriptions.push(vscode.commands.registerCommand('valgrindReports.openReports', () => {
		// Create or show panel
		ValgrindReportsPanel.createOrShow(context);
	}));

	// The command to add a file to the report list
	context.subscriptions.push(vscode.commands.registerCommand('valgrindReports.addFile', () => {
		addFileToConfig();
	}));
}

// this method is called when your extension is deactivated
export function deactivate() { }

class ValgrindReportsPanel {
	public static readonly viewType = 'valgrindReports';
	public static readonly log = vscode.window.createOutputChannel("Valgrind Reports");

	private static self: ValgrindReportsPanel;

	private readonly _panel: vscode.WebviewPanel;
	private readonly _disposables: vscode.Disposable[] = [];
	private readonly _context: vscode.ExtensionContext;

	public static createOrShow(context: vscode.ExtensionContext) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (ValgrindReportsPanel.self) {
			ValgrindReportsPanel.self._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			ValgrindReportsPanel.viewType,
			'Valgrind Reports',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath))]
			}
		);

		ValgrindReportsPanel.self = new ValgrindReportsPanel(panel, context);
	}

	private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
		this._panel = panel;
		this._context = context;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
					case 'open':
						try {
							let doc = await vscode.workspace.openTextDocument(message.text);
							vscode.window.showTextDocument(doc);
						} catch {
							vscode.window.showErrorMessage(`Failed to open ${message.text}`);
						}
						return;
				}
			},
			null,
			this._disposables
		);
	}

	private _onDiskPath(file: string): vscode.Uri {
		let nonResource = path.join(this._context.extensionPath, file);
		let resource = this._panel.webview.asWebviewUri(vscode.Uri.file(nonResource));
		return resource;
	}

	private _update() {
		const webview = this._panel.webview;
		const nonce = getNonce();
		const valgrindDataJson = this.createValgrindData();
		webview.html = `
			<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Valgrind Reports</title>
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src vscode-resource: 'nonce-${nonce}'; style-src vscode-resource:"></meta>
				<link rel="stylesheet" href="${this._onDiskPath('src/web/page.css')}">
				<script src="${this._onDiskPath('out/web/page.js')}"></script>
				<script nonce="${nonce}">var valgrindData = ${valgrindDataJson};</script>
            </head>
            <body id="body">
            </body>
            </html>`;
	}

	private createValgrindData(): string {
		// Get configured files
		let valgrindReportsCfg = vscode.workspace.getConfiguration('valgrindReports', null);
		let filesToOpen = valgrindReportsCfg.get<Array<string>>('filesToOpen');

		// Save files in Object
		const valgrindData: any = new Object();
		filesToOpen?.forEach(file => {
			valgrindData[file] = file;
		});

		// Stringify object
		const valgrindDataJson = JSON.stringify(valgrindData);
		return valgrindDataJson;
	}

	public dispose() { }
}

async function addFileToConfig() {
	const input = await vscode.window.showInputBox({ prompt: 'Add Valgrind Report to parse.' });
	if (input !== undefined) {

		// Get list from configuration
		let valgrindReportsCfg = vscode.workspace.getConfiguration('valgrindReports', null);
		let currentStatus = valgrindReportsCfg.get<Array<string>>('filesToOpen');
		if (currentStatus === undefined) {
			currentStatus = new Array<string>();
		}
		// Update configuration
		let size = currentStatus.length;
		currentStatus.push(input);
		valgrindReportsCfg.update('filesToOpen', currentStatus, false, false);


		ValgrindReportsPanel.log.appendLine(`Added file ${input} to scanned reports`);
	}
}

/**
 * Randomly generate a nonce.
 * This code was inspired from the great https://github.com/mhutchie/vscode-git-graph.
 * @returns The nonce.
 */
function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}