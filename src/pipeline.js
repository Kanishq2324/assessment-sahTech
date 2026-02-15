import path from "path"  // NodeJs module for path handling
import { ensureDir, writeJson, readJson } from "./storage.js";
import { scrapeFiveProducts } from "./scraper.js";
import { summarizeProduct } from "./openaiClient.js";
import { textToSpeechToFile } from "./elevenlabsClient.js";


// 1) NodeJs built-in path module for path handling along with joining like data/products.json

// connecting with directories
const DATA_DIR = path.join(process.cwd(), "data");
const OUTPUT_DIR = path.join(process.cwd(), "output"); //stored the audio output file

// path creation i.e data/products.json and data/summaries.json
const PRODUCTS_PATH = path.join(DATA_DIR, "products.json");
const SUMMARIES_PATH = path.join(DATA_DIR, "summaries.json");


export async function runPipeline() {

    await ensureDir(DATA_DIR);
    await ensureDir(OUTPUT_DIR);

    // 1) scrape
    console.log("1) Scraping 5 products.");
    const products = await scrapeFiveProducts(); // product array received


    await writeJson(PRODUCTS_PATH, products); // Writing the json object to json file path


    // 2) openai summaries
    console.log("2) Generating summaries with OpenAI.");

    const storedProducts = await readJson(PRODUCTS_PATH); // reading the product.json


    const summaries = [];
    for (const p of storedProducts) {
        console.log(`Summarizing: ${p.name}`);

        const summary = await summarizeProduct(p);
        summaries.push({ id: p.id, name: p.name, summary });
    }

    await writeJson(SUMMARIES_PATH, summaries);

    



    // 3) Eleven Labs summaries to speech generation
    console.log("3) Generating MP3 via ElevenLabs...");

    const audioFiles = [];

    // Only first summary → 1 MP3
    const first = summaries[0];
    if (!first) throw new Error("No summaries found.");

    const outSumm = path.join(OUTPUT_DIR, `product-${first.id}.mp3`);


    await textToSpeechToFile({ text: first.summary, outSumm });
    audioFiles.push(outSumm);

    return {
        productsFile: PRODUCTS_PATH,
        summariesFile: SUMMARIES_PATH,
        audioFiles
    };
}