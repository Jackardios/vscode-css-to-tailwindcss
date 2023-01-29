import * as vscode from "vscode";
import type { Root } from "postcss";
import { parse } from "tolerant-json-parser";
import postcss from "postcss";
import * as postcssJs from "postcss-js";
import { Log } from "./log";
import { TailwindConverter } from "css-to-tailwindcss";

export async function convertToTailwindCSS(
  input: string,
  tailwindConverter: TailwindConverter
) {
  try {
    const jsObject = parse(input);
    const parsed = await postcss().process(jsObject, {
      parser: postcssJs.parse,
    });
    const converted = await tailwindConverter.convertCSS(
      `root { ${parsed.css} }`
    );
    return JSON.stringify(
      postcssJs.objectify(converted.convertedRoot as Root)["root"],
      null,
      vscode.window.activeTextEditor?.options.tabSize || 4
    );
  } catch {}

  try {
    return (await tailwindConverter.convertCSS(input)).convertedRoot.toString();
  } catch (e) {
    Log.error(e);

    return input;
  }
}
