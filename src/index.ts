
import {PI, query, max, min, round, sqrt, trunc, sin, cos, asin, acos, atan2, normalizeAngle, normalizeDec} from './util.js';


let width = window.innerWidth * devicePixelRatio;
let height = window.innerHeight * devicePixelRatio;

let cRa = 90;
let cDec = 0;
let zoom = 4;

let limit = 8;


let canvas = query<HTMLCanvasElement>('#main');
canvas.width = width;
canvas.height = height;
let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
ctx.scale(devicePixelRatio, devicePixelRatio);


const SCALING = -0.35;


function render(): void {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let scaleWidth = width * zoom / 360;
    let scaleHeight = height * zoom / 360;
    let refMag = 0;
    let maxLum = 10**(SCALING * refMag);
    // @ts-ignore
    for (let {ra, dec, mag, color} of OBJECTS) {
        let rho = acos((sin(cDec)*sin(dec) + cos(cDec)*cos(dec)*cos(ra - cRa)));
        let theta = atan2(cos(dec)*sin(ra - cRa), cos(cDec)*sin(dec) - sin(cDec)*cos(dec)*cos(ra - cRa));
        let x = rho * sin(theta) * scaleWidth + width/2;
        let y = -rho * cos(theta) * scaleHeight + height/2;
        if (x < 0 || x > width || y < 0 || y > height) {
            continue;
        }
        let lum = 10**(SCALING * (mag - refMag)) / maxLum * zoom;
        let alpha = max(0.05, min(1, lum * 1.2));
        let radius = max(0.5, min(4, lum * 4));
        let [r, g, b] = color.map(c => round(c**(1 / 2.2) * 255));
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

function getCoordsOfPos(x: number, y: number): [number, number] {
    x = (x - width / 2) / (width * zoom / 360);
    y = (y - height / 2) / (height * zoom / 360);
    let rho = sqrt(x**2 + y**2);
    let theta = atan2(y, x);
    return [
        cRa + atan2(sin(rho)*sin(theta), cos(cDec)*cos(rho) - sin(cDec)*sin(rho)*cos(theta)),
        asin(sin(cDec)*cos(rho) + cos(cDec)*sin(rho)*cos(theta)),
    ];
}


let mouseDown = false;

let prevMouseRa = 0;
let prevMouseDec = 0;

function updateMouseRaDec(x: number, y: number) {
    // let [ra, dec] = getCoordsOfPos(x, y);
    // cRa = normalizeAngle(cRa + (ra - prevMouseRa) / 360);
    // cDec = normalizeDec(cDec + dec - prevMouseDec);
    // prevMouseRa = ra;
    // prevMouseDec = dec;
}

window.addEventListener('mousedown', event => {
    mouseDown = true;
    [prevMouseRa, prevMouseDec] = getCoordsOfPos(event.clientX, event.clientY);
});

window.addEventListener('mousemove', event => {
    if (mouseDown) {
        updateMouseRaDec(event.clientX, event.clientY);
    }
});

window.addEventListener('mouseup', event => {
    mouseDown = false;
    updateMouseRaDec(event.clientX, event.clientY);
});

window.addEventListener('mouseout', () => mouseDown = false);
