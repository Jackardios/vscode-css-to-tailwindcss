import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "css-to-tailwindcss.convertCSSToTailwindCSS",
    () => {
      vscode.window.showInformationMessage(
        "Hello World from CSS to TailwindCSS!"
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
