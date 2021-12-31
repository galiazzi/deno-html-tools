import { diffLines, gray, green, red } from "./deps.ts";

function printLineDiff(
  lineNumber: number,
  type: "+" | "-",
  value: string,
  lineWidth: number,
) {
  const color = type === "+" ? green : red;
  for (const line of value.split("\n")) {
    const ln = lineNumber.toString().padStart(lineWidth);
    console.log(gray(`${ln} |`), color(`${type} ${line}`));
    lineNumber++;
  }
}

export function diff(a: string, b: string) {
  const lineWidth =
    Math.max(a.split("\n").length, b.split("\n").length).toString().length;
  let lineOrigin = 1, lineResult = 1;
  const diff = diffLines(a, b);
  for (const chunk of diff) {
    if (chunk.removed) {
      printLineDiff(lineOrigin, "-", chunk.value, lineWidth);
      lineOrigin += chunk.count;
      continue;
    }
    if (chunk.added) {
      printLineDiff(lineResult, "+", chunk.value, lineWidth);
      lineResult += chunk.count;
      continue;
    }

    lineOrigin += chunk.count;
    lineResult += chunk.count;
  }
}
