import * as vscode from "vscode";
import { TailwindConverter, TailwindConverterConfig } from "css-to-tailwindcss";

import { CONFIG_FILE_GLOB } from "../constants";
import { Log } from "../utils/log";
import { loadConfigFile } from "../utils/config";

const DEFAULT_TAILWIND_CONFIG_FILE_PATTERN = `**/${CONFIG_FILE_GLOB}`;

export const DEFAULT_CONVERTER_CONFIG: Partial<TailwindConverterConfig> = {
  postCSSPlugins: [require("postcss-nested")],
};

export class WorkspaceFolderClient {
  protected workspaceFolder: vscode.WorkspaceFolder;
  protected extensionContext: vscode.ExtensionContext;
  protected converterConfig: Partial<TailwindConverterConfig>;
  protected tailwindConfigFilePattern: vscode.RelativePattern | null = null;
  protected currentConfigFileWatcher: vscode.FileSystemWatcher | null = null;
  protected currentConverter: TailwindConverter | null = null;

  constructor(
    workspaceFolder: vscode.WorkspaceFolder,
    extensionContext: vscode.ExtensionContext
  ) {
    this.workspaceFolder = workspaceFolder;
    this.extensionContext = extensionContext;
    this.converterConfig = DEFAULT_CONVERTER_CONFIG;
  }

  async init() {
    await this.refresh();
  }

  async refresh() {
    await this.refreshSettings();
  }

  async destroy() {
    this.stopConfigFileWatcher();
  }

  getCurrentTailwindConverter() {
    return this.currentConverter;
  }

  protected async refreshSettings() {
    const converterSettings = vscode.workspace.getConfiguration(
      "cssToTailwindCss",
      this.workspaceFolder
    );
    const intellisenseSettings = vscode.workspace.getConfiguration(
      "tailwindCSS",
      this.workspaceFolder
    );

    let configFilePattern = intellisenseSettings.get(
      "experimental.configFile"
    ) as string | Record<string, string | string[]> | undefined;

    let remInPx = parseInt(intellisenseSettings.get("rootFontSize") || "16");

    if (configFilePattern && typeof configFilePattern !== "string") {
      Log.error(
        "Only 'string' is supported for `tailwindCSS.experimental.configFile` configuration so far"
      );

      configFilePattern = DEFAULT_TAILWIND_CONFIG_FILE_PATTERN;
    }

    const oldTailwindConfigFilePattern = this.tailwindConfigFilePattern;
    this.tailwindConfigFilePattern = new vscode.RelativePattern(
      this.workspaceFolder.uri.fsPath,
      configFilePattern
        ? configFilePattern
        : DEFAULT_TAILWIND_CONFIG_FILE_PATTERN
    );

    this.converterConfig.remInPx = isNaN(remInPx) ? 16 : remInPx;
    this.converterConfig.arbitraryPropertiesIsEnabled = !!converterSettings.get(
      "arbitraryProperties"
    );

    if (
      !this.patternsIsEqual(
        oldTailwindConfigFilePattern,
        this.tailwindConfigFilePattern
      )
    ) {
      await this.refreshConfigFileWatcher();
    }
    this.refreshConverter();
  }

  protected async refreshConverter() {
    this.currentConverter = new TailwindConverter(this.converterConfig);
  }

  protected async refreshConfigFileWatcher() {
    this.stopConfigFileWatcher();

    if (!this.tailwindConfigFilePattern) {
      return;
    }

    const [foundFile] = await vscode.workspace.findFiles(
      this.tailwindConfigFilePattern
    );
    await this.setTailwindConfigFromFile(foundFile?.fsPath || null);

    this.currentConfigFileWatcher = vscode.workspace.createFileSystemWatcher(
      this.tailwindConfigFilePattern
    );

    // This handles the case where the project didn't have config file
    // but was created after VS Code was initialized
    this.currentConfigFileWatcher.onDidCreate(async (uri) => {
      Log.info(
        `Found New TailwindCSS Config File, Reloading...\n(${uri.fsPath})`
      );

      await this.setTailwindConfigFromFile(uri.fsPath);
    });

    // Changes configuration should invalidate above cache
    this.currentConfigFileWatcher.onDidChange(async (uri) => {
      Log.info(
        `TailwindCSS Config File Changed, Reloading...\n(${uri.fsPath})`
      );

      await this.setTailwindConfigFromFile(uri.fsPath);
    });

    // If the config is deleted, utilities&variants should be regenerated
    this.currentConfigFileWatcher.onDidDelete(async (uri) => {
      Log.info(
        `TailwindCSS Config File Deleted, Reloading...\n(${uri.fsPath})`
      );

      await this.setTailwindConfigFromFile(null);
    });
  }

  protected stopConfigFileWatcher() {
    this.currentConfigFileWatcher?.dispose();
    this.currentConfigFileWatcher = null;
  }

  protected patternsIsEqual(
    first: vscode.RelativePattern | null,
    second: vscode.RelativePattern | null
  ) {
    return (
      first?.baseUri.fsPath === second?.baseUri.fsPath &&
      first?.pattern === second?.pattern
    );
  }

  protected async setTailwindConfigFromFile(filePath: string | null) {
    if (filePath) {
      try {
        this.converterConfig.tailwindConfig = await loadConfigFile(filePath);
      } catch (e) {
        Log.error(`Failed to read configuration\n(${filePath})`);
      }
    } else {
      delete this.converterConfig.tailwindConfig;
    }
  }
}
