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
    CompareImages(canvas1Raw, canvas2Raw, 300, 300);
}


const SimplifyRawImage = (rawData: number[], width: number) => {
    //we can now use this downscaled data
    const alphaValuesOnly = rawData.filter((val, index) => index % 4 == 3); //take 3rd element from every group of 4
    
    //will iterate through the alpha values, and skip every DPI elements.
    //to filter rows, we will only take rows such that row index % DPI == 0
    const downscaledRawData: number[] = [];
    for (let i = 0; i < alphaValuesOnly.length; i += dpi) {
        const row = Math.floor(i / width);
        if (row % dpi != 0) {
            continue; //skip all rows which aren't multiples of the DPI
        }
        downscaledRawData.push(alphaValuesOnly[i]);
    }

    const divdedBy255 = downscaledRawData.map((value) => value / 255); //array will only contain 0 or 255, so 'normalise' to 0 and 1
    return divdedBy255;
}

//offsetX and offsetY have domain [-canvasWidth/2 or -canvasHeight/2, canvasWidth/2 or canvasHeight/2]
const OffsetImage = (image: number[], width: number, height: number, offsetX: number, offsetY: number) => {
    //iterate through image array; for each element, determine it's new position and place in new image
    const offsetImage: number[] = Array(image.length).fill(0);
    for (let i = 0; i != image.length; i += 1) {
        const x = i % width; //use mod operator to determine position in row
        const y = Math.floor(i / width); //integer divison to determine y-coordinate

        const newX = x + offsetX;
        const newY = y + offsetY;

        //determine whether newX and newY are within the bounds of the image
        if (newX < 0 || newY < 0 || newX >= width || newY >= height) {
            continue; //skip pixel if out of bounds
        }

        //otherwise insert element into new position
        const newFlatPosition = newY * width + newX;
        offsetImage[newFlatPosition] = image[i];
    }

    return offsetImage;
}

let O_X = 0;
let O_Y = 0;
document.body.onkeydown = ($e: KeyboardEvent) => {
    const key = $e.key.toLowerCase();
    if (key == "a") {
        O_X -= 1;
    }
    else if (key == "d") {
        O_X += 1;
    }
    else if (key == "w") {
        O_Y -= 1;        
    }
    else if (key == "s") {
        O_Y += 1;
    }
}


//images are bitmap arrays (e.g [1, 1, 1, 0, 0, 0])
const CompareImages = async (reference: number[], userDrawn: number[], width: number, height: number) => {
    /*
    let [maxSimilarity, maxSimilarityOffsetX, maxSimilarityOffsetY] = [0, 0, 0];

    const offsetBound = 15;
    
    const startTime = Date.now();

    for (let offsetX = -offsetBound; offsetX <= offsetBound; offsetX += 1) {
        for (let offsetY = -offsetBound; offsetY <= offsetBound; offsetY += 1) {
            const offsettedUserImage = OffsetImage(userDrawn, width, height, offsetX, offsetY);
            const similarity = GetSimilarity(reference, offsettedUserImage);

            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                maxSimilarityOffsetX = offsetX;
                maxSimilarityOffsetY = offsetY;
            }
        }   
    }

    const endTime = Date.now();

    console.log(maxSimilarity, maxSimilarityOffsetX, maxSimilarityOffsetY);
    console.log(`${(2*offsetBound)**2} positions took ${endTime - startTime} milliseconds`)
    */

    //const similarity = Similarity(reference, userDrawn, 300, 300, O_X, O_Y);
    //console.log(`O_X: ${O_X}, O_Y: ${O_Y}, Similarity: ${similarity}`);
    await FindMaximiumSimilarity(reference, userDrawn, 300, 300);
}



const DISPLAY_OVERLAY = (dx: number, dy: number) => {
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
            canvas1ImageData.data[i + 3] = 255;//also need to make pixel visible
        }
    }

    canvas3.c.putImageData(canvas1ImageData, 0, 0);
}

const PlotBitmapOnCanvas3 = (image: number[], width: number) => {
    for (let i = 0; i < image.length; i += 1) {
        if (image[i] == 0) {
            continue;
        }

        const x = i % width;
        const y = Math.floor(i / width);
        canvas3.plotPoint([canvas3.GridX(x), canvas3.GridY(y)], "black");
    }
}

//AI Generated code:
function offsetImageData(imageData: ImageData, dx: number, dy: number): ImageData {
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
                offsetData.data[destIndex] = imageData.data[srcIndex];         // R
                offsetData.data[destIndex + 1] = imageData.data[srcIndex + 1]; // G
                offsetData.data[destIndex + 2] = imageData.data[srcIndex + 2]; // B
                offsetData.data[destIndex + 3] = imageData.data[srcIndex + 3]; // A
            }
        }
    }

    return offsetData;
}