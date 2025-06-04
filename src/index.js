const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authMiddleware = require('./middleware/auth');
const { getEmbedding, askGPT, askGPTStream } = require('./gpt');
const { queryPinecone } = require('./pinecone');
const { logQuery, updateThumbsUp, getQueryHistory, getFileSync, toggleIgnoreFiles } = require('./db');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../client/dist')));


app.post('/query', authMiddleware, async (req, res) => {
  console.info('User:', req.user);
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing "query" in request body.' });
  }

  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const startTime = Date.now();
  console.info(`[PERF] /query started at ${new Date(startTime).toISOString()}`);

  try {
    // Step 1: Embed the user query
    const embedStart = Date.now();
    const embedding = await getEmbedding(query);
    const embedEnd = Date.now();
    console.info(`[PERF] getEmbedding took ${embedEnd - embedStart} ms`);

    // Step 2: Query Pinecone using the official SDK
    const pineconeStart = Date.now();
    const matches = await queryPinecone(embedding, 5);
    const pineconeEnd = Date.now();
    console.info(`[PERF] queryPinecone took ${pineconeEnd - pineconeStart} ms`);

    const context = matches.map(match => {
      const { chunk, filename, fileurl } = match.metadata;
      return `Source: [${filename}](${fileurl})\n${chunk}`;
    }).join('\n\n');

    // Step 3: Get GPT response
    const gptStart = Date.now();
    const answer = await askGPTStream(res, query, context);
    const gptEnd = Date.now();
    console.info(`[PERF] askGPT took ${gptEnd - gptStart} ms`);

    // Step 4: Log to SQL
    const logStart = Date.now();
    const endTime = Date.now();
    const timeToResult = endTime - startTime;
    const queryId = await logQuery({
      agentId: process.env.AZURE_SQL_AGENT_ID || 1,
      query,
      response: answer,
      timeToResult,
      createdBy: req.user?.unique_name || 'system'
    });
    const logEnd = Date.now();
    console.info(`[PERF] logQuery took ${logEnd - logStart} ms`);
    const totalTime = logEnd - startTime;
    console.info(`[PERF] /query total time: ${Date.now() - startTime} ms`);

    res.write(`data: [QUERYID] - ${queryId}`);
    res.write(`data: [TTR] - ${totalTime}`);
    res.write('data: [DONE]');
    res.end();
  } catch (err) {
    res.write(`data: [ERROR] ${err.message}\n\n`);
    res.end();
  }
});

// Add feedback endpoint
app.post('/feedback', async (req, res) => {
  const { queryId, thumbsUp } = req.body;
  if (typeof queryId !== 'number' || (thumbsUp !== 0 && thumbsUp !== 1)) {
    return res.status(400).json({ error: 'Invalid feedback data.' });
  }
  try {
    await updateThumbsUp(queryId, thumbsUp);
    res.json({ success: true });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/query-history', async (req, res) => {
  try {
    const rows = await getQueryHistory();
    res.json({ history: rows });
  } catch (err) {
    console.error('Failed to fetch query history:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/file-sync', async (req, res) => {
  try {
    const rows = await getFileSync();
    res.json({ files: rows });
  } catch (err) {
    console.error('Failed to fetch fileSync:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add endpoint to update ignoreFile for a single file by id
app.post('/file-sync/ignore', async (req, res) => {
  const { ids, ignoreFile } = req.body;
  if (!Array.isArray(ids) || typeof ignoreFile !== 'number' || (ignoreFile !== 0 && ignoreFile !== 1)) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }
  try {
    const updated = await toggleIgnoreFiles(ids, ignoreFile);
    res.json({ success: true, updated });
  } catch (err) {
    console.error('Failed to update ignoreFile:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Catch-all to serve React index.html for any unknown route
app.get(/(.*)/, (req, res, next) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));