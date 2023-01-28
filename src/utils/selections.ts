import * as vscode from "vscode";

export async function replaceCurrentSelection(
  replacer: (selectedText: string) => string | Promise<string>
) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  const selections = editor.selections;

  if (selections.length === 0) {
    return;
  }

  let replacements: { selection: vscode.Selection; replacement: string }[] = [];

  for (let selection of selections) {
    const selectedText = editor.document.getText(selection);

    if (!selectedText) {
      continue;
    }

    replacements.push({
      selection,
      replacement: await replacer(selectedText),
    });
  }

  return await editor.edit(async (builder) => {
    replacements.forEach(({ selection, replacement }) => {
      builder.replace(selection, replacement);
    });
  });
}
