"use strict";
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
        const learningRate = 5;
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
