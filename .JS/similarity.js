"use strict";
const SimplifyRawImage = (rawData, width) => {
    //we can now use this downscaled data
    const alphaValuesOnly = rawData.filter((val, index) => index % 4 == 3); //take 3rd element from every group of 4
    //will iterate through the alpha values, and skip every DPI elements.
    //to filter rows, we will only take rows such that row index % DPI == 0
    const downscaledRawData = [];
    for (let i = 0; i < alphaValuesOnly.length; i += dpi) {
        const row = Math.floor(i / width);
        if (row % dpi != 0) {
            continue; //skip all rows which aren't multiples of the DPI
        }
        downscaledRawData.push(alphaValuesOnly[i]);
    }
    const divdedBy255 = downscaledRawData.map((value) => value / 255); //array will only contain 0 or 255, so 'normalise' to 0 and 1
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
let O_X = 0;
let O_Y = 0;
document.body.onkeydown = ($e) => {
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
    await FindMaximiumSimilarity(reference, userDrawn, 300, 300);
};
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
    const blackWeighting = 10;
    //const similarity = Math.max(sharedBlackPixels * blackWeighting - differentPixels, 0);
    const similarity = sharedBlackPixels * blackWeighting - differentPixels;
    const similarityNormalised = similarity / numberOfBlackPixelsInReference * blackWeighting;
    return similarityNormalised;
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
    for (let _ = 0; _ < 10; _ += 1) {
        //DISPLAY_OVERLAY(dx, dy);
        //check similarity with update
        const similarity = Similarity(reference, userImage, width, height, dx, dy);
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
            return [similarity, dx, dy]; //we have reached a turning point; or we were initialised in a flat region.
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
    return [Similarity(reference, userImage, width, height, dx, dy), dx, dy];
};
const Wait = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(undefined);
        }, ms);
    });
};
const FindMaximiumSimilarity = async (reference, userImage, width, height) => {
    let [maxSimilarity, maxDx, maxDy] = [-Infinity, 0, 0];
    for (let startingDX = -150; startingDX <= 150; startingDX += 50) {
        for (let startingDY = -150; startingDY <= 150; startingDY += 50) {
            const [similarity, dx, dy] = await MaximiseSimilarity(reference, userImage, width, height, startingDX, startingDY);
            if (similarity > maxSimilarity) {
                [maxSimilarity, maxDx, maxDy] = [similarity, dx, dy];
            }
        }
    }
    DISPLAY_OVERLAY(maxDx, maxDy);
    console.log(`Maximum similarity: ${maxSimilarity} at dx = ${maxDx} dy = ${maxDy}`);
};
