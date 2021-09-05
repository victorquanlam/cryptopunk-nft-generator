const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const console = require("console");

const imageFormat = {
    width: 24,
    height: 24
};

const canvas = createCanvas(imageFormat.width, imageFormat.height);
const ctx = canvas.getContext("2d");

const priorities = ['punks','top','beard'];

const generateImages = async () => {
  const traitTypesDir = `./layers/trait_types`
  const types = fs.readdirSync(traitTypesDir);

  const traitTypes = priorities.concat(types.filter(x=> !priorities.includes(x)))
                      .map(traitType => (
                        fs.readdirSync(`${traitTypesDir}/${traitType}/`)
                      .map(value=> {
                          return {trait_type: traitType, value: value}
                        }).concat({trait_type: traitType, value: 'N/A'})
                      ));

  const backgrounds = fs.readdirSync(`./layers/background`);

  // trait type avail for each punk
  const combinations = allPossibleCases(traitTypes)
  
    for (var n = 0; n < combinations.length; n++) {
      const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)]
      await drawImage(combinations[n] , randomBackground, n);
    }
};

const recreateOutputsDir = () => {
  const dir = `./outputs`;
  if (fs.existsSync(dir)) {
    fs.rmdirSync(dir, { recursive: true });
  }
  fs.mkdirSync(dir);
  fs.mkdirSync(`${dir}/metadata`);
  fs.mkdirSync(`${dir}/punks`);
};

// https://stackoverflow.com/a/66888968
const allPossibleCases = (arraysToCombine) => {
  const divisors = [];
  let permsCount = 1;
  for (let i = arraysToCombine.length - 1; i >= 0; i--) {
      divisors[i] = divisors[i + 1] ? divisors[i + 1] * arraysToCombine[i + 1].length : 1;
      permsCount *= (arraysToCombine[i].length || 1);
  }

  console.log(permsCount)
  const getCombination = (n, arrays, divisors) => arrays.reduce((acc, arr, i) => {
      acc.push(arr[Math.floor(n / divisors[i]) % arr.length]);
      return acc;
  }, []);

  const combinations = [];
  for (let i = 0; i < permsCount; i++) {
    // console.log("done " + i)
      combinations.push(getCombination(i, arraysToCombine, divisors));
  }
  return combinations;
};

const drawImage= async (traitTypes, background, index) => {
  // draw background
  const backgroundIm = await loadImage(`./layers/background/${background}`);
  
  ctx.drawImage(backgroundIm,0,0,imageFormat.width,imageFormat.height);

  //'N/A': means that this punk doesn't have this trait type
  const drawableTraits = traitTypes.filter(x=> x.value !== 'N/A')
  for (let index = 0; index < drawableTraits.length; index++) {
      const val = drawableTraits[index];
      const image = await loadImage(`./layers/trait_types/${val.trait_type}/${val.value}`);
      ctx.drawImage(image,0,0,imageFormat.width,imageFormat.height);
  }

  // up to here
  console.log(`up to here ${index}`)

  // save metadata
  fs.writeFileSync(
    `./outputs/metadata/${index}.json`,
    JSON.stringify({
      name: `punk ${index}`,
      attributes: drawableTraits
    }),
    function(err){
      if(err) throw err;
    }
  )

  // save image 
  fs.writeFileSync(
    `./outputs/punks/${index}.png`, 
    canvas.toBuffer("image/png")
  );
}

//main
(() => {
  recreateOutputsDir();
  generateImages();
})();
