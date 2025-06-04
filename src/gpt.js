const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text) {
  const result = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return result.data[0].embedding;
}

async function askGPT(question, context) {
  const messages = [
  {
    role: 'system',
    content: `You are a helpful assistant. Use only the provided context to answer questions. Format your response as neatly as possible using Markdown and cite sources by linking to the file name using Markdown when fileUrl and fileName are present.`
  },
  {
    role: 'user',
    content: `Context:\n${context}\n\nQuestion:\n${question}`
  }
];

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages,
    temperature: 0.3,
  });

  return response.choices[0].message.content.trim();
}

async function askGPTStream(res, question, context) {
  const messages = [
  {
    role: 'system',
    content: `You are a helpful assistant. Use only the provided context to answer questions. Format your response as neatly as possible using Markdown and cite sources by linking to the file name using Markdown when fileUrl and fileName are present.`
  },
  {
    role: 'user',
    content: `Context:\n${context}\n\nQuestion:\n${question}`
  }
];

  const stream = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages,
    temperature: 0.3,
    stream: true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    // console.info('chunk:', chunk.choices?.[0]?.delta);
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      fullText += content;
      res.write(`data: ${content}`);
      // console.info('Streaming chunk:', content);
    }
  }
  return fullText;
}

module.exports = { getEmbedding, askGPT, askGPTStream };