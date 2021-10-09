const fs = require("fs");

const LINE_SPACING = 10;
const TRANSFORM_BASES = true;
const TOKEN_LABEL = "~";
const TOKEN_COMMENT = "#";
const TOKEN_LINE_CONTINUE = ":";
const INFILE_SUFFIX = ".ebas";
const OUTFILE_SUFFIX = ".bas";
const OUTFILE_PATH = "./";

const args = process.argv.slice(2);
if (args.length) {
  main(args[0]);
} else {
  console.log("Converts .ebas files to basic .bas file");
  console.warn("Error: no input file specified.");
}

async function main(file) {
  const name = chopExtension(file);
  let txt;
  try {
    txt = await readFile(name + INFILE_SUFFIX);
  } catch (e) {
    console.log("Could not open file\n", e);
    return;
  }

  const input = txt.split("\n");
  const decommented = decomment(input);
  const sameLinered = sameLinerize(decommented);
  const numberized = numberize(sameLinered);
  const decimalized = decimalize(numberized);
  const output = stringify(decimalized);

  console.log(output);

  writeFile(OUTFILE_PATH + name + OUTFILE_SUFFIX, output)
    .then(() => console.log("Done."))
    .catch((e) => console.error("Writing failed.\n", e));
}

async function readFile(name) {
  return new Promise((res, rej) =>
    fs.readFile(name, "utf-8", (err, content) =>
      err ? rej(err) : res(content)
    )
  );
}
async function writeFile(name, contents) {
  return new Promise((res, rej) =>
    fs.writeFile(name, contents, (err) => (err ? rej(err) : res(1)))
  );
}

function chopExtension(file) {
  return file.endsWith(INFILE_SUFFIX)
    ? file.slice(0, -INFILE_SUFFIX.length)
    : file;
}

const sameLinerize = (lines) =>
  lines.reduce((ac, el, i) => {
    const lastLine = i > 0 ? ac[ac.length - 1] : "";
    if (lastLine.endsWith(TOKEN_LINE_CONTINUE)) {
      ac[ac.length - 1] += el;
    } else {
      ac.push(el);
    }
    return ac;
  }, []);

const decimalize = (lines) => lines.map(replaceBases);
const stringify = (lines) => lines.join("\n");

function decomment(lines) {
  return lines.reduce((ac, el) => {
    const line = el.replace(new RegExp(`${TOKEN_COMMENT}.*$`), "").trim();
    if (line !== "") {
      ac.push(line);
    }
    return ac;
  }, []);
}
const regexReplace = (line, regex, f) =>
  [...line.matchAll(new RegExp(regex, "g"))].reduce(f, line);

const replaceHex = (line) =>
  regexReplace(line, "0x[0-9a-fA-F_]+", (line, match) =>
    line.replace(match[0], parseInt(match[0].replace(/_/g, ""), 16))
  );

const replaceBinary = (line) =>
  regexReplace(line, "0b([0-1_]+)", (line, match) =>
    line.replace(match[0], parseInt(match[1].replace(/_/g, ""), 2))
  );

const id = (e) => e;
const compose = (f, g) => (x) => f(g(x));
const replaceBases = TRANSFORM_BASES ? compose(replaceBinary, replaceHex) : id;

const numberize = (nonNumberedLines) => {
  const replaceLabels = (line, labels) =>
    regexReplace(line, `${TOKEN_LABEL}([a-z_]+)`, (line, match) =>
      line.replace(match[0], labels[match[0]])
    );

  const { lines, labels } = nonNumberedLines.reduce(
    (ac, line) => {
      const { lines, labels, lineNum } = ac;
      if (line.startsWith(TOKEN_LABEL)) {
        labels[line] = lineNum;
        return ac;
      }

      lines.push(`${lineNum} ${line}`);
      ac.lineNum += LINE_SPACING;
      return ac;
    },
    { lines: [], labels: {}, lineNum: LINE_SPACING }
  );

  return lines.map((l) => replaceLabels(l, labels));
};
