// Reproducible PNG app marks using only Node's built-in libraries.
import { deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function chunk(type, data) {
  const tag = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  let crc = 0xffffffff;
  for (const b of Buffer.concat([tag, data]))
    crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([len, tag, data, tail]);
}
await mkdir("public/icons", { recursive: true });
for (const size of [180, 192, 512]) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const rgb = [0, 0, 0];
      for (let sy = 0; sy < 3; sy++)
        for (let sx = 0; sx < 3; sx++) {
          const u = ((x + (sx + 0.5) / 3) / size) * 192;
          const v = ((y + (sy + 0.5) / 3) / size) * 192;
          let color = [30, 18, 44];
          if (
            (u - 88) ** 2 + (v - 99) ** 2 < 46 ** 2 &&
            (u - 111) ** 2 + (v - 81) ** 2 >= 45 ** 2
          )
            color = [222, 196, 245];
          const a = Math.abs(u - 130);
          const b = Math.abs(v - 60);
          if (a / 10 + b / 15 < 1) color = [211, 229, 180];
          for (let c = 0; c < 3; c++) rgb[c] += color[c] / 9;
        }
      const pos = y * (size * 4 + 1) + 1 + x * 4;
      for (let c = 0; c < 3; c++) pixels[pos + c] = Math.round(rgb[c]);
      pixels[pos + 3] = 255;
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  await writeFile(
    size === 180
      ? "public/icons/apple-touch-icon.png"
      : `public/icons/icon-${size}.png`,
    png,
  );
}
console.log("NOCTIS app icons generated.");
