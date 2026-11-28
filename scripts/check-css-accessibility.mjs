#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.basename(process.cwd()) === "admin-portal"
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const ignored = new Set(["node_modules", ".next", ".git", ".vercel", "dist", "build"]);
const cssFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) walk(path.join(directory, entry.name));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".css")) cssFiles.push(path.join(directory, entry.name));
  }
}

function normalizeHex(value) {
  let hex = value.slice(1);
  if (hex.length === 3 || hex.length === 4) hex = hex.slice(0, 3).split("").map((part) => part + part).join("");
  if (hex.length === 8) hex = hex.slice(0, 6);
  if (hex.length !== 6) return null;
  return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
}

function luminance(value) {
  const rgb = normalizeHex(value);
  if (!rgb) return null;
  const channels = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(background, foreground) {
  const bg = luminance(background);
  const fg = luminance(foreground);
  if (bg === null || fg === null) return null;
  return (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05);
}

function extractColors(value) {
  const colors = [...value.matchAll(/#[0-9a-f]{3,4}(?:[0-9a-f]{2})?(?:[0-9a-f]{2})?\b/gi)].map((match) => match[0]);
  if (/\bwhite\b/i.test(value)) colors.push("#ffffff");
  if (/\bblack\b/i.test(value)) colors.push("#000000");
  return [...new Set(colors)];
}

walk(root);
const failures = [];

for (const file of cssFiles) {
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  if (/(?:linear|radial|conic)-gradient\s*\(/i.test(source)) {
    failures.push(`${relative}: CSS gradients are not allowed; use solid brand surfaces.`);
  }

  const rules = /([^{}]+)\{([^{}]+)\}/g;
  let rule;
  while ((rule = rules.exec(source))) {
    const selector = rule[1].trim().replace(/\s+/g, " ").slice(0, 100);
    const declarations = rule[2];
    const backgrounds = [...declarations.matchAll(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+);?/gi)];
    const foregrounds = [...declarations.matchAll(/(?:^|;)\s*color\s*:\s*([^;]+);?/gi)];
    const background = backgrounds.at(-1)?.[1];
    const foreground = foregrounds.at(-1)?.[1];
    if (!background || !foreground) continue;

    const bgColors = extractColors(background);
    const fgColors = extractColors(foreground);
    for (const bg of bgColors) {
      for (const fg of fgColors) {
        const ratio = contrastRatio(bg, fg);
        if (ratio !== null && ratio < 4.5) {
          failures.push(`${relative}: ${selector} has ${bg} on ${fg} (${ratio.toFixed(2)}:1; minimum 4.5:1).`);
        }
      }
    }
  }
}

if (failures.length) {
  console.error("CSS accessibility checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`CSS accessibility checks passed across ${cssFiles.length} stylesheets: no gradients and no direct hex color pairs below 4.5:1.`);
