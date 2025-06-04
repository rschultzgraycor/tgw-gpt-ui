const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

async function queryPinecone(vector, topK = 5) {
  const queryRequest = {
    vector,
    topK,
    includeMetadata: true
  };
  // console.info('queryRequest', queryRequest);
  const result = await index.query(queryRequest);
  // console.info('result', JSON.stringify(result));
  return result.matches || [];
}

module.exports = {
  queryPinecone,
};