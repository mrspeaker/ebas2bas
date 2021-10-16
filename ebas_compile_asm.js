const { exec } = require("child_process");
const { KICKASSEMBLER_PATH } = require("./ebas_config.json");

/*
  Extract memory segment locations from kickassember output.
  Example (partial) output from kick:

   Memory Map
   ----------
   Default-segment:
     $c000-$c030 Unnamed

   Writing Symbol file: tmp.sym

  output:

   [[49152, 49200]]

*/
const extractMemoryMap = (kick) => {
  const memStart = kick.indexOf("Memory Map");
  const memEnd = kick.indexOf("Writing Symbol file");
  if (memStart === -1 || memEnd === -1 || memEnd < memStart) {
    console.error("Problem parsing KickAssembler memory map info");
    return -1;
  }
  const memAreas = kick
    .substring(memStart, memEnd)
    .split("\n")
    .slice(3)
    .map((m) => m.trim())
    .filter((m) => m)
    .map((m) =>
      m
        .replace(/\$([a-z0-9]+)-\$([a-z0-9]+).*/, "$1,$2")
        .split(",")
        .map((m) => parseInt(m, 16))
    );

  return memAreas;
};

/*
  Parse xxd output into 8-bit bytes.
  TODO: Shouldn't need this function: just use the bytes directly
  from `cat` without xxd... How to do this with Node?

  Example output from xxd:

  00000000: 00c0 78a5 0129 f809 0385 01a9 d0a0 0085  ..x..)..........
  00000030: 0158 60                                  .X`

  Output from function:
  [ 0,192,120,165,1,41,248,...]

 */
function parseXxdOutput(xxdString) {
  return xxdString.split("\n").reduce((ac, el) => {
    if (el.trim() === "") return ac;
    const notAsciiDisplay = el.split("  ")[0];
    const noSpace = notAsciiDisplay.replace(/\s*/g, "");
    let byteString = noSpace.slice("00000000:".length);
    const bytes = [];
    while (byteString.length) {
      const byte = parseInt(byteString.slice(0, 2), 16);
      bytes.push(byte);
      byteString = byteString.slice(2);
    }
    return [...ac, ...bytes];
  }, []);
}

/*
  Compiles 6502 asm code with KickAssembler.

  in:
    *=$c0001
    inc d020
    rts

  out:
    {
      address: 49162,
      bytes: [ 206, 32, 208, 96 ],
      memoryMap: [ [ 49162, 49165 ] ]
   }

  Relies on: KickAssembler, mktmp, xxd
*/
async function compileASM(asm) {
  return new Promise((res, rej) => {
    const writeASMtoTmpFile =
      'tmpf=$(mktemp);tmpn=$(echo "${tmpf%.*}");' +
      "cat <<EOF >$tmpf \n" +
      asm.replace(/\$/g, "\\$") +
      "\nEOF\n";
    const compile = `java -cp '${KICKASSEMBLER_PATH}*' kickass.KickAssembler $tmpf;`;

    const SEPARATOR = "~~~~";
    const addSeparator = `echo '${SEPARATOR}';`;
    const getPRGBytes = "cat $tmpn.prg | xxd";

    const cmd = writeASMtoTmpFile + compile + addSeparator + getPRGBytes;

    exec(cmd, (err, stdout, stderr) => {
      if (err) return rej({ err });
      if (stderr) return res({ err: stderr });

      const [kick, compiled] = stdout.split(SEPARATOR);
      if (kick.match("Error")) {
        return res({ err: kick });
      }
      const memoryMap = extractMemoryMap(kick);
      const prgFile = parseXxdOutput(compiled);
      // PRG files have address as first two bytes
      const [addrLo, addrHi, ...bytes] = prgFile;
      return res({
        address: addrHi * 256 + addrLo,
        bytes,
        memoryMap,
      });
    });
  });
}

module.exports = compileASM;
