import standardizeColor from "./standardizeColor";
import { CodeMap } from "../types";

/**
 * Get the color from the codeMap for a given annotation value/code.
 *
 * @param {*} annotationCode  annotation value/code
 * @param {*} codeMap         object with annotation values as keys, where values are objects with (at least) a color field
 * @returns
 */
export const getColor = (annotationCode: string | number, codeMap: CodeMap) => {
  if (codeMap[annotationCode]) {
    let color;
    const foldTo = codeMap[annotationCode].foldToParent;
    if (foldTo && codeMap[foldTo]) color = codeMap[foldTo].color;
    color = codeMap[annotationCode].color;
    return standardizeColor(color, "50");
  } else {
    if (annotationCode === "EMPTY") return "white";
    return "#ffffff50";
  }
};

/**
 * Create a gradient for a given array of colors
 *
 * @param {*} colors ...you know, colors
 * @returns
 */
export const getColorGradient = (colors: string[]) => {
  if (colors.length === 0) return "white";
  if (colors.length === 1) return colors[0];

  const pct = Math.floor(100 / colors.length);
  const gradColors = colors.reduce((a, color, i) => {
    if (i === 0) a.push(color + ` ${pct}%`);
    if (i === colors.length - 1) a.push(color + ` ${100 - pct}%`);

    if (i > 0 && i < colors.length - 1) {
      a.push(color + ` ${pct * i}%`);
      a.push(color + ` ${pct * (i + 1)}%`);
    }
    return a;
  }, []);

  return `linear-gradient(to bottom, ${gradColors.join(", ")})`;
};
