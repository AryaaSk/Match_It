"use strict";
//setting up canvases
//canvas 1
const canvas1 = new Canvas();
canvas1.linkCanvas("canvas1");
const canvasElement1 = canvas1.canvas;
let mouseDown1 = false;
canvasElement1.onmousedown = () => {
    mouseDown1 = true;
};
canvasElement1.onmouseup = () => {
    mouseDown1 = false;
};
canvasElement1.onmousemove = ($e) => {
    if (mouseDown1 == false) {
        return;
    }
    const [offsetX, offsetY] = [$e.offsetX, $e.offsetY];
    const [x, y] = [canvas1.GridX(offsetX), canvas1.GridY(offsetY)];
    canvas1.plotPoint([x, y], "black");
};
const clearButton1 = document.getElementById("clearButton1");
clearButton1.onclick = () => {
    canvas1.clearCanvas();
};
// load reference onto canvas1
const img = new Image();
img.src = "/Src/References/Circle.png";
img.onload = () => {
    canvas1.c.drawImage(img, 0, 0, canvas1.canvasWidth, canvas1.canvasHeight);
};
//canvas 2
const canvas2 = new Canvas();
canvas2.linkCanvas("canvas2");
const canvasElement2 = canvas2.canvas;
let mouseDown2 = false;
canvasElement2.onmousedown = () => {
    mouseDown2 = true;
};
canvasElement2.onmouseup = () => {
    mouseDown2 = false;
};
canvasElement2.onmousemove = ($e) => {
    if (mouseDown2 == false) {
        return;
    }
    const [offsetX, offsetY] = [$e.offsetX, $e.offsetY];
    const [x, y] = [canvas2.GridX(offsetX), canvas2.GridY(offsetY)];
    canvas2.plotPoint([x, y], "black");
};
const clearButton2 = document.getElementById("clearButton2");
clearButton2.onclick = () => {
    canvas2.clearCanvas();
};
//canvas3
const canvas3 = new Canvas();
canvas3.linkCanvas("canvas3");
//Comparing images
const compareButton = document.getElementById("compare");
compareButton.onclick = () => {
    const canvas1Raw = SimplifyRawImage(Array.from(canvas1.c.getImageData(0, 0, canvas1.canvasWidth, canvas1.canvasHeight).data), 300 * dpi);
    const canvas2Raw = SimplifyRawImage(Array.from(canvas2.c.getImageData(0, 0, canvas2.canvasWidth, canvas2.canvasHeight).data), 300 * dpi);
    CompareImages(canvas1Raw, canvas2Raw, 300, 300);
};
const DISPLAY_OVERLAY = (dx, dy) => {
    canvas3.clearCanvas();
    //merge canvas1 and canvas2 data
    const canvas1ImageData = canvas1.c.getImageData(0, 0, canvas1.canvasWidth, canvas1.canvasHeight);
    const canvas2ImageData = offsetImageData(canvas2.c.getImageData(0, 0, canvas2.canvasWidth, canvas2.canvasHeight), dx, dy);
    for (let i = 0; i < canvas1ImageData.data.length; i += 4) {
        if (canvas1ImageData.data[i + 3] == 0 && canvas2ImageData.data[i + 3] == 0) {
            continue; //ignore transparent pixels
        }
        //if there is no overlap with canvas2, then leave pixel black
        //if there is overlap with canvas2, then make pixel green
        if (canvas1ImageData.data[i + 3] == 255 && canvas2ImageData.data[i + 3] == 255) {
            canvas1ImageData.data[i + 1] = 255;
        }
        //if just a canvas2 pixel is black, make pixel red
        if (canvas1ImageData.data[i + 3] == 0 && canvas2ImageData.data[i + 3] == 255) {
            canvas1ImageData.data[i] = 255;
            canvas1ImageData.data[i + 3] = 255; //also need to make pixel visible
        }
    }
    canvas3.c.putImageData(canvas1ImageData, 0, 0);
};
const PlotBitmapOnCanvas3 = (image, width) => {
    for (let i = 0; i < image.length; i += 1) {
        if (image[i] == 0) {
            continue;
        }
        const x = i % width;
        const y = Math.floor(i / width);
        canvas3.plotPoint([canvas3.GridX(x), canvas3.GridY(y)], "black");
    }
};
//AI Generated code:
function offsetImageData(imageData, dx, dy) {
    const { width, height } = imageData;
    const offsetData = new ImageData(width, height); // Create a new ImageData object
    // Loop through the pixels of the original image
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Calculate the source coordinates
            const srcX = x - dx;
            const srcY = y - dy;
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                // Source index in the original image
                const srcIndex = (srcY * width + srcX) * 4;
                // Destination index in the new image
                const destIndex = (y * width + x) * 4;
                // Copy RGBA values
                offsetData.data[destIndex] = imageData.data[srcIndex]; // R
                offsetData.data[destIndex + 1] = imageData.data[srcIndex + 1]; // G
                offsetData.data[destIndex + 2] = imageData.data[srcIndex + 2]; // B
                offsetData.data[destIndex + 3] = imageData.data[srcIndex + 3]; // A
            }
        }
    }
    return offsetData;
}
