import OpenAI from "openai";

// Open AI Instance
const client = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });


export async function summarizeProduct({ name, description }) {
    const prompt = `
    Write a natural, human-friendly product summary in 1 sentence (max 10 words).

    Product Name: ${name}
    Product Description: ${description}

    Rules:
    - maximum 10 words
    - No bullet points
    - No exaggerated claims
    - Keep it realistic and simple
    `.trim();

    const res = await client.responses.create({
        model: "gpt-4o-mini",
        input: prompt,
        max_output_tokens: 60
    });

    const text = (res.output_text || "").trim();

    if (!text) throw new Error("OpenAI returned empty summary.");


    return text;
}