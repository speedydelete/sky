
export type Color = [number, number, number];


export function query<T extends HTMLElement>(query: string): T {
    let out = document.querySelector(query);
    if (!out) {
        throw new Error(`Missing query: '${query}'`);
    }
    return out as T;
}


export const {E, LN10, LN2, LOG10E, LOG2E, PI, SQRT1_2, SQRT2, abs, cbrt, ceil, clz32, exp, expm1, floor, fround, hypot, imul, log, log10, log1p, log2, max, min, pow, sign, sqrt} = globalThis.Math;
export const DTR = PI / 180;
export const sin = (x: number) => globalThis.Math.sin(x * DTR);
export const cos = (x: number) => globalThis.Math.cos(x * DTR);
export const tan = (x: number) => globalThis.Math.tan(x * DTR);
export const asin = (x: number) => globalThis.Math.asin(x) / DTR;
export const acos = (x: number) => globalThis.Math.acos(x) / DTR;
export const atan = (x: number) => globalThis.Math.atan(x) / DTR;
export const atan2 = (x: number, y: number) => globalThis.Math.atan2(x, y) / DTR;
export const random = (min: number = 0, max: number = 1) => globalThis.Math.random() * (max - min) + min;
export const round = (x: number, digits: number = 0) => globalThis.Math.round(x * 10**digits) / 10**digits;
export const trunc = (x: number, digits: number = 0) => globalThis.Math.trunc(x * 10**digits) / 10**digits;
export const sum = (...values: (number | number[])[]) => values.flat(1).reduce((x, y) => x + y);


export const C = 299792458;
export const H = 6.626070e-34;
export const HBAR = H / (2 * PI);
export const KB = 1.380649e-23;
export const G = 6.67430e-11;
export const LAMBDA = 1.089e-52;
export const SBC = (PI**2 * KB**4) / (60 * HBAR**3 * C**2);

export const AU = 149597870700;
export const LY = 9460730472580800;
export const PARSEC = 648000 * AU / PI;


export function toJD(time: number): number {
    return (time / 86400) + 2440587.5;
}

export function toUnix(jd: number): number {
    return (jd - 2440587.5) * 86400;
}

export const J2000_JD = 2451545.0;
export const J2000 = toUnix(J2000_JD);


export function normalizeAngle(angle: number): number {
    if (angle < 0) {
        return (angle % 360) + 360;
    } else {
        return angle % 360;
    }
}

export function normalizeDec(dec: number): number {
    if (dec > 90) {
        return 90;
    } else if (dec < -90) {
        return -90;
    } else {
        return dec;
    }
}


export class Coords {

    ra: number;
    dec: number;
    dist: number;

    constructor(ra: number, dec: number, dist: number = 0) {
        this.ra = normalizeAngle(ra);
        this.dec = normalizeDec(dec);
        this.dist = dist;
    }

    normalize() {
        this.ra = normalizeAngle(this.ra);
        this.dec %= 90;
    }
    
    toVector3(): Vector3 {
        return new Vector3(
            this.dist * sin(this.dec) * cos(this.ra),
            this.dist * sin(this.dec) * sin(this.ra),
            this.dist * cos(this.dec),
        );
    }

    relativeTo(other: Coords): Coords {
        return this.toVector3().add(other.toVector3()).toCoords();
    }

}


export class Vector3 {

    length: number = 3;

    x: number;
    y: number;
    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get [0](): number {
        return this.x;
    }

    get [1](): number {
        return this.y;
    }

    get [2](): number {
        return this.z;
    }

    set [0](value: number) {
        this.x = value;
    }

    set [1](value: number) {
        this.y = value;
    }

    set [2](value: number) {
        this.z = value;
    }

    toString(): string {
        return `${this.x}, ${this.y}, ${this.z}`;
    }

    [Symbol.iterator](): ArrayIterator<number> {
        return [this.x, this.y, this.z][Symbol.iterator]();
    }

    copy(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    set(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    setTo(other: Vector3): this {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        return this;
    }

    add(other: Vector3 | number): Vector3 {
        if (typeof other === 'number') {
            return new Vector3(this.x + other, this.y + other, this.z + other);
        } else {
            return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
        }
    }

    sub(other: Vector3 | number): Vector3 {
        if (typeof other === 'number') {
            return new Vector3(this.x - other, this.y - other, this.z - other);
        } else {
            return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
        }
    }

    mul(other: Vector3 | number): Vector3 {
        if (typeof other === 'number') {
            return new Vector3(this.x * other, this.y * other, this.z * other);
        } else {
            return new Vector3(this.x * other.x, this.y * other.y, this.z * other.z);
        }
    }

    div(other: Vector3 | number): Vector3 {
        if (typeof other === 'number') {
            return new Vector3(this.x / other, this.y / other, this.z / other);
        } else {
            return new Vector3(this.x / other.x, this.y / other.y, this.z / other.z);
        }
    }

    mod(other: Vector3 | number): Vector3 {
        if (typeof other === 'number') {
            return new Vector3(this.x % other, this.y % other, this.z % other);
        } else {
            return new Vector3(this.x % other.x, this.y % other.y, this.z % other.z);
        }
    }

    neg(): Vector3 {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    addMut(other: Vector3 | number): this {
        if (typeof other === 'number') {
            this.x += other;
            this.y += other;
            this.z += other;
        } else {
            this.x += other.x;
            this.y += other.y;
            this.z += other.z;
        }
        return this;
    }

    subMut(other: Vector3 | number): this {
        if (typeof other === 'number') {
            this.x -= other;
            this.y -= other;
            this.z -= other;
        } else {
            this.x -= other.x;
            this.y -= other.y;
            this.z -= other.z;
        }
        return this;
    }

    mulMut(other: Vector3 | number): this {
        if (typeof other === 'number') {
            this.x *= other;
            this.y *= other;
            this.z *= other;
        } else {
            this.x *= other.x;
            this.y *= other.y;
            this.z *= other.z;
        }
        return this;
    }

    divMut(other: Vector3 | number): this {
        if (typeof other === 'number') {
            this.x /= other;
            this.y /= other;
            this.z /= other;
        } else {
            this.x /= other.x;
            this.y /= other.y;
            this.z /= other.z;
        }
        return this;
    }

    modMut(other: Vector3 | number): this {
        if (typeof other === 'number') {
            this.x %= other;
            this.y %= other;
            this.z %= other;
        } else {
            this.x %= other.x;
            this.y %= other.y;
            this.z %= other.z;
        }
        return this;
    }

    negMut(): this {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    abs(): number {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    eq(other: Vector3): boolean {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }

    ne(other: Vector3): boolean {
        return this.x !== other.x || this.y !== other.y || this.z !== other.z;
    }

    lt(other: Vector3): boolean {
        return this.x < other.x && this.y < other.y && this.z < other.z;
    }

    le(other: Vector3): boolean {
        return this.x <= other.x && this.y <= other.y && this.z <= other.z;
    }

    gt(other: Vector3): boolean {
        return this.x > other.x && this.y > other.y && this.z > other.z;
    }

    ge(other: Vector3): boolean {
        return this.x >= other.x && this.y >= other.y && this.z >= other.z;
    }

    distanceTo(other: Vector3): number {
        return Math.sqrt((this.x - other.x)**2 + (this.y - other.y)**2 + (this.z - other.z)**2);
    }

    closestTo(...vectors: (Vector3 | Vector3[])[]): Vector3 {
        let vecs = vectors.flat();
        let minDist = this.distanceTo(vecs[0]);
        let out = vecs[0];
        for (let vec of vecs.slice(1)) {
            let dist = this.distanceTo(vec);
            if (dist < minDist) {
                minDist = dist;
                out = vec;
            }
        }
        return out;
    }

    clamp(other: Vector3): this {
        if (abs(this.x) > abs(other.x)) {
            this.x = sign(this.x) * other.x;
        }
        if (abs(this.y) > abs(other.y)) {
            this.y = sign(this.y) * other.y;
        }
        if (abs(this.z) > abs(other.z)) {
            this.z = sign(this.z) * other.z;
        }
        return this;
    }

    toCoords(): Coords {
        let dist = sqrt(this.x**2 + this.y**2 + this.z**2);
        return new Coords(acos(this.z / dist), atan2(this.y, this.x), dist);
    }

    cross(other: Vector3): Vector3 {
        return new Vector3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x,
        );
    }

    static fromRaDec(ra: number, dec: number): Vector3 {
        return new Vector3(sin(dec) * cos(ra), sin(dec) * sin(ra), cos(dec));
    }

    normalize(): this {
        let abs = this.abs();
        this.x /= abs;
        this.y /= abs;
        this.z /= abs;
        return this;
    }

    dot(other: Vector3): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

}
