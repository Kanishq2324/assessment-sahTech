# Backend AI Assessment

## Overview
This project implements a complete automated pipeline:

1. Scrapes 5 products from a shopify variant: https://allbirds.com
2. Generates human-friendly summaries using OpenAI API.
3. Converts one summary into speech using ElevenLabs API.
4. Runs fully automated via a single Express endpoint.

## How to Run

1. Install dependencies:
   npm install

2. Create .env file:
   OPEN_AI_API_KEY = your_key
   ELEVENLABS_API_KEY = your_key

3. Start server:
   npm start

4. Run pipeline:
   POST http://localhost:3000/run
