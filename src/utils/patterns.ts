import * as path from "path";
import * as vscode from "vscode";
import { isMatch } from "micromatch";

export function getGlobalExcludePatterns(
  scope: vscode.ConfigurationScope
): string[] {
  return Object.entries(
    vscode.workspace.getConfiguration("files", scope).get("exclude") as Record<
      string,
      boolean
    >
  )
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .filter(Boolean);
}

export function getExcludePatterns(scope: vscode.ConfigurationScope): string[] {
  return [
    ...getGlobalExcludePatterns(scope),
    ...(<string[]>(
      vscode.workspace
        .getConfiguration("tailwindCSS", scope)
        .get("files.exclude")
    )).filter(Boolean),
  ];
}

export function isExcluded(
  file: string,
  folder: vscode.WorkspaceFolder
): boolean {
  let exclude = getExcludePatterns(folder);

  for (let pattern of exclude) {
    if (isMatch(file, path.join(folder.uri.fsPath, pattern))) {
      return true;
    }
  }

  return false;
}

export function mergeExcludes(
  settings: vscode.WorkspaceConfiguration,
  scope: vscode.ConfigurationScope
): any {
  return {
    ...settings,
    files: {
      ...settings.files,
      exclude: getExcludePatterns(scope),
    },
  };
}
