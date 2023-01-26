# CSS to TailwindCSS converter (VS Code extension)

**[🔗 NPM Package](https://www.npmjs.com/package/css-to-tailwindcss)**

🔄 Convert your **CSS** to **TailwindCSS** considering workspace tailwind configuration in a few clicks.

![VSCode extension demo](.github/demo.gif)

## Installation

**[Install via the Visual Studio Code Marketplace →](https://marketplace.visualstudio.com/items?itemName=jackardios.vscode-css-to-tailwindcss)**

The extension, when activated, finds the first [Tailwind config file](https://tailwindcss.com/docs/installation#create-your-configuration-file) named `tailwind.config.js` or `tailwind.config.cjs` in your workspace and uses it when converting CSS.

## Extension Settings

### `tailwindCSS.rootFontSize`

**Default: `16`**

Root font size in pixels. Used to convert `rem` CSS values to their `px` equivalents. See [`tailwindCSS.showPixelEquivalents`](#tailwindcssshowpixelequivalents).

### `tailwindCSS.experimental.configFile`

**Default: `null`**

By default the extension will automatically use the first `tailwind.config.js` or `tailwind.config.cjs` file in your workspace that it can find to provide CSS to TailwindCSS converting. Use this setting to manually specify the config file(s) yourself instead.

Example:

```
"tailwindCSS.experimental.configFile": ".config/tailwind.config.js"
```

## Release Notes

### 1.0.0

Initial release
