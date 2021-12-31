var express = require("express");
var router = express.Router();

const db = require("../db");
const { buildCache } = require("../cache");

buildCache().then((client) => {
  console.log("build cache completed");
  router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const score = await client.zScore(process.env.REDIS_STORE, userId);
      res.send({ userId, points: score });
    } catch (error) {
      console.log(error.stack);
      res.status(500).send();
    }
  });

  router.post("/", async (req, res) => {
    const { userId, topicId, amount } = req.body;
    const query =
      'INSERT INTO user_points("userId", "topicId", "amount") VALUES ($1, $2, $3) RETURNING *';
    try {
      const ret = await db.query(query, [userId, topicId, amount]);
      await client.zAdd(
        process.env.REDIS_STORE,
        {
          score: Number(amount),
          value: userId + "",
        },
        { INCR: true }
      );
      res.send(ret.rows[0]);
    } catch (error) {
      console.log(error.stack);
      res.status(500).send();
    }
  });
  router.get("/top/:topicId/:count", async (req, res) => {
    const topicId = Number(req.params.topicId);
    const count = Number(req.params.count);
    const normalizedCount = count < 0 || count > 20 ? 10 : count;
    try {
      const list = await client.zRangeWithScores(
        process.env.REDIS_STORE,
        0,
        normalizedCount,
        { REV: true }
      );
      res.send(list);
    } catch (error) {
      res.status(500).send(error);
    }
  });
});

module.exports = router;
