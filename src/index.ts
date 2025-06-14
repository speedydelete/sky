
import {Color, PI, max, min, round, sin, cos, acos, atan2, query, format, normalizeAngle, normalizeDec, abs} from './util.js';


interface Obj {
    id: number;
    name: string;
    ra: number;
    dec: number;
    pmRa: number;
    pmDec: number;
    rvel: number;
    dist: number;
    mag: number;
    color: Color;
}


let buffer = await (await fetch('objects')).arrayBuffer();
let objects: Obj[] = [];
let view = new DataView(buffer);
let index = 0;
while (view.getUint8(index) !== 0) {
    index++;
}
let length = view.getUint32(++index);
index += 4;
while (objects.length < length) {
    let id = view.getUint32(index);
    let ra = view.getFloat32(index + 4);
    let dec = view.getFloat32(index + 8);
    let pmRa = view.getFloat32(index + 12);
    let pmDec = view.getFloat32(index + 16);
    let rvel = view.getFloat32(index + 20);
    let dist = view.getFloat32(index + 24);
    let mag = view.getFloat32(index + 28);
    let r = view.getUint8(index + 32);
    let g = view.getUint8(index + 33);
    let b = view.getUint8(index + 34);
    let length = view.getUint8(index + 35);
    let name = '';
    index += 36;
    for (let i = 0; i < length; i++) {
        name += String.fromCharCode(view.getUint8(index++));
    }
    objects.push({id, name, ra, dec, pmRa, pmDec, rvel, dist, mag, color: [r, g, b]});
}


let width = window.innerWidth;
let height = window.innerHeight;

let cRa = 0;
let cDec = 0;
let zoom = 1;


let canvas = query<HTMLCanvasElement>('#main');
canvas.width = width;
canvas.height = height;
let ctx = canvas.getContext('2d') as CanvasRenderingContext2D;


function render(): void {
    if (inInfo) {
        requestAnimationFrame(render);
        return;
    }
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let scale = height * zoom / 360;
    let refMag = 1;
    let maxLum = 10**(-0.4 * refMag);
    let maxObjs = min(objects.length, round(zoom**2 * 1000));
    for (let i = 0; i < maxObjs; i++) {
        let {ra, dec, mag, color: [r, g, b]} = objects[i];
        let rho = acos((sin(cDec)*sin(dec) + cos(cDec)*cos(dec)*cos(ra - cRa)));
        let theta = atan2(cos(dec)*sin(ra - cRa), cos(cDec)*sin(dec) - sin(cDec)*cos(dec)*cos(ra - cRa));
        let x = rho * sin(theta) * scale + width/2;
        let y = -rho * cos(theta) * scale + height/2;
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
    query('#ra').textContent = `${format(cRa / 15, 0, 2)}:${format(cRa * 4 % 60, 0, 2)}:${format(cRa * 240 % 60, 0, 2)}`;
    query('#dec').textContent = format(cDec, 3);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});


let inInfo = false;

window.addEventListener('wheel', event => {
    if (inInfo) {
        return;
    }
    zoom -= zoom / 1000 * event.deltaY;
    if (zoom < 1) {
        zoom = 1;
    }
})

window.addEventListener('keydown', event => {
    if (inInfo) {
        return;
    } else if (event.key === 'w') {
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


let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartRa = 0;
let dragStartDec = 0;

canvas.addEventListener('mousedown', event => {
    if (inInfo) {
        return;
    }
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartRa = cRa;
    dragStartDec = cDec;
});

canvas.addEventListener('mousemove', event => {
    if (!isDragging) {
        return;
    }
    let raDelta = -(event.clientX - dragStartX) / width * 720 / zoom;
    let decDelta = (event.clientY - dragStartY) / height * 360 / zoom;
    cRa = normalizeAngle(dragStartRa + raDelta);
    cDec = normalizeDec(dragStartDec + decDelta);
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);


let infoButton = query('#info-button');
let info = query('#info');
infoButton.addEventListener('click', () => {
    if (inInfo) {
        inInfo = false;
        infoButton.textContent = 'Info';
        info.style.display = 'none';
    } else {
        inInfo = true;
        isDragging = false;
        infoButton.textContent = 'Back';
        info.style.display = 'flex';
    }
});
