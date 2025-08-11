
import {readFileSync, writeFileSync} from 'fs';

const GREEK_LETERS = 'εζηθικλμνξοπρστυφχψω';
const LETTERS = Array.from('AbcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ').map(x => new RegExp('(?<![a-zA-Z])' + x + ' '));

let cs = Object.keys(JSON.parse(readFileSync('constellations.json').toString()));

let stars = readFileSync('objects.json.temp').toString().split('\n').slice(20, -2);

let hd = [];
let cs2 = Object.fromEntries(cs.map(x => [x, []]));
let other = [];

for (let star of stars) {
    if (star.startsWith('HD ')) {
        hd.push(star);
    } else {
        let found = false;
        for (let c of cs) {
            if (star.includes(c)) {
                cs2[c].push(star);
                found = true;
                break;
            }
        }
        if (!found) {
            other.push(star);
        }
    }
}

hd = hd.sort((x, y) => parseInt(x.slice(3)) - parseInt(y.slice(3)));

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
    return LETTERS.length + GREEK_LETERS.length;
}

writeFileSync('hd.csv', hd.join('\n'));
writeFileSync('star.csv.temp', [].concat(...Object.values(cs2).map(x => x.sort((a, b) => starOrder(a) - starOrder(b)))).join('\n'));
writeFileSync('other.csv.temp', other.join('\n'));
