
import * as fs from 'node:fs';
import SPECTRAL_TYPE_DATA from '../data/spectral_type_colors.json' with {type: 'json'};
import {PARSEC, round, Color, GREEK_LETTERS, CONSTELLATIONS} from './util.js';


function parseColor(color: string): Color {
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    return [r, g, b];
}

type Subclass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type MainClass = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';
type Numeral = 'I' | 'II' | 'III' | 'IV' | 'V';
type MainPart<T> = {[K in Subclass]?: {[K in Numeral]?: T}};
type SpecialClass = 'WN' | 'WC' | 'S' | 'N' | 'R' | 'D';
type SpecialPart<T> = {[K in Subclass]?: T};
type SpectralTypeColors = {[K in MainClass]?: MainPart<Color>} & {[K in SpecialClass]?: SpecialPart<Color>} & {C?: Color}

const SPECTRAL_TYPE_COLORS: SpectralTypeColors = {C: parseColor(SPECTRAL_TYPE_DATA['C'])};

for (let key of ['O', 'B', 'A', 'F', 'G', 'K', 'M'] as const) {
    let value: MainPart<string> = SPECTRAL_TYPE_DATA[key];
    let out: MainPart<Color> = {};
    for (let [number, rawNumerals] of Object.entries(value)) {
        let numerals: {[K in Numeral]?: Color} = {};
        for (let [numeral, color] of Object.entries(rawNumerals)) {
            numerals[numeral as `${Numeral}`] = parseColor(color);
        }
        out[number as `${Subclass}`] = numerals;
    }
    SPECTRAL_TYPE_COLORS[key] = out;
}

for (let key of ['WN', 'WC', 'S', 'N', 'R', 'D'] as const) {
    let value: SpecialPart<string> = SPECTRAL_TYPE_DATA[key];
    let out: SpecialPart<Color> = {};
    for (let [number, color] of Object.entries(value)) {
        out[number as `${Subclass}`] = parseColor(color);
    }
    SPECTRAL_TYPE_COLORS[key] = out;
}


let missingTypes = new Set<string>();

function getSpectralTypeColor(type: string): [number, number, number] | null {
    let cls = type[0];
    let originalType = type;
    while (!'OBAFGKMWSNRDC'.includes(cls) && type.length > 0) {
        type = type.slice(1);
        cls = type[0];
    }
    if (cls === 'O' || cls === 'B' || cls === 'A' || cls === 'F' || cls === 'G' || cls === 'K' || cls === 'M') {
        type = type.slice(1);
        if (type.startsWith('N')) {
            type = type.slice(1);
        }
        let num: number;
        let rest: string;
        let parsed = parseFloat(type);
        if (Number.isNaN(parsed)) {
            num = 5;
            rest = type;
        } else {
            num = round(parsed) as Subclass | 10;
            if (num === 10) {
                if (cls === 'M') {
                    num = 9;
                } else {
                    cls = ({'O': 'B', 'B': 'A', 'A': 'F', 'F': 'G', 'G': 'K', 'K': 'M'})[cls];
                    num = 0;
                }
            }
            rest = type.slice(num.toString().length);
        }
        let value = SPECTRAL_TYPE_COLORS[cls as MainClass];
        let numeralMap = value?.[num as Subclass];
        if (numeralMap) {
            while (rest[0] !== 'I' && rest[0] !== 'V' && rest.length > 0) {
                rest = rest.slice(1);
            }
            if (rest.length === 0 && numeralMap['V']) {
                return numeralMap['V'];
            } else {
                let numeral: Numeral | null = null;
                if (rest[0] === 'I') {
                    if (rest[1] === 'I') {
                        if (rest[2] === 'I') {
                            numeral = 'III';
                        } else {
                            numeral = 'II';
                        }
                    } else if (rest[1] === 'V') {
                        numeral = 'IV';
                    } else {
                        numeral = 'I';
                    }
                } else if (rest[0] === 'V') {
                    numeral = 'V';
                }
                if (numeral && numeralMap[numeral]) {
                    return numeralMap[numeral] as Color;
                }
            }
        }
    } else if (cls === 'W' && (type[1] === 'N' || type[1] === 'C')) {
        let num = parseInt(type[2]) as Subclass;
        if (Number.isNaN(num)) {
            num = 5;
        }
        let value = SPECTRAL_TYPE_COLORS[(cls + type[1]) as 'WN' | 'WC'];
        if (value) {
            let out = value[num];
            if (out) {
                return out;
            }
        }
    } else if (type.startsWith('SN')) {
        return [0xa9, 0xc4, 0xff];
    } else if (cls === 'S' || cls === 'N' || cls === 'R' || cls === 'D') {
        let num = parseInt(type[1]) as Subclass;
        if (Number.isNaN(num)) {
            num = 5;
        }
        let value = SPECTRAL_TYPE_COLORS[cls];
        if (value) {
            let out = value[num];
            if (out) {
                return out;
            }
        }
    } else if (cls === 'C' && SPECTRAL_TYPE_COLORS['C']) {
        return SPECTRAL_TYPE_COLORS['C'];
    }
    missingTypes.add(originalType);
    return null;
}


const GENITIVE_LOOKUP = Object.fromEntries(Object.values(CONSTELLATIONS).map(value => [value[1], value[0]]));

const STAR_NAMES = new Map(fs.readFileSync('data/star_names.csv').toString().split('\n').map(row => row.split(';')).map(row => [row[2] + ' ' + GENITIVE_LOOKUP[row[3]], row[0]]));

function getName(name: string): string {
    while (name.includes('  ')) {
        name = name.replaceAll('  ', ' ');
    }
    if (name.startsWith('NAME')) {
        return name.slice(5);
    } else if (name.startsWith('*')) {
        let data = name.slice(2).split(' ');
        let cnst = GENITIVE_LOOKUP[data[1]];
        let letter = data[0].slice(0, 3);
        let out = letter in GREEK_LETTERS ? GREEK_LETTERS[letter] : data[0];
        out += ' ' + cnst + (data[2] ? ' ' + data[2] : '');
        if (STAR_NAMES.has(out) && !data[2]) {
            return STAR_NAMES.get(out) + ' (' + out + ')';
        }
        return out;
    } else {
        return name;
    }
}

let license = fs.readFileSync('data/objects.json.LICENSE.txt').toString();

let rawData = JSON.parse(fs.readFileSync('data/objects.json').toString()) as [number, string, string, number, number, number, number, number, number, string | null, string | null, number][];

const encoder = new TextEncoder();
const encode: TextEncoder['encode'] = encoder.encode.bind(encoder);

let out: ArrayBuffer[] = [];
for (let data of rawData) {
    if (data[9] === null) {
        continue;
    }
    let color = getSpectralTypeColor(data[9]);
    if (color === null) {
        continue;
    }
    let name = encode(getName(data[1]));
    let buffer = new ArrayBuffer(36 + name.length);
    let view = new DataView(buffer);
    view.setUint32(0, data[0]);
    view.setFloat32(4, data[3]);
    view.setFloat32(8, data[4]);
    view.setFloat32(12, data[5]);
    view.setFloat32(16, data[6]);
    view.setFloat32(20, data[7]);
    view.setFloat32(24, PARSEC / data[8]);
    view.setFloat32(28, data[11]);
    view.setUint8(32, color[0]);
    view.setUint8(33, color[1]);
    view.setUint8(34, color[2]);
    view.setUint8(35, name.length);
    for (let i = 0; i < name.length; i++) {
        view.setUint8(36 + i, name[i]);
    }
    out.push(buffer);
}

let view = new DataView(new ArrayBuffer(out.reduce((x, y) => x + y.byteLength, 0) + 5 + license.length));

for (let i = 0; i < license.length; i++) {
    view.setUint8(i, license.charCodeAt(i));
}

view.setUint8(license.length, 0);
view.setUint32(license.length + 1, out.length);

let index = license.length + 5;
for (let buffer of out) {
    for (let byte of new Uint8Array(buffer)) {
        view.setUint8(index++, byte);
    }
}

fs.writeFileSync('dist/objects', view);

if (missingTypes.size > 0) {
    console.log(missingTypes.size, 'missing spectral types', Array.from(missingTypes));
}
