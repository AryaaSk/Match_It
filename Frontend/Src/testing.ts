const ProduceOutput = (expectedOutput: any, trueOutput: any) => {
    if (expectedOutput === trueOutput) {
        return `Passed: Output = ${expectedOutput}`
    }
    else {
        return `Failed: Expected Output = ${expectedOutput}, True Output = ${trueOutput}`;
    }
}



const CANVAS_WIDTH = 300;
const GridX = (screenX: number) => {
    if (screenX < 0) {
        throw RangeError("Out of bounds");
    }

    return (screenX) - (CANVAS_WIDTH / 2);
}
console.log(-10, ProduceOutput(RangeError("Out of bounds"), GridX(-10)));

// console.log(0, ProduceOutput(-150, GridX(0)));
// console.log(300, ProduceOutput(150, GridX(300)));
// console.log(150, ProduceOutput(0, GridX(150)));
// console.log(100, ProduceOutput(-50, GridX(100)));
// console.log(50, ProduceOutput(-100, GridX(50)));
// console.log(121, ProduceOutput(-29, GridX(121)));
// console.log("string", ProduceOutput(TypeError, GridX("string")));