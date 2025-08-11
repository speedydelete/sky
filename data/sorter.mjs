
import {readFileSync, writeFileSync} from 'fs';

const GREEK_LETERS = 'εζηθικλμνξοπρστυφχψω';
const LETTERS = [].concat(
    Array.from('bcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
    ['RR', 'RS', 'RT', 'RU', 'RV', 'RW', 'RX', 'RY', 'RZ', 'SS', 'ST', 'SU', 'SV', 'SW', 'SX', 'SY', 'SZ', 'TT', 'TU', 'TV', 'TW', 'TX', 'TY', 'TZ', 'UU', 'UV', 'UW', 'UX', 'UY', 'UZ', 'VV', 'VW', 'VX', 'VY', 'VZ', 'WW', 'WX', 'WY', 'WZ', 'XX', 'XY', 'XZ', 'YY', 'YZ', 'ZZ'],
    Array.from('ABCDEFGHIKLMNOPQ').flatMap((x, i) => Array.from('ABCDEFGHIKLMNOPQRSTUVWYZ'.slice(i)).map(y => x + y)),
).map(x => new RegExp('^' + x + ' '));

let cs = Object.keys(JSON.parse(readFileSync('constellations.json').toString()));

let stars = readFileSync('objects.json.temp').toString().split('\n').slice(20, -2);

let out = Object.fromEntries(cs.map(x => [x, []]));
let other = [];

for (let star of stars) {
    if (star.startsWith('HD ')) {
        continue;
    }
    let found = false;
    for (let c of cs) {
        if (star.includes(c)) {
            out[c].push(star);
            found = true;
            break;
        }
    }
    if (!found) {
        other.push(star);
    }
}

function starOrder(x) {
    x = x.split(',')[0];
    for (let i = 0; i < GREEK_LETERS.length; i++) {
        if (x.includes(GREEK_LETERS[i])) {
            return i;
        }
    }
    for (let i = 0; i < LETTERS.length; i++) {
        if (x.match(LETTERS[i])) {
            return i + GREEK_LETERS.length;
        }
    }
    if (x.match(/^V\d+/)) {
        return LETTERS.length + GREEK_LETERS.length + parseInt(x.slice(1));
    }
    if (x.match(/^\d+/)) {
        return 100000 + parseInt(x);
    }
    return LETTERS.length + GREEK_LETERS.length;
}

writeFileSync('star.csv.temp', Object.values(out).map(x => x.sort((a, b) => starOrder(a) - starOrder(b)).join('\n') + '\n').join('\n'));
writeFileSync('other.csv.temp', other.sort().join('\n'));
