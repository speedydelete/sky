
import {join} from 'node:path';
import * as fs from 'node:fs';
import OBJECT_DATA from './data/objects.json' with {type: 'json'};
import SPECTRAL_TYPE_DATA from './data/spectral_type_colors.json' with {type: 'json'};
import {PARSEC, round, Color} from './util.js';


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


function setString(view: DataView, index: number, str: string): number {
    view.setUint8(index++, str.length);
    for (let i = 0; i < str.length; i++) {
        view.setUint8(index++, str.length);
    }
    return index;
}


let missingTypes = new Set<string>();

let rawData = (OBJECT_DATA as unknown as {data: [number, string, string, number, number, number, number, number, number, string | null, string | null, number][]}).data;

let out = new ArrayBuffer(rawData.length * 35 + rawData.map(data => 2 + data[1].length + data[2].length).reduce((x, y) => x + y));
let view = new DataView(out);
let index = 0;

for (let data of rawData) {
    let type = data[9];
    if (type === null) {
        continue;
    }
    let color: Color;
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
            rest = type.slice(1 + num.toString().length);
        }
        let value = SPECTRAL_TYPE_COLORS[cls as MainClass];
        let numeralMap = value?.[num];
        if (numeralMap) {
            while (rest[0] !== 'I' && rest[0] !== 'V' && rest.length > 0) {
                rest = rest.slice(1);
            }
            if (rest.length === 0 && numeralMap['V']) {
                color = numeralMap['V'];
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
                    color = numeralMap[numeral] as Color;
                } else {
                    missingTypes.add(originalType);
                    continue;
                }
            }
        } else {
            missingTypes.add(originalType);
            continue;
        }
    } else if (cls === 'W' && (type[1] === 'N' || type[1] === 'C')) {
        let num = parseInt(type[2]) as Subclass;
        if (Number.isNaN(num)) {
            num = 5;
        }
        let value = SPECTRAL_TYPE_COLORS[(cls + type[1]) as 'WN' | 'WC'];
        if (value && value[num]) {
            color = value[num];
        } else {
            missingTypes.add(originalType);
            continue;
        }
    } else if (type.startsWith('SN')) {
        color = [0xa9, 0xc4, 0xff];
    } else if (cls === 'S' || cls === 'N' || cls === 'R' || cls === 'D') {
        let num = parseInt(type[1]) as Subclass;
        if (Number.isNaN(num)) {
            num = 5;
        }
        let value = SPECTRAL_TYPE_COLORS[cls];
        if (value && value[num]) {
            color = value[num];
        } else {
            missingTypes.add(originalType);
            continue;
        }
    } else if (cls === 'C' && SPECTRAL_TYPE_COLORS['C']) {
        color = SPECTRAL_TYPE_COLORS['C'];
    } else {
        missingTypes.add(originalType);
        continue;
    }
    view.setUint32(index, data[0]);
    index = setString(view, index + 4, data[1]);
    index = setString(view, index, data[2]);
    for (let i = 3; i < 8; i++) {
        view.setFloat32(index, data[i as 3 | 4 | 5 | 6 | 7]);
        index += 4;
    }
    view.setFloat32(index, PARSEC / data[8]);
    view.setFloat32(index, data[11]);
    index += 4;
    view.setUint8(index++, color[0]);
    view.setUint8(index++, color[1]);
    view.setUint8(index++, color[2]);
}

fs.writeFileSync(join(import.meta.dirname, 'data/objects'), view);

if (missingTypes.size > 0) {
    console.log(missingTypes.size, 'missing spectral types', Array.from(missingTypes));
}
