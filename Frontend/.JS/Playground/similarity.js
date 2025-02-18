"use strict";
//Warning: upto date code is found in Backend/functions/src/similarity.ts
const CANVAS_SIZE = 250;
const GetRescaledCanvasData = (canvas, scaleFactor) => {
    //e.g. input canvas may be 900x900, and if scale factor is 1/3, we will re-draw contents to a 300x300 canvas
    const newWidth = canvas.canvasWidth * scaleFactor;
    const newHeight = canvas.canvasHeight * scaleFactor;
    const scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = newWidth;
    scaledCanvas.height = newHeight;
    const scaledCanvasContext = scaledCanvas.getContext("2d");
    scaledCanvasContext.drawImage(canvas.canvas, 0, 0, canvas.canvasWidth, canvas.canvasHeight, 0, 0, newWidth, newHeight);
    const canvasData = scaledCanvasContext.getImageData(0, 0, newWidth, newHeight).data;
    return canvasData;
};
const ExtractAlphaValues = (rawData) => {
    const alphaValuesOnly = rawData.filter((val, index) => index % 4 == 3); //take 4th element from every group of 4
    const divdedBy255 = alphaValuesOnly.map((value) => Math.ceil(value / 255)); //array will only contain 0 or 255, so 'normalise' to 0 and 1
    return divdedBy255;
};
const SimplifyRawImage = (rawData, width) => {
    //we can now use this downscaled data
    const alphaValuesOnly = rawData.filter((val, index) => index % 4 == 3); //take 4th element from every group of 4
    //will iterate through the alpha values, and skip every DPI elements.
    //to filter rows, we will only take rows such that row index % DPI == 0
    const downscaledRawData = [];
    for (let i = 0; i < alphaValuesOnly.length; i += dpi) {
        const row = Math.floor(i / width);
        if (row % dpi != 0) {
            continue; //skip all rows which aren't multiples of the DPI
        }
        //instead of taking top-left pixel of each dpixdpi grid, I will take middle pixel
        //const middleDistance =  Math.floor(dpi / 2);
        //const middleIndex = i + middleDistance*width + middleDistance;
        //downscaledRawData.push(alphaValuesOnly[middleIndex]);
        downscaledRawData.push(alphaValuesOnly[i]);
    }
    const divdedBy255 = downscaledRawData.map((value) => Math.ceil(value / 255)); //array will only contain 0 or 255, so 'normalise' to 0 and 1
    return divdedBy255;
};
//offsetX and offsetY have domain [-canvasWidth/2 or -canvasHeight/2, canvasWidth/2 or canvasHeight/2]
const OffsetImage = (image, width, height, offsetX, offsetY) => {
    //iterate through image array; for each element, determine it's new position and place in new image
    const offsetImage = Array(image.length).fill(0);
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
};
//images are bitmap arrays (e.g [1, 1, 1, 0, 0, 0])
const CompareImages = async (reference, userDrawn, width, height) => {
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
    const [maxDx, maxDy, maxSimilarity] = await FindMaximiumSimilarity(reference, userDrawn, CANVAS_SIZE, CANVAS_SIZE);
    DISPLAY_OVERLAY(maxDx, maxDy, canvas1, canvas2, canvas3);
    console.log(`Maximum similarity: ${maxSimilarity} at dx = ${maxDx} dy = ${maxDy}`);
};
//why does this produce different outputs on 1x and 3x DPI
const CalculateSimilarity = (reference, userDrawn) => {
    let numberOfBlackPixelsInReference = 0;
    let sharedBlackPixels = 0;
    let differentPixels = 0;
    for (let i = 0; i != userDrawn.length; i += 1) {
        if (reference[i] == 1 && userDrawn[i] == 1) {
            sharedBlackPixels += 1;
        }
        else if (reference[i] != userDrawn[i]) {
            differentPixels += 1;
        }
        if (reference[i] == 1) {
            numberOfBlackPixelsInReference += 1;
        }
    }
    //const similarity = Math.max(sharedBlackPixels * blackWeighting - differentPixels, 0);
    //const similarity = BlackWeightingCurve(sharedBlackPixels) - DifferentPixelsCurve(differentPixels);
    //const similarityNormalised = similarity / numberOfBlackPixelsInReference * 10;
    //console.log(similarityNormalised)
    //const similarityNormalised = similarity / BlackWeightingCurve(numberOfBlackPixelsInReference);
    //const similarityNormalised = 1 - (DifferentPixelsCurve(differentPixels) / BlackWeightingCurve(sharedBlackPixels));
    //similarity algorithm:
    //we want the user to maximimse the number of shared black pixels, and minimise the number of different pixels
    //max of sharedBlackPixels = black pixels in reference
    //since the user's brush is slightly larger than the reference, and the user is not perfect, we should weight different pixels
    //sightly less
    const differentPixelsWeighting = 0.2;
    const similarity = (sharedBlackPixels - differentPixels * differentPixelsWeighting) / numberOfBlackPixelsInReference * 100;
    return similarity;
};
const Similarity = (reference, userImage, width, height, dx, dy) => {
    //offset user image by dx and dy, and return similarity score
    const offsettedUserImage = OffsetImage(userImage, width, height, dx, dy);
    const similarity = CalculateSimilarity(reference, offsettedUserImage);
    return similarity;
};
const MaximiseSimilarity = async (reference, userImage, width, height, initialdx, initialdy) => {
    let dx = initialdx;
    let dy = initialdy;
    let [maxSimilariy, maxDX, maxDY] = [-Infinity, 0, 0];
    for (let _ = 0; _ < 10; _ += 1) {
        //DISPLAY_OVERLAY(dx, dy);
        //check similarity with update
        const similarity = Similarity(reference, userImage, width, height, dx, dy);
        if (similarity > maxSimilariy) {
            [maxSimilariy, maxDX, maxDY] = [similarity, dx, dy];
        }
        //console.log(`dx: ${dx}, dy: ${dy}, Similarity: ${similarity}`);
        //await Wait(100);
        //compute partial derivative wrt dx and dy.
        const h = 1;
        const gradientWRTdx = (Similarity(reference, userImage, width, height, dx + h, dy) - Similarity(reference, userImage, width, height, dx, dy)) / h;
        const gradientWRTdy = (Similarity(reference, userImage, width, height, dx, dy + h) - Similarity(reference, userImage, width, height, dx, dy)) / h;
        //normalise gradient vector
        const magnitude = Math.sqrt(gradientWRTdx ** 2 + gradientWRTdy ** 2);
        if (magnitude == 0) {
            console.log("Zero gradient vector. Ending gradient descent");
            return [maxSimilariy, maxDX, maxDY]; //we have reached a turning point; or we were initialised in a flat region.
        }
        const normalisedGradientWRTdx = gradientWRTdx / magnitude;
        const normalisedGradientWRTdy = gradientWRTdy / magnitude;
        //update dx and dy with this derivative vector
        const learningRate = 10;
        dx += normalisedGradientWRTdx * learningRate;
        dy += normalisedGradientWRTdy * learningRate;
        //round dx and dy to nearest integer so that bitmap images can be appropriately offset
        dx = Math.round(dx);
        dy = Math.round(dy);
    }
    return [maxSimilariy, maxDX, maxDY];
};
const Wait = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(undefined);
        }, ms);
    });
};
const FindMaximiumSimilarity = async (reference, userImage, width, height, progressCallback) => {
    let [maxSimilarity, maxDx, maxDy] = [-Infinity, 0, 0];
    const xOffsets = [-125, -100, -50, 0, 50, 100, 125];
    const yOffsets = [-125, -100, -50, 0, 50, 100, 125];
    const totalIterations = xOffsets.length * yOffsets.length;
    let currentIteration = 0;
    for (const startingDX of xOffsets) {
        for (const startingDY of yOffsets) {
            const [similarity, dx, dy] = await MaximiseSimilarity(reference, userImage, width, height, startingDX, startingDY);
            currentIteration += 1;
            if (progressCallback != undefined) {
                const progress = currentIteration / totalIterations;
                await progressCallback(progress);
            }
            if (similarity > maxSimilarity) {
                [maxSimilarity, maxDx, maxDy] = [similarity, dx, dy];
            }
        }
    }
    return [maxDx, maxDy, maxSimilarity];
};
const DISPLAY_OVERLAY = (dx, dy, referenceCanvas, userCanvas, feedbackCanvas) => {
    feedbackCanvas.clearCanvas();
    //merge canvas1 and canvas2 data
    const canvas1ImageData = referenceCanvas.c.getImageData(0, 0, referenceCanvas.canvasWidth, referenceCanvas.canvasHeight);
    const canvas2ImageData = OffsetImageData(userCanvas.c.getImageData(0, 0, userCanvas.canvasWidth, userCanvas.canvasHeight), Math.round(dx * dpi), Math.round(dy * dpi));
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
    feedbackCanvas.c.putImageData(canvas1ImageData, 0, 0);
};
//Takes in canvas image data and offsets; used when displaying canvas overlay as feedback
const OffsetImageData = (imageData, dx, dy) => {
    const width = imageData.width;
    const height = imageData.height;
    const offsetData = new ImageData(width, height);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const srcX = x - dx; //find source pixel
            const srcY = y - dy;
            if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) { //check bounds
                const srcIndex = (srcY * width + srcX) * 4;
                const destIndex = (y * width + x) * 4; //copy source to dest
                offsetData.data[destIndex] = imageData.data[srcIndex]; // Copy RGBA values
                offsetData.data[destIndex + 1] = imageData.data[srcIndex + 1];
                offsetData.data[destIndex + 2] = imageData.data[srcIndex + 2];
                offsetData.data[destIndex + 3] = imageData.data[srcIndex + 3];
            }
        }
    }
    return offsetData;
};
