import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "./storage.js";



const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

export async function textToSpeechToFile({ text, outSumm }) {
    await ensureDir(path.dirname(outSumm));

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
    });

    /*
        Eleven labs returns raw binary data
        arrayBuffer(): reads raw binary
        Buffer.from(): converts it to Node Buffer
    */

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`ElevenLabs failed: ${res.status} ${res.statusText} ${errText}`);
    }



    const audioBuffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(outSumm, audioBuffer);
}