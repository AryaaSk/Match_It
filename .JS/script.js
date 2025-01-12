"use strict";
const canvas = new Canvas();
canvas.linkCanvas("canvas");
const element = canvas.canvas;
let mouseDown = false;
element.onmousedown = () => {
    mouseDown = true;
};
element.onmouseup = () => {
    mouseDown = false;
};
element.onmousemove = ($e) => {
    if (mouseDown == false) {
        return;
    }
    const [offsetX, offsetY] = [$e.offsetX, $e.offsetY];
    const [x, y] = [canvas.GridX(offsetX), canvas.GridY(offsetY)];
    canvas.plotPoint([x, y], "black");
};
const clearButton = document.getElementById("clearButton");
clearButton.onclick = () => {
    canvas.clearCanvas();
};
