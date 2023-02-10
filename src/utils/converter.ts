import * as vscode from "vscode";
import type { Root } from "postcss";
import { parse } from "tolerant-json-parser";
import postcss from "postcss";
import * as postcssJs from "postcss-js";
import { Log } from "./log";
import { TailwindConverter } from "css-to-tailwindcss";
import { nanoid } from "nanoid";
import { isPlainObject } from "./object";
import replaceString from "replace-string";

function wrapCSS(id: string, css: string) {
  return `${id} { ${css} }`;
}

function deepUnwrapAtRule(id: string, atRuleValue: any) {
  if (!isPlainObject(atRuleValue)) {
    return atRuleValue;
  }

  Object.keys(atRuleValue).forEach((itemKey) => {
    const itemValue = atRuleValue[itemKey];

    if (itemKey.startsWith("@")) {
      deepUnwrapAtRule(id, itemValue);
    } else if (isPlainObject(itemValue)) {
      delete atRuleValue[itemKey];
      Object.assign(atRuleValue, itemValue);
    }
  });

  return atRuleValue;
}

function unwrapJSS(id: string, jss: Record<string, any>) {
  const result = jss[id];

  delete jss[id];
  Object.keys(jss).forEach((key) => {
    const jssItem = jss[key];
    if (key.startsWith("@")) {
      result[key] = deepUnwrapAtRule(id, jssItem);
    } else {
      result[replaceString(key, id, "&")] = jssItem;
    }
  });

  return result;
}

export async function convertToTailwindCSS(
  input: string,
  tailwindConverter: TailwindConverter
) {
  try {
    const id = nanoid();
    const jsObject = parse(input);
    const parsed = await postcss().process(jsObject, {
      parser: postcssJs.parse,
    });
    const converted = await tailwindConverter.convertCSS(
      wrapCSS(id, parsed.css)
    );
    return JSON.stringify(
      unwrapJSS(id, postcssJs.objectify(converted.convertedRoot as Root)),
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
