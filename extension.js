// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

function info() { vscode.window.showInformationMessage(arguments); }
function warning() { vscode.window.showWarningMessage(arguments); }
function error() { vscode.window.showErrorMessage(arguments); }

function objectFromSelection(editor) {
	let selection = editor.selection;
	let json = editor.document.getText(selection);
	let obj;

	try {
		obj = JSON.parse(json);
	}
	catch(err) {
		obj = undefined;
		warning('JSON Flattener: Selection is not valid JSON: ', err.message);
	}
	return obj;
}

function replaceSelection(editor, text) {
	let selection = editor.selection;
	editor.edit(builder => {
		builder.replace(selection, text);
	})
	.then(success => {
		if (success) {
			// Change the selection: start and end position of the new
			// selection is same, so it is not to select replaced text;
			var position = editor.selection.end; 
			// editor.selection = new vscode.Selection(position, position);	// deselect
			editor.revealRange(new vscode.Range(position, position));	// show cursor at end of old selection
			info('JSON Flattener: selection contents flattened: '+success);
		}
	});
}
////////////////////////////////////////////////////

// Command 1: appurist.json-flattener.selection
function selectionFlatten () {
	let editor = vscode.window.activeTextEditor;
	if (!editor) return; // No text editor open

	let obj = objectFromSelection(editor);
	if (!obj) return;	// already reported

	let json2 = JSON.stringify(obj);
	return replaceSelection(editor, json2);
}

	// Command 2: appurist.json-flattener.pretty
	// Command 3: appurist.json-flattener.unpretty
	function selectionPretty(makePretty) {
	let editor = vscode.window.activeTextEditor;
	if (!editor) return; // No open text editor

	let obj = objectFromSelection(editor);
	if (!obj) return;	// already reported

	let json2 = JSON.stringify(obj, undefined, makePretty ? 2 : undefined);
	replaceSelection(json2);
}

/**************************************************
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension json-flattener: active.');

	// These commands have been defined in the package.json file.
	// Now we provide the implementation of the command with registerCommand().
	// The commandId parameter must match the command field in package.json.

	// Command 1: appurist.json-flattener.selection
	disposable = vscode.commands.registerCommand('appurist.json-flattener.selection', () => {
		selectionFlatten();
	});

	// Command 2: appurist.json-flattener.pretty
	disposable = vscode.commands.registerCommand('appurist.json-flattener.pretty', () => {
		selectionPretty(true);
	});

	// Command 3: appurist.json-flattener.unpretty
	disposable = vscode.commands.registerCommand('appurist.json-flattener.pretty', () => {
		selectionPretty(false);
	});

	// Command 4: appurist.json-flattener.clipboard
	disposable = vscode.commands.registerCommand('appurist.json-flattener.clipboard', async function () {
		let json;
		let lines = await vscode.env.clipboard.readText();
		if (lines) {
			if (Array.isArray(json)) {
				json = lines.join(' ');
			} else
			if (typeof lines == 'string')
			{
				json = lines.trim();
			} else {
				error('JSON Flattener: Unrecognized clipboard type: '+typeof lines)
				return;
			}
		}

		let obj;
		try {
			obj = JSON.parse(json);
		}
		catch(err) {
			warning('JSON Flattener: Clipboard is not valid JSON: ', err.message);
			return;
		}

		let json2 = JSON.stringify(obj);
		let editor = vscode.window.activeTextEditor;
		return replaceSelection(editor, json2);
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	console.log('Extension json-flattener: deactivated.');
}

module.exports = {
	activate,
	deactivate
}