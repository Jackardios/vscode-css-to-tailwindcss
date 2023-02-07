import * as vscode from "vscode";
import { TailwindConverter } from "css-to-tailwindcss";

import {
  DEFAULT_CONVERTER_CONFIG,
  WorkspaceFolderClient,
} from "./lib/WorkspaceFolderClient";
import { replaceCurrentSelection } from "./utils/selections";
import { convertToTailwindCSS } from "./utils/converter";

let clients: Map<string, WorkspaceFolderClient> = new Map();

function makeKeyByFolder(folder: vscode.WorkspaceFolder) {
  return folder.uri.toString();
}

function getClientByFolder(folder: vscode.WorkspaceFolder) {
  return clients.get(makeKeyByFolder(folder)) || null;
}

function createClientByFolder(
  folder: vscode.WorkspaceFolder,
  context: vscode.ExtensionContext
) {
  const key = makeKeyByFolder(folder);
  const foundClient = clients.get(key);
  if (foundClient) {
    return foundClient;
  }

  const client = new WorkspaceFolderClient(folder, context);
  clients.set(key, client);
  client.init();

  return client;
}

function deleteClientByFolder(folder: vscode.WorkspaceFolder) {
  const key = makeKeyByFolder(folder);
  clients.get(key)?.destroy();
  clients.delete(key);
}

function getClientByActiveTextEditor(editor: vscode.TextEditor | undefined) {
  if (!editor) {
    return null;
  }

  const folder = vscode.workspace.getWorkspaceFolder(editor?.document.uri);

  if (!folder) {
    return null;
  }

  return getClientByFolder(folder);
}

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.workspaceFolders?.forEach((folder) => {
    createClientByFolder(folder, context);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cssToTailwindCss.convertCssToTailwindCss",
      () =>
        replaceCurrentSelection(async (selectionText) => {
          const converter =
            getClientByActiveTextEditor(
              vscode.window.activeTextEditor
            )?.getCurrentTailwindConverter() ||
            new TailwindConverter(DEFAULT_CONVERTER_CONFIG);

          return await convertToTailwindCSS(selectionText, converter);
        })
    ),

    vscode.workspace.onDidChangeConfiguration((event) => {
      clients.forEach((client, key) => {
        const folder = vscode.workspace.getWorkspaceFolder(
          vscode.Uri.parse(key)
        );

        if (
          event.affectsConfiguration("cssToTailwindCss", folder) ||
          event.affectsConfiguration(
            "tailwindCSS.experimental.configFile",
            folder
          ) ||
          event.affectsConfiguration("tailwindCSS.rootFontSize", folder)
        ) {
          client.refresh();
        }
      });
    }),

    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
      for (let folder of event.added) {
        createClientByFolder(folder, context);
      }
      for (let folder of event.removed) {
        deleteClientByFolder(folder);
      }
    })
  );
}

export function deactivate() {
  clients.forEach((client) => client.destroy());
  clients = new Map();
}
