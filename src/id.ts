
declare global {
    interface ReadonlyArray<T> {
        includes(searchElement: any, fromIndex?: number): searchElement is T;
    }
}

export const CAPITAL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] as const;
export const ALL_CAPITAL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] as const;
export type CapitalLetter = (typeof CAPITAL_LETTERS)[number];
export type AllCapitalLetter = (typeof ALL_CAPITAL_LETTERS)[number];

export const CONSTELLATIONS = (await import('../data/constellations.json')).default;
export type Constellation = keyof typeof CONSTELLATIONS;

export const BAYER_LETTERS = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'] as const;
export type BayerLetter = (typeof BAYER_LETTERS)[number];

const R_TO_Z = Array.from('RSTUVWXYZ');
const DVL_START = Array.from('ABCDEFGHIKLMNOPQ');
const DVL_END = Array.from('ABCDEFGHIKLMNOPQRSTUVWXYZ');
export const VARIABLE_LETTERS = ([] as string[]).concat(
    R_TO_Z,
    R_TO_Z.flatMap(x => R_TO_Z.filter(y => y >= x).map(y => x + y)),
    DVL_START.flatMap(x => DVL_END.filter(y => y >= x).map(y => x + y)),
);
export type VariableLetter = 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z' | `${CapitalLetter}${CapitalLetter}` | `V${number}`;

export interface ParsedStarID {
    type: 'star';
    cs: Constellation;
    id: BayerLetter | VariableLetter | `${number}`;
    power: number;
    letter: AllCapitalLetter;
}

export const CATALOGS = ['HD'] as const;
export type Catalog = (typeof CATALOGS)[number];

export interface ParsedCatalogID {
    type: 'catalog';
    catalog: Catalog;
    number: number;
}

export const HALF_MONTHS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'] as const;
export type HalfMonth = (typeof HALF_MONTHS)[number];

export type MinorPlanetNumber = CapitalLetter | `${CapitalLetter}${number}`;

export interface ParsedMinorPlanetID {
    type: 'mp';
    year: number;
    halfMonth: HalfMonth;
    number: MinorPlanetNumber;
}

export interface ParsedNamedMinorPlanetID {
    type: 'nmp';
    number: number;
    name: string;
}

const COMET_PREFIXES = ['p', 'c', 'd', 'x', 'i'] as const;
export type CometPrefix = (typeof COMET_PREFIXES)[keyof typeof COMET_PREFIXES];

export interface ParsedCometID {
    type: CometPrefix;
    prefixNumber?: number;
    year: number;
    halfMonth: HalfMonth;
    number: number;
}

export interface ParsedNamedCometID {
    type: 'p' | 'i';
    number: number;
    name: string;
}

const PLANET_LETTERS = ['h', 'v', 'e', 'm', 'j', 's', 'u', 'n'] as const;
export type PlanetLetter = Capitalize<(typeof PLANET_LETTERS)[number]>;
export type SatelliteParent = PlanetLetter | number | ParsedMinorPlanetID;

export interface ParsedSatelliteID {
    type: 's';
    year: number;
    parent: SatelliteParent;
    number: number;
}

const SLASH_PREFIXES = 'pcdxis';

const SPECIALS = ['sun', 'moon', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'] as const;
export type Special = Capitalize<(typeof SPECIALS)[number]>;

export interface ParsedSpecialID {
    type: 'special';
    name: Special;
}

export interface ParsedNameID {
    type: 'name';
    name: string;
}

export type ParsedID = ParsedStarID | ParsedCatalogID | ParsedMinorPlanetID | ParsedNamedMinorPlanetID | ParsedCometID | ParsedNamedCometID | ParsedSatelliteID | ParsedSpecialID | ParsedNameID;

let logParsingErrors = true;
export function enableParsingErrorLogging(): void {
    logParsingErrors = true;
}
export function disableParsingErrorLogging(): void {
    logParsingErrors = false;
}
export function parsingErrorLoggingIsEnabled(): boolean {
    return logParsingErrors;
}
function log(msg: string): void {
    if (logParsingErrors) {
        console.log(msg);
    }
}

function parseSlashed(id: string, prefixNumber?: number): ParsedSatelliteID | ParsedCometID | ParsedNamedCometID | ParsedNameID | undefined {
    let type = id[0] as 'p' | 'c' | 'd' | 'x' | 'i' | 's';
    if (!SLASH_PREFIXES.includes(type)) {
        log(`parseSlashed failed (invalid prefix: '${type}')`);
        return;
    }
    if (prefixNumber && type !== 'p' && type !== 'i') {
        log(`parseSlashed failed (prefix number provided but prefix is not P or I)`);
        return;
    }
    let [stringYear, ...rest] = id.split(' ');
    let year = parseInt(stringYear);
    if (type === 's') {
        if (rest.length < 2) {
            log(`parseSlashed failed (expected 2+ spaces for prefix S, got ${rest.length}, original: '${id}')`);
            return;
        }
        let parentStr = rest.slice(0, -1).join(' ');
        let number = parseInt(rest[1]);
        let parent: SatelliteParent;
        if (PLANET_LETTERS.includes(parentStr)) {
            parent = parentStr.toUpperCase() as Uppercase<typeof parentStr>;
        } else {
            if (parentStr.startsWith('(') && parentStr.endsWith(')')) {
                parentStr = parentStr.slice(1, -1);
            }
            let number = parseInt(parentStr);
            if (!Number.isNaN(number)) {
                parent = number;
            } else {
                let parsed = parseID(parentStr);
                if (parsed.type === 'mp') {
                    parent = parsed;
                } else {
                    log(`parseSlashed failed (invalid satellite parent: ${parentStr})`);
                    return;
                }
            }
        }
        return {type, year, parent, number};
    } else {
        if (rest.length !== 1) {
            log(`parseSlashed failed (expected 1 space, got ${rest.length}, original: '${id}')`);
            return;
        }
        let halfMonth = rest[0][0];
        let number = parseInt(rest[0].slice(1));
        if (!HALF_MONTHS.includes(halfMonth) || Number.isNaN(number)) {
            return;
        }
        let out: ParsedCometID = {type, year, halfMonth, number};
        if (prefixNumber) {
            out.prefixNumber = prefixNumber;
        }
        return out;
    }
}

let genitives: {[key: string]: Constellation} | null = null;

function parseStar(parts: string[]): ParsedStarID | undefined {
    if (parts.length > 3) {
        return undefined;
    }
    let cs = parts[1] as Constellation;
    if (!(cs in CONSTELLATIONS)) {
        if (genitives === null) {
            genitives = Object.fromEntries(Object.entries(CONSTELLATIONS).map(x => [x[1][0], x[0] as Constellation]));
        }
        if (cs in genitives) {
            cs = genitives[cs];
        } else {
            log(`parseStar failed (invalid genitive: '${cs}')`);
            return;
        }
    }
    let letter: AllCapitalLetter = 'A';
    if (parts.length === 3) {
        if (ALL_CAPITAL_LETTERS.includes(parts[2])) {
            letter = parts[2];
        } else {
            return;
        }
    }
    let power = 1;
    let id: ParsedStarID['id'];
    let flamsteed = parseInt(parts[0]);
    if (!Number.isNaN(flamsteed)) {
        id = parts[0] as `${number}`;
    } else {
        let letter = parts[0];
        if (letter.includes('^')) {
            let parts = letter.split('^');
            if (parts.length !== 2) {
                log(`parseStar failed (expected less than 2 carets, got ${parts.length})`);
                return;
            }
            letter = parts[0];
            let parsed = parseInt(parts[1]);
            power = parsed;
        } else if ('0123456789'.includes(letter[1])) {
            power = parseInt(letter.slice(1));
            letter = letter[0];
        }
        if (BAYER_LETTERS.includes(letter)) {
            id = letter;
        } else if (VARIABLE_LETTERS.includes(letter)) {
            id = letter as VariableLetter;
        } else if (letter[0] === 'V' && !Number.isNaN(parseInt(letter.slice(1)))) {
            id = letter as VariableLetter;
        } else {
            log(`parseStar failed (invalid letter: ${letter})`);
            return;
        }
    }
    if (Number.isNaN(power)) {
        return;
    }
    return {type: 'star', cs, id, power, letter};
}

export function parseID(id: string): ParsedID {
    id = id.toLowerCase().trim();
    if (id === 'sun' || id === 'moon' || id === 'mercury' || id === 'venus' || id === 'earth' || id === 'mars' || id === 'jupiter' || id === 'saturn' || id === 'uranus' || id === 'neptune') {
        return {type: 'special', name: (id[0].toUpperCase() + id.slice(1)) as Special};
    } else if ('0123456789'.includes(id[0])) {
        let firstNum = parseInt(id);
        id = id.slice(firstNum.toString().length);
        if (id[1] === '/' && SLASH_PREFIXES.includes(id[0]) && id.includes(' ')) {
            let out = parseSlashed(id, firstNum);
            if (out) {
                return out;
            }
        } else if (id[0] === ' ') {
            if (HALF_MONTHS.includes(id[1]) && CAPITAL_LETTERS.includes(id[2]) && (id.length >= 3 ? !Number.isNaN(parseInt(id[3])) : true)) {
                let year = firstNum;
                let halfMonth = id[1];
                let number = id.slice(3) as MinorPlanetNumber;
                return {type: 'mp', year, halfMonth, number};
            }
        } else {
            let out = parseStar(id.split(' '));
            if (out) {
                return out;
            }
        }
    } else if (id[1] === '/' && SLASH_PREFIXES.includes(id[0]) && id.includes(' ')) {
        let out = parseSlashed(id);
        if (out) {
            return out;
        }
    } else {
        for (let catalog of CATALOGS) {
            if (id.startsWith(catalog)) {
                let number = parseInt(id.slice(catalog.length));
                if (!Number.isNaN(number)) {
                    return {type: 'catalog', catalog, number};
                }
            }
        }
        let parts = id.split(' ');
        if (parts.length > 1) {
            let out = parseStar(parts);
            if (out) {
                return out;
            }
        }
    }
    return {type: 'name', name: id};
}
