const fs = require("fs");
const compileASM = require("./ebas_compile_asm.js");
const config = require("./ebas_config.json");

const { LINE_SPACING, OUTFILE_PATH } = config;
const TRANSFORM_BASES = true;
const TOKEN_LABEL = "~";
const TOKEN_COMMENT = "#";
const TOKEN_LINE_CONTINUE = ":";
const TOKEN_INLINE_ASM_OPEN = "{{!";
const TOKEN_INLINE_ASM_CLOSE = "!}}";
const INFILE_SUFFIX = ".ebas";
const OUTFILE_SUFFIX = ".bas";

const args = process.argv.slice(2);
if (args.length) {
  main(args[0]);
} else {
  console.log("Converts .ebas files to basic .bas file");
  console.warn("Error: no input file specified.");
}

async function main(file) {
  const name = chopExtension(file);
  try {
    const txt = await readFile(name + INFILE_SUFFIX);
    const input = txt.split("\n");
    const includified = await includify(input);
    const asmified = await inlineASMify(includified);
    const macrofied = macrofy(asmified);
    const decommented = decomment(macrofied);
    const sameLinered = sameLinerize(decommented);
    const numberized = numberize(sameLinered);
    const decimalized = decimalize(numberized);
    const output = stringify(decimalized);

    //  console.log(output);
    await writeFile(OUTFILE_PATH + name + OUTFILE_SUFFIX, output);
    console.log("Done.");
  } catch (e) {
    console.error(e);
  }
}

const chunk = (arr, size) =>
  arr
    .map((el, i) => (i % size === 0 ? arr.slice(i, i + size) : null))
    .filter((i) => i);

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

const findMacroBlocks = (lines) =>
  lines.reduce(
    (ac, line) => {
      const { macros, state, lines } = ac;
      const trimmed = line.trim();
      if (state === "closed") {
        if (trimmed.startsWith("{!")) {
          const macro = [];
          let mline = line.slice(2).trimStart();
          const oneLiner = trimmed.endsWith("!}");
          if (oneLiner) {
            mline = mline.trimEnd().slice(0, -2).trimEnd();
          }
          macro.push(mline);
          macros.push(macro);
          ac.state = oneLiner ? "closed" : "open";
        } else {
          // No macros - keep this line
          lines.push(line);
        }
      } else {
        const macro = macros[macros.length - 1];
        let mline = line;
        if (trimmed.endsWith("!}")) {
          mline = mline.trimEnd().slice(0, 2).trimEnd();
          ac.state = "closed";
        }
        macro.push(mline);
      }
      return ac;
    },
    { macros: [], state: "closed", lines: [] }
  );

const ctx = {
  COLS: [
    "blk",
    "wht",
    "red",
    "cyn",
    "pur",
    "grn",
    "blu",
    "yel",
    "orn",
    "brn",
    "lred",
    "gry1",
    "gry2",
    "lgrn",
    "lblu",
    "gry3",
  ],
};

const macrofy = (linesWithMacros) => {
  const { macros, lines } = findMacroBlocks(linesWithMacros);
  const env = macros.map(parseMacroBlock).reduce((env, m) => {
    const body = m.body.startsWith("[")
      ? "return " + m.body
      : m.body.substring(1, m.body.length - 1); // slice out { }
    env[m.name] = new Function(...m.args, "with(this){ " + body + "}");
    return env;
  }, {});

  // exec inline macros
  return lines.reduce((lines, line) => {
    const exp = regexReplace(line, "{{(.+)}}", (line, match) => {
      const funcAndArgRegex = new RegExp("\\s*([a-zA-Z_]+)\\((.*)\\)");
      const [, func, argString] = match[1].match(funcAndArgRegex);
      // TODO: split on "," is wrong: strings with commas exist, yo.
      const args = argString.split(",").map(eval); // eval to convert to types
      const res = env[func].apply(ctx, args);
      if (Array.isArray(res)) {
        return [line.replace(match[0], res[0]), ...res.slice(1)];
      }
      return line.replace(match[0], res);
    });

    if (Array.isArray(exp)) {
      exp.map((l) => lines.push(l));
    } else {
      lines.push(exp);
    }
    return lines;
  }, []);

  function parseMacroBlock(macroBlock, env) {
    const macroName = "([a-zA-Z0-9_$]+)\\s*=\\s*";
    const params = "\\(([a-zA-Z_,\\s]*)\\)\\s*";
    const funcAssign = "=>\\s*";
    const restOfFirstLine = "(.+)";
    const r = new RegExp(
      `^${macroName}${params}${funcAssign}${restOfFirstLine}`
    );

    const matches = macroBlock[0].match(r);
    return {
      name: matches[1].trim(),
      args: matches[2].split(",").map((a) => a.trim()),
      body: [matches[3], ...macroBlock.slice(1)].join("\n"),
    };
  }
};

async function includify(lines) {
  return lines.reduce(async (acp, line) => {
    const ac = await acp;
    const t = line.trim();
    if (!t.match(/^{{\s*"/)) return [...ac, t];

    // recursively push contents of include file.
    const r = new RegExp('{{\\s*\\"([a-zA-Z0-9_./]+)\\"', "g");
    const match = [...t.matchAll(r)];
    if (!match.length) {
      console.log("error parsing include file name");
      return ac;
    }
    const name = match[0][1];
    let txt;
    try {
      txt = await readFile(name);
    } catch (e) {
      console.error("Error reading include file ", name);
      return ac;
    }
    const inc = await includify(txt.split("\n"));

    return [...ac, ...inc];
  }, []);
}

async function inlineASMify(lines) {
  const obj = {
    basic: [],
    asm: [],
    inASMBlock: false,
    useAutoAddr: false,
    title: "",
    addr: 0xc000, // Default POKE address
  };

  const compile = async (ac, title = "") => {
    const { basic, asm, useAutoAddr, addr } = ac;
    const autoAddr = useAutoAddr ? ["*=" + addr] : [];
    const src = [...autoAddr, ...asm].join("\n");

    const c = await compileASM(src);
    if (!c.err) {
      basic.push(...pokeASMBytes(c, title));
      // Set next mem location (last value of first? segment)
      ac.addr = c.memoryMap[0][1] + 1;
    } else {
      console.error(
        `Error: failed to compile asm${title && " '" + title + "'"}\n\n`,
        c.err
      );
    }
  };

  const out = await lines.reduce(async (acp, line) => {
    const ac = await acp;
    if (!ac.inASMBlock) {
      if (line.startsWith(TOKEN_INLINE_ASM_OPEN)) {
        ac.inASMBlock = true;
        ac.useAutoAddr = line.includes("*");
        const title = line.match(/"([a-zA-Z\s_]+)"/);
        if (title) {
          ac.title = title[1];
        }
      } else {
        ac.basic.push(line);
      }
    } else {
      if (line.startsWith(TOKEN_INLINE_ASM_CLOSE)) {
        // Done, let's compile
        await compile(ac, ac.title);
        // Reset
        ac.asm = [];
        ac.inASMBlock = false;
        ac.useAutoAddr = false;
        ac.title = "";
      } else {
        ac.asm.push(line);
      }
    }
    return ac;
  }, obj);
  return out.basic;
}

const pokeASMBytes = (compiled, title, exec = true) => {
  if (compiled.bytes.length > 255) {
    // TODO: handle >255 bytes
    console.warn("WARNING: >255 bytes not poked properly!");
  }
  const titleREM = title ? `rem ${title}\n` : "";
  const data = chunk(compiled.bytes, 16)
    .map((c) => "data " + c.join(","))
    .join("\n");
  const pokes = `\nfor za = 0 to ${compiled.bytes.length - 1}
read zb:poke ${compiled.address}+za,zb:next za`;
  const sys = exec ? `\nsys ${compiled.address}` : "";
  return (titleREM + data + pokes + sys).split("\n");
};

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
