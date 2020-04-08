// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let logger: vscode.OutputChannel | undefined = undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Initialise the logger
	logger = vscode.window.createOutputChannel("Valgrind Reports");

	// Register the document provider
	let provider = new ValgrindReportsProvider();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('valgrind', provider));

	// The command to open the report windows
	context.subscriptions.push(vscode.commands.registerCommand('valgrindReports.openReports', command_openReports));

	// The command to add a file to the report list
	context.subscriptions.push(vscode.commands.registerCommand('valgrindReports.addFile', command_addFile));
}

// this method is called when your extension is deactivated
export function deactivate() {
	logger = undefined;
}

class ValgrindReportsProvider implements vscode.TextDocumentContentProvider {
	private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
	public onDidChange = this.onDidChangeEmitter.event;

	provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
		// Get list from configuration
		let valgrindReportsCfg = vscode.workspace.getConfiguration('valgrindReports', null);
		let filesToOpen = valgrindReportsCfg.get<Array<string>>('filesToOpen');

		let result: Array<string> = [];
		filesToOpen?.forEach(file => {
			result.push(file);
		});

		return result.join('\n');
	}
}

async function command_addFile() {
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

		logger?.appendLine(`Added file ${input} to scanned reports`);
	}
}

async function command_openReports() {
	// We only use one URI
	let uri = vscode.Uri.parse('valgrind:reports');
	// Open the document
	let doc = await vscode.workspace.openTextDocument(uri);
	// Show the document
	await vscode.window.showTextDocument(doc, { preview: false });
};