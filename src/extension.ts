// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "valgrind-reports" is now active!');

	// The command to open the report windows
	context.subscriptions.push(vscode.commands.registerCommand('valgrindReports.openReports', () => {
		// Create or show panel
		ValgrindReportsPanel.createOrShow();
	}));
}

// this method is called when your extension is deactivated
export function deactivate() { }

class ValgrindReportsPanel {
	public static readonly viewType = 'valgrindReports';

	private static self: ValgrindReportsPanel;

	private readonly _panel: vscode.WebviewPanel;
	private readonly _disposables: vscode.Disposable[] = [];

	public static createOrShow() {
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
			}
		);

		ValgrindReportsPanel.self = new ValgrindReportsPanel(panel);
	}

	private constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;

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
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	private _update() { }

	public dispose() { }

}