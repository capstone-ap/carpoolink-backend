import 'dotenv/config';

import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function runSTT() {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream("./src/sttTest.wav"),
    model: "gpt-4o-transcribe",
  });

  console.log(transcription.text);
}

runSTT();