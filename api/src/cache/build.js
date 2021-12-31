const { client } = require("./client");
const db = require("../db");

async function buildCache() {
  const query =
    'SELECT "userId", SUM("amount") as points FROM user_points GROUP BY "userId"';
  const ret = await db.query(query);
  await client.connect();
  await client.del(process.env.REDIS_STORE);
  const jobs = ret.rows.map(async (row) => {
    const points = row["points"];
    const userId = row["userId"];
    await client.zAdd(process.env.REDIS_STORE, {
      score: points,
      value: userId + "",
    });
  });
  await Promise.all(jobs);
  await client.zRangeWithScores(process.env.REDIS_STORE, 0, 100);
  return client;
}

module.exports = { buildCache };
