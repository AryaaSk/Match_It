//setting up canvases
//canvas 1
const canvas1 = new Canvas();
canvas1.linkCanvas("canvas1");
const canvasElement1: HTMLCanvasElement = canvas1.canvas;

let mouseDown1 = false;
canvasElement1.onmousedown = () => {
    mouseDown1 = true;
}
canvasElement1.onmouseup = () => {
    mouseDown1 = false;
}
canvasElement1.onmousemove = ($e: MouseEvent) => {
    if (mouseDown1 == false) {
        return;
    }
    const [offsetX, offsetY] = [$e.offsetX, $e.offsetY];
    const [x, y] = [canvas1.GridX(offsetX), canvas1.GridY(offsetY)];
    canvas1.plotPoint([x, y], "black");
}
const clearButton1 = document.getElementById("clearButton1")!;
clearButton1.onclick = () => {
    canvas1.clearCanvas();
}

// load reference onto canvas1
const img = new Image();
img.src = "/Src/References/Circle.png";
img.onload = () => {
    canvas1.c.drawImage(img, 0, 0, canvas1.canvasWidth, canvas1.canvasHeight);
}




//canvas 2
const canvas2 = new Canvas();
canvas2.linkCanvas("canvas2");

const canvasElement2: HTMLCanvasElement = canvas2.canvas;

let mouseDown2 = false;
canvasElement2.onmousedown = () => {
    mouseDown2 = true;
}
canvasElement2.onmouseup = () => {
    mouseDown2 = false;
}
canvasElement2.onmousemove = ($e: MouseEvent) => {
    if (mouseDown2 == false) {
        return;
    }
    const [offsetX, offsetY] = [$e.offsetX, $e.offsetY];
    const [x, y] = [canvas2.GridX(offsetX), canvas2.GridY(offsetY)];
    canvas2.plotPoint([x, y], "black");
}
const clearButton2 = document.getElementById("clearButton2")!;
clearButton2.onclick = () => {
    canvas2.clearCanvas();
}



//canvas3
const canvas3 = new Canvas();
canvas3.linkCanvas("canvas3");






//Comparing images
const compareButton = document.getElementById("compare")!;
compareButton.onclick = () => {
    const canvas1Raw = SimplifyRawImage(Array.from(canvas1.c.getImageData(0, 0, canvas1.canvasWidth, canvas1.canvasHeight).data), 300*dpi);
    const canvas2Raw = SimplifyRawImage(Array.from(canvas2.c.getImageData(0, 0, canvas2.canvasWidth, canvas2.canvasHeight).data), 300*dpi);

    //save canvas1data on 1x
    //const canvas1RawJSON = JSON.stringify(canvas2Raw);
    //localStorage.setItem("canvas1Raw3x", canvas1RawJSON);

    //canvas1Raw seems to change between 1x and 3x DPI

    //PlotBitmapOnCanvas3(canvas3xRaw, 300, "#0000ff30")
    //PlotBitmapOnCanvas3(canvas1xRaw, 300, "#ff000030")
    //PlotBitmapOnCanvas3(differentPixels, 300, "#0000ff30")
    //console.log(canvas1x.length, canvas3x.length);

    //console.log(CalculateSimilarity(canvas1Raw, canvas1xRaw));

    /*
    //save canvas2 image data to local storage
    const dataURL = canvas2.canvas.toDataURL();
    localStorage.setItem("canvasData", dataURL);
    //expect similarity = 28 at dx = 69, dy = 60
    */

    //1x DPI results: Maximum similarity: 35.01989592898684 at dx = 71 dy = 60
    //2x DPI results: Maximum similarity: 36.145502645502646 at dx = 68 dy = 56
    //3x DPI results: Maximum similarity: 35.01989592898684 at dx = 71 dy = 60
    
    //using circle reference and this code to retrieve sample user image
    /*
    //load image to usercanvas
    const dataURL = localStorage.getItem("canvasData");
    const img2 = new Image();
    img2.src = dataURL!;
    img2.onload = () => {
        canvas2.c.clearRect(0, 0, canvas2.canvasWidth, canvas2.canvasHeight);
        canvas2.c.drawImage(img2, 0, 0, 300*dpi, 300*dpi);
    }
    */

    CompareImages(canvas1Raw, canvas2Raw, 300, 300);
}




const PlotBitmapOnCanvas3 = (image: number[], width: number, colour: string) => {
    for (let i = 0; i < image.length; i += 1) {
        if (image[i] == 0) {
            continue;
        }

        const x = i % width;
        const y = Math.floor(i / width);
        canvas3.plotPoint([canvas3.GridX(x), canvas3.GridY(y)], colour, undefined, undefined, 1);
    }
}