const sql = require('mssql');

require('dotenv').config();

const config = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_HOST,
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function logQuery({ agentId, query, response, timeToResult, createdBy }) {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool.request()
      .input('agentId', sql.Int, process.env.AZURE_SQL_AGENT_ID || agentId)
      .input('query', sql.NVarChar(sql.MAX), query)
      .input('response', sql.NVarChar(sql.MAX), response)
      .input('timeToResult', sql.BigInt, timeToResult)
      .input('createdDateTime', sql.DateTime, new Date())
      .input('createdBy', sql.NVarChar(50), createdBy)
      .query(`
        INSERT INTO [dbo].[queryHistory] 
        (agentId, query, response, timeToResult, createdDateTime, createdBy)
        OUTPUT INSERTED.Id
        VALUES (@agentId, @query, @response, @timeToResult, @createdDateTime, @createdBy)
      `);
    return result.recordset[0].Id;
  } catch (err) {
    console.error('Failed to log query:', err);
    return null;
  } finally {
    if (pool) await pool.close();
  }
}

async function updateThumbsUp(id, thumbsUp) {
  let pool;
  try {
    pool = await sql.connect(config);
    await pool.request()
      .input('id', sql.Int, id)
      .input('thumbsUp', sql.Bit, thumbsUp)
      .query('UPDATE [dbo].[queryHistory] SET thumbsUp = @thumbsUp WHERE Id = @id');
  } catch (err) {
    console.error('Failed to update thumbsUp:', err);
  } finally {
    if (pool) await pool.close();
  }
}

async function getQueryHistory() {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT query, response, timeToResult, createdDateTime, createdBy, thumbsUp
      FROM [dbo].[queryHistory]
      WHERE agentId = ${process.env.AZURE_SQL_AGENT_ID}
      ORDER BY createdDateTime DESC
    `);
    return result.recordset;
  } catch (err) {
    console.error('Failed to fetch query history:', err);
    return [];
  } finally {
    if (pool) await pool.close();
  }
}

async function getFileSync() {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM [dbo].[fileSync] where agentId = 1 ORDER BY createdDateTime DESC');
    return result.recordset;
  } catch (err) {
    console.error('Failed to fetch fileSync:', err);
    return [];
  } finally {
    if (pool) await pool.close();
  }
}
// Add endpoint to update ignoreFile for a single file by ids
async function toggleIgnoreFiles(ids, ignoreFile) {
  let pool;
  try {
    pool = await sql.connect(config);
    // Update ignoreFile for the given ids
    await pool.request().query(`UPDATE [dbo].[fileSync] SET ignoreFile = ${ignoreFile} WHERE id IN (${ids.map(Number).join(',')})`);
    // Return the updated rows
    const result = await pool.request().query(`SELECT id, ignoreFile FROM [dbo].[fileSync] WHERE id IN (${ids.map(Number).join(',')})`);
    return result.recordset;
  } catch (err) {
    console.error('Failed to toggle ignoreFile:', err);
    return [];
  } finally {
    if (pool) await pool.close();
  }
}

module.exports = { logQuery, updateThumbsUp, getQueryHistory, getFileSync, toggleIgnoreFiles };