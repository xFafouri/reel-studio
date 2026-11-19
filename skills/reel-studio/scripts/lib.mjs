// Shared helpers for the reel-studio scripts (Node 22, ES modules, no install of their own).
// Packages (playwright, ffmpeg-static, ffprobe-static) are looked up in the CURRENT project first, then next to this
// file, so the scripts work from any project that has them in its node_modules.
// Binaries: env FFMPEG / FFPROBE > ffmpeg-static / ffprobe-static > ffmpeg / ffprobe on the PATH.
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

export const run = promisify(execFile);
const BIG = { maxBuffer: 64 << 20 };

const requirers = [createRequire(path.join(process.cwd(), 'noop.js')), createRequire(import.meta.url)];
export function need(name) {
  for (const r of requirers) {
    try { return r(name); } catch { /* try the next place */ }
  }
  return null;
}

export const FFMPEG = process.env.FFMPEG || need('ffmpeg-static') || 'ffmpeg';
export const FFPROBE = process.env.FFPROBE || need('ffprobe-static')?.path || 'ffprobe';

export const ff = (args, opts = {}) => run(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { ...BIG, ...opts });

export async function duration(file) {
  const { stdout } = await run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], BIG);
  return parseFloat(stdout);
}

// Integrated loudness (LUFS) and true peak (dBTP) of a file, from ffmpeg's ebur128 filter.
export async function loudness(file, { seconds } = {}) {
  const { stderr } = await run(FFMPEG, ['-hide_banner', ...(seconds ? ['-t', String(seconds)] : []), '-i', file,
    '-af', 'ebur128=framelog=quiet:peak=true', '-f', 'null', '-'], BIG);
  const lufs = [...stderr.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1);
  const peak = [...stderr.matchAll(/Peak:\s+(-?[\d.]+|-inf) dBFS/g)].at(-1);
  return { lufs: lufs ? +lufs[1] : null, peak: peak ? +peak[1] : null };
}

export const exists = (f) => fs.existsSync(f);
export const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

// --name value / --flag arguments
export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}
