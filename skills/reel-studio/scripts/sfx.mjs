#!/usr/bin/env node
// Sound effects made from math with ffmpeg (aevalsrc / anoisesrc): original sounds, no samples, no licence to check.
// Whoosh on every scene change, sting on a reveal, buzz on "wrong", pop when something appears…
//   node sfx.mjs list                         every effect with its one-line use
//   node sfx.mjs pop out.wav                  one effect → mono 48 kHz WAV
//   node sfx.mjs riser:1.5 out.wav            effects with a length take ':<seconds>' (whir, under, ringback, drone, riser, pad)
//   node sfx.mjs all sfx/                     every effect into a folder (to audition them)
// From code: import { sfxFile, SFX } from './sfx.mjs'; await sfxFile('sting', 'out/sfx-sting.wav')
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ff } from './lib.mjs';

// ---------- the library ----------
export const SFX = {
  // air past the camera: put one 0.2 s before every scene change
  whoosh: "anoisesrc=d=0.45:c=pink:a=0.9:r=48000,bandpass=f=1400:w=1800,afade=t=in:d=0.2:curve=exp,afade=t=out:st=0.2:d=0.25,volume=0.12",
  // a small thing appearing (a sticker, a label, a number)
  pop: "aevalsrc='0.2*sin(2*PI*(520+700*exp(-35*t))*t)*exp(-28*t)':d=0.14:s=48000",
  // a bright bell: a right answer, a key number lands
  ding: "aevalsrc='0.14*sin(2*PI*1318*t)*exp(-5*t)+0.07*sin(2*PI*2637*t)*exp(-8*t)+0.05*sin(2*PI*1976*t)*exp(-6*t)':d=0.9:s=48000",
  // dramatic reveal (a myth is stamped): low boom falling in pitch + a dark minor chord that fades
  sting: "aevalsrc='0.42*sin(2*PI*(92-38*t)*t)*exp(-2.6*t)+0.06*sin(2*PI*220*t)*exp(-1.6*t)+0.05*sin(2*PI*261.6*t)*exp(-1.6*t)+0.045*sin(2*PI*311.1*t)*exp(-1.7*t)':d=1.6:s=48000",
  // "wrong" buzzer: two short low buzzes
  buzz: "aevalsrc='0.16*(sin(2*PI*150*t)+0.6*sin(2*PI*300*t)+0.3*sin(2*PI*450*t))*(lt(t,0.16)+between(t,0.24,0.42))*exp(-1.5*t)':d=0.45:s=48000",
  // clock tick
  tick: "aevalsrc='0.22*sin(2*PI*2400*t)*exp(-90*t)+0.12*sin(2*PI*1200*t)*exp(-60*t)':d=0.08:s=48000",
  // footsteps: a heavy heel strike
  thud: "aevalsrc='0.55*sin(2*PI*(95-40*t)*t)*exp(-22*t)+0.12*(random(0)*2-1)*exp(-60*t)':d=0.25:s=48000,lowpass=f=900",
  // footsteps: a light quick step
  tap: "aevalsrc='0.22*sin(2*PI*(170-60*t)*t)*exp(-45*t)+0.05*(random(0)*2-1)*exp(-90*t)':d=0.12:s=48000,lowpass=f=1800",
  // a knuckle crack: a sharp noise snap over a short low thump
  crack: "aevalsrc='0.55*(random(0)*2-1)*exp(-150*t)+0.42*sin(2*PI*(260-90*t)*t)*exp(-48*t)':d=0.16:s=48000,highpass=f=110,lowpass=f=7500",
  // a judge's gavel on its wooden block: a dry click over a short hollow knock
  gavel: "aevalsrc='0.5*(random(0)*2-1)*exp(-110*t)+0.6*sin(2*PI*140*t)*exp(-30*t)+0.3*sin(2*PI*310*t)*exp(-42*t)+0.12*sin(2*PI*620*t)*exp(-60*t)':d=0.3:s=48000,highpass=f=60,lowpass=f=2800",
  // a safety brake firing into a spinning blade: a loud metal clack over a low thump, with a short metallic ring
  bang: "aevalsrc='0.7*(random(0)*2-1)*exp(-70*t)+0.6*sin(2*PI*(110-40*t)*t)*exp(-14*t)+0.07*sin(2*PI*1870*t)*exp(-9*t)+0.05*sin(2*PI*3130*t)*exp(-12*t)+0.035*sin(2*PI*4710*t)*exp(-16*t)':d=0.7:s=48000,highpass=f=50,lowpass=f=9000",
  // a phone vibrating on a wooden nightstand: two short buzzes with a rattle
  vibe: "aevalsrc='0.22*sin(2*PI*172*t)*(0.65+0.35*sin(2*PI*38*t))*(lt(t,0.3)+between(t,0.42,0.72))+0.04*(random(0)*2-1)*(lt(t,0.3)+between(t,0.42,0.72))':d=0.78:s=48000,lowpass=f=1400,highpass=f=90",
  // a tape rewinding fast: a chirp rising in pitch over a little hiss
  rewind: "aevalsrc='0.16*sin(2*PI*(300*t+2600*t*t))*min(1,t/0.04)+0.05*(random(0)*2-1)':d=0.45:s=48000,highpass=f=250,lowpass=f=6500,afade=t=out:st=0.33:d=0.12",
  // a table saw running ('whir:<seconds>'): motor hum and blade whine, cut dead at the end (the brake)
  whir: (d) => `aevalsrc='(0.025*(random(0)*2-1)+0.035*sin(2*PI*120*t)+0.018*sin(2*PI*240*t)+0.006*sin(2*PI*2950*t)+0.004*sin(2*PI*5900*t))*min(1,t/0.25)':d=${d}:s=48000,highpass=f=70,lowpass=f=5000,afade=t=out:st=${Math.max(0, d - 0.03).toFixed(2)}:d=0.03`,
  // ice cubes knocking in a glass: two quick bright glassy pings
  clink: "aevalsrc='(0.09*sin(2*PI*3150*t)+0.06*sin(2*PI*4720*t)+0.03*sin(2*PI*6280*t))*exp(-38*t)+gte(t,0.09)*(0.07*sin(2*PI*3480*(t-0.09))+0.045*sin(2*PI*5210*(t-0.09)))*exp(-45*(t-0.09))':d=0.4:s=48000,highpass=f=1500",
  // a car hitting water: a burst of spray over a low thump
  splash: "aevalsrc='0.55*(random(0)*2-1)*exp(-4.5*t)*min(1,t/0.015)+0.5*sin(2*PI*(85-30*t)*t)*exp(-7*t)':d=1.1:s=48000,highpass=f=70,lowpass=f=5200",
  // air bubbles rising under water: a few quick rising blips
  bubbles: "aevalsrc='0.2*sin(2*PI*(380+1500*mod(t,0.14))*t)*exp(-26*mod(t,0.14))*lt(t,0.84)':d=0.9:s=48000,lowpass=f=3000",
  // under water ('under:<seconds>'): a soft low rumble that fades in and out
  under: (d) => `anoisesrc=d=${d}:c=brown:a=1:r=48000,lowpass=f=240,volume=0.55,afade=t=in:d=0.35,afade=t=out:st=${Math.max(0, d - 0.6).toFixed(2)}:d=0.6`,
  // a rubber stamp hitting paper: a soft dull knock with a papery slap
  stamp: "aevalsrc='0.45*sin(2*PI*(120-50*t)*t)*exp(-30*t)+0.18*(random(0)*2-1)*exp(-80*t)':d=0.22:s=48000,lowpass=f=2200,highpass=f=60",
  // ----- a phone call -----
  // a mobile ringing: two warbling bursts
  ring: "aevalsrc='0.16*(sin(2*PI*1320*t)+0.8*sin(2*PI*1760*t))*(0.55+0.45*sin(2*PI*21*t))*(lt(t,0.42)+between(t,0.58,1.0))':d=1.05:s=48000,highpass=f=500,lowpass=f=5000",
  // the call is picked up: a small click
  pickup: "aevalsrc='0.5*(random(0)*2-1)*exp(-420*t)+0.22*sin(2*PI*880*t)*exp(-110*t)':d=0.07:s=48000,highpass=f=300",
  // the line is cut: three busy beeps
  hangup: "aevalsrc='0.13*(sin(2*PI*480*t)+sin(2*PI*620*t))*lt(mod(t,0.36),0.2)':d=1.02:s=48000,lowpass=f=3400",
  // dialing a number: seven quick touch tones
  dial: `aevalsrc='0.11*(${[[697, 1209], [770, 1336], [852, 1477], [697, 1336], [941, 1336], [770, 1209], [852, 1336]].map(([a, b], i) => `between(t,${(i * 0.105).toFixed(3)},${(i * 0.105 + 0.07).toFixed(3)})*(sin(2*PI*${a}*t)+sin(2*PI*${b}*t))`).join('+')})':d=0.75:s=48000`,
  // the ringing the caller hears ('ringback:<seconds>')
  ringback: (d) => `aevalsrc='0.09*(sin(2*PI*440*t)+sin(2*PI*480*t))':d=${d}:s=48000,lowpass=f=3400,afade=t=in:d=0.02,afade=t=out:st=${Math.max(0, d - 0.03).toFixed(2)}:d=0.03`,
  // one heartbeat (lub-dub)
  heart: "aevalsrc='0.95*sin(2*PI*(62-22*t)*t)*exp(-24*t)+gte(t,0.21)*0.7*sin(2*PI*(56-18*(t-0.21))*(t-0.21))*exp(-28*(t-0.21))':d=0.55:s=48000,lowpass=f=180",
  // a low, uneasy drone ('drone:<seconds>'): two close low notes beating against each other
  drone: (d) => `aevalsrc='0.13*sin(2*PI*55*t)+0.10*sin(2*PI*58.2*t)+0.06*sin(2*PI*82.4*t+0.8*sin(2*PI*0.23*t))+0.035*sin(2*PI*116.5*t)':d=${d}:s=48000,lowpass=f=420,afade=t=in:d=0.8,afade=t=out:st=${Math.max(0, d - 0.5).toFixed(2)}:d=0.5`,
  // a rising hiss before a reveal ('riser:<seconds>')
  riser: (d) => `anoisesrc=d=${d}:c=white:a=0.5:r=48000,highpass=f=1200,volume='0.02+0.2*pow(t/${d},3)':eval=frame,afade=t=out:st=${Math.max(0, d - 0.04).toFixed(2)}:d=0.04`,
  // a digital glitch: short broken square tones
  glitch: "aevalsrc='0.16*lt(mod(t,0.07),0.045)*(gt(sin(2*PI*(260+140*floor(mod(t*29,6)))*t),0)-0.5)*2*exp(-3.5*t)+0.08*(random(0)*2-1)*lt(mod(t,0.11),0.03)':d=0.5:s=48000,highpass=f=200,lowpass=f=6000",
  // a deep hit for a title slam
  boom: "aevalsrc='0.9*sin(2*PI*(70-34*t)*t)*exp(-5.5*t)+0.25*(random(0)*2-1)*exp(-38*t)':d=1.1:s=48000,lowpass=f=1400",
  // relief: a soft warm major chord that swells and fades ('pad:<seconds>')
  pad: (d) => `aevalsrc='0.07*sin(2*PI*261.6*t)+0.06*sin(2*PI*329.6*t)+0.055*sin(2*PI*392*t)+0.04*sin(2*PI*523.3*t)+0.03*sin(2*PI*130.8*t)':d=${d}:s=48000,lowpass=f=2400,afade=t=in:d=${Math.min(0.9, d / 3).toFixed(2)},afade=t=out:st=${(d * 0.45).toFixed(2)}:d=${(d * 0.55).toFixed(2)}`,
  // a scanner sweeping a voice sample: a quick rising chirp
  scan: "aevalsrc='0.12*sin(2*PI*(500*t+2200*t*t))*min(1,t/0.03)*exp(-1.2*t)':d=0.6:s=48000,highpass=f=300,lowpass=f=7000",
};

// lengths used by `all` for the effects that take one
const DEFAULT_LEN = { whir: 2, under: 3, ringback: 2, drone: 4, riser: 1.5, pad: 3 };

export async function sfxFile(name, file) {
  const [kind, arg] = name.split(':');
  const def = SFX[kind];
  if (!def) throw new Error(`unknown effect «${kind}»: ${Object.keys(SFX).join(', ')}`);
  const graph = typeof def === 'function' ? def(+(+(arg || DEFAULT_LEN[kind] || 2)).toFixed(2)) : def;
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  await ff(['-f', 'lavfi', '-i', graph, '-ac', '1', file]);
  return file;
}

// the comment line above each effect = its description
function list() {
  const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const out = [];
  let note = '';
  for (const line of src.slice(src.indexOf('export const SFX'), src.indexOf('// lengths used')).split('\n')) {
    const c = line.match(/^\s*\/\/\s*(.*)/);
    if (c) { if (!c[1].startsWith('-----')) note = c[1]; continue; }
    const k = line.match(/^\s*'?([\w-]+)'?:/);
    if (k) { out.push(`${k[1].padEnd(10)} ${note}`); note = ''; }
  }
  console.log(out.join('\n'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [what, out] = process.argv.slice(2);
  if (!what || what === 'list') list();
  else if (what === 'all') {
    const dir = out || 'sfx';
    for (const k of Object.keys(SFX)) await sfxFile(k, path.join(dir, `${k}.wav`));
    console.log(`${Object.keys(SFX).length} effects → ${dir}/`);
  } else {
    await sfxFile(what, out || `${what.replace(':', '-')}.wav`);
    console.log(out || `${what.replace(':', '-')}.wav`);
  }
}
