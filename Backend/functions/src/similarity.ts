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

//why does this produce different outputs on 1x and 3x DPI
const CalculateSimilarity = (reference: number[], userDrawn: number[]) => {
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
}

const Similarity = (reference: number[], userImage: number[], width: number, height: number, dx: number, dy: number) => {
    //offset user image by dx and dy, and return similarity score
    const offsettedUserImage = OffsetImage(userImage, width, height, dx, dy);
    const similarity = CalculateSimilarity(reference, offsettedUserImage);
    return similarity;
}

const MaximiseSimilarity = async (reference: number[], userImage: number[], width: number, height: number, initialdx: number, initialdy: number) => {
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
        const magnitude = Math.sqrt(gradientWRTdx**2 + gradientWRTdy**2);
        if (magnitude == 0) {
            console.log("Zero gradient vector. Ending gradient descent")
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
}

export const FindMaximiumSimilarity = async (reference: number[], userImage: number[], width: number, height: number, progressCallback?: (progress: number) => Promise<void>) => {
    let [maxSimilarity, maxDx, maxDy] = [-Infinity, 0, 0];

    const xOffsets = [-125, -100, -50, 0, 50, 100, 125];
    const yOffsets = [-125, -100, -50, 0, 50, 100, 125];

    const totalIterations = xOffsets.length * yOffsets.length;
    let currentIteration = 0;

    for (const startingDX of xOffsets) {
        for (const startingDY of yOffsets) {
            const [similarity, dx, dy] = await MaximiseSimilarity(reference, userImage, width, height, startingDX, startingDY);
            currentIteration += 1;

            if (progressCallback != undefined ){
                const progress = currentIteration / totalIterations;
                await progressCallback(progress);
            }

            if (similarity > maxSimilarity) {
                [maxSimilarity, maxDx, maxDy] = [similarity, dx, dy];
            }
        }
    }

    return [maxDx, maxDy, maxSimilarity];
}