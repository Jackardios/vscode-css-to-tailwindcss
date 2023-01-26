import { promises as fs } from "fs";

function requireUncached(module: string) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

export async function loadConfigFile<T>(
  filepath: string
): Promise<T | undefined> {
  let content: string | undefined;

  async function read() {
    if (content === null) {
      content = await fs.readFile(filepath, "utf-8");
    }

    return content;
  }

  try {
    return JSON.parse((await read()) || "");
  } catch {
    return requireUncached(filepath);
  }
}
