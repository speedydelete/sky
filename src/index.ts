
import {PI, query, max, min, round, sin, cos, acos, atan2, Color} from './util.js';


interface Obj {
    id: number;
    name: string;
    type: string;
    ra: number;
    dec: number;
    pmRa: number;
    pmDec: number;
    rvel: number;
    dist: number;
    mag: number;
    color: Color;
}

function getString(view: DataView, index: number): [string, number] {
    let length = view.getUint8(index++);
    let out = '';
    for (let i = 0; i < length; i++) {
        out += String.fromCharCode(index++);
    }
    return [out, index];
}

let objects: Obj[] = [];

let view = new DataView(await (await fetch('objects')).arrayBuffer());

for (let index = 0; index < view.byteLength - 10 && objects.length < 99000;) {
    let id = view.getUint32(index);
    index += 4;
    let name: string;
    [name, index] = getString(view, index);
    let type: string;
    [type, index] = getString(view, index);
    let ra = view.getFloat32(index);
    index += 4;
    let dec = view.getFloat32(index);
    index += 4;
    let pmRa = view.getFloat32(index);
    index += 4;
    let pmDec = view.getFloat32(index);
    index += 4;
    let rvel = view.getFloat32(index);
    index += 4;
    let dist = view.getFloat32(index);
    index += 4;
    let mag = view.getFloat32(index);
    index += 4;
    let r = view.getUint8(index++);
    let g = view.getUint8(index++);
    let b = view.getUint8(index++);
    objects.push({id, name, type, ra, dec, pmRa, pmDec, rvel, dist, mag, color: [r, g, b]});
}


let width = window.innerWidth;
let height = window.innerHeight;

let cRa = 0;
let cDec = 0;
let zoom = 3;


let canvas = query<HTMLCanvasElement>('#main');
canvas.width = width;
canvas.height = height;
let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;


function render(): void {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let scaleWidth = width * zoom / 360;
    let scaleHeight = height * zoom / 360;
    let refMag = 1;
    let maxLum = 10**(-0.4 * refMag);
    for (let {ra, dec, mag, color: [r, g, b]} of objects.slice(0, min(objects.length, round(10000 * zoom)))) {
        let rho = acos((sin(cDec)*sin(dec) + cos(cDec)*cos(dec)*cos(ra - cRa)));
        let theta = atan2(cos(dec)*sin(ra - cRa), cos(cDec)*sin(dec) - sin(cDec)*cos(dec)*cos(ra - cRa));
        let x = rho * sin(theta) * scaleWidth + width/2;
        let y = -rho * cos(theta) * scaleHeight + height/2;
        if (x < 0 || x > width || y < 0 || y > height) {
            continue;
        }
        let lum = 10**(-0.4 * (mag - refMag)) / maxLum * zoom;
        let alpha = max(0.05, min(1, lum * 1.1));
        let radius = min(6, lum * 4);
        let grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grd.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, 2 * PI);
        ctx.fill();
    }
    requestAnimationFrame(render);
}

requestAnimationFrame(render);


window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
})


window.addEventListener('wheel', event => {
    zoom -= zoom / 1000 * event.deltaY;
    if (zoom < 1) {
        zoom = 1;
    }
})

window.addEventListener('keydown', event => {
    if (event.key === 'w') {
        cDec += 2 / zoom;
        if (cDec > 90) {
            cDec = 90;
        }
    } else if (event.key === 's') {
        cDec -= 2 / zoom;
        if (cDec < -90) {
            cDec = -90;
        }
    } else if (event.key === 'a') {
        cRa -= 2 / zoom;
        cRa %= 360;
    } else if (event.key === 'd') {
        cRa += 2 / zoom;
        cRa %= 360;
    } else if (event.key === 'ArrowUp') {
        cDec += 5 / zoom;
        if (cDec > 90) {
            cDec = 90;
        }
    } else if (event.key === 'ArrowDown') {
        cDec -= 5 / zoom;
        if (cDec < -90) {
            cDec = -90;
        }
    } else if (event.key === 'ArrowLeft') {
        cRa -= 5 / zoom;
        cRa %= 360;
    } else if (event.key === 'ArrowRight') {
        cRa += 5 / zoom;
        cRa %= 360;
    }
});
