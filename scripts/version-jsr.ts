import fs from "fs";

const pkgJson = JSON.parse(fs.readFileSync("package.json").toString());
// console.dir(pkgJson);

const jsrJson = JSON.parse(fs.readFileSync("jsr.json").toString());
// console.dir(jsrJson);

// update JSR config to match package.json
jsrJson.version = pkgJson.version || jsrJson.version;

fs.writeFileSync("jsr.json", JSON.stringify(jsrJson, null, "\t") + "\n");
