/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	createConnection,
	TextDocuments,
	TextDocument,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	SymbolInformation,
	Range
} from 'vscode-languageserver';

import Uri from 'vscode-uri';
import * as fs from 'fs';
const documentSymbol = require('./iced_walk').documentSymbol;
import * as IcedCoffeeScript from 'iced-coffee-script-3';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability =
		capabilities.workspace && !!capabilities.workspace.configuration;
	hasWorkspaceFolderCapability =
		capabilities.workspace && !!capabilities.workspace.workspaceFolders;
	hasDiagnosticRelatedInformationCapability =
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation;

	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			documentSymbolProvider: true
		}
	};
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(
			DidChangeConfigurationNotification.type,
			undefined
		);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

connection.onDocumentSymbol(params => {
	if (/file:\/\//.test(params.textDocument.uri)) {
		const filepath = Uri.parse(params.textDocument.uri).fsPath;
		if (!fs.existsSync(filepath)) {
			// File is gone.
			return [];
		}
		const src = fs.readFileSync(filepath, 'utf-8');
		try {
			return documentSymbol(src, connection) as SymbolInformation[];
		} catch(e) {
			connection.console.log(e.stack);
			throw e;
		}
	} else {
		// TODO: find a way to get content of Untitled tab
		return []
	}
})

/*
connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});
*/

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	let diagnostics: Diagnostic[] = [];

	let text = textDocument.getText();
	try {
		IcedCoffeeScript.nodes(text);
	} catch (e) {
		if (e.location && e.message) {
			let l = e.location;
			diagnostics.push({
				severity: DiagnosticSeverity.Error,
				range: Range.create(l.first_line, l.first_column, l.last_line || l.first_line, l.last_column || l.first_column),
				message: e.message,
				source: 'ex'
			});
		} else {
			diagnostics.push({
				range : Range.create(0,0,0,0),
				message: "Unhandled compile error: " + e.message,
			});
		}
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	// connection.console.log('We received an file change event');
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
