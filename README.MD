# Leaderboard service

This is meant to be a performant leaderboard micro service. It is implemented with ExpressJs, Postgres and Redis.

## How does it work?

When we have millions of users commiting their credits (points, scores.. etc..) to the system and expecting a real-time update to the leaderboard, getting a real leaderboard is hard.

At the base level, we have a table in Postgres with a really simple schema:

```sql
CREATE TABLE "user_points" (
  id int primary key,
  userId int not null,
  amount int not null,
  createdDate timestamp not null default current_timestamp
)
```

The idea is, when a user earn some points/scores in our system, we put a record in this table for archiving. This way, we can always tell what's a user's total scores at any point in time with:

```sql
SELECT userId, SUM(amount) FROM user_points WHERE userId = ? AND createdDate >= ? GROUP BY userId
```

Obviously if we do this everytime a user's highscore was queried, we will have a readlly big performance problem in our hands.

So that's why we introduce Redis. Or caching in general.

## Redis or Caching

Redis has a very convenience data structure implemented, it's called sorted set. Every members in this set is identified with a unique key which we can use `userId` for.

At service launch, we will have to build the cache set:

```sql
SELECT "userId", SUM("amount") as points FROM user_points GROUP BY "userId"
```

Which would give us something like this:

| userId | points |
| ------ | ------ |
| 1      | 100    |
| 2      | 130    |
| 3      | 30     |

With the returned list, we can build a Sorted Set:

```js
rows.forEach(row => {
   redisClient.zAdd('leaderboard', { score: row['score'], value: row['userId']})
})
```

With a established sorted set, getting a leaderboard of 10 members is rather easy:

```js
redisClient.zRangeWithScores('leaderboard', 0, 10, { REV: true })
```

To maintain the truthfulness of the cache, everytime a user earned a few more points, we need to update the cache:

```js
redisClient.zAdd('leaderboard', { score: newlyEarnedPoints, value: userId}, { INCR: true })
```

## Warning

This is not meant for a small product, if you have less than a few hundred thousands users, don't bother.

This is expensive (relatively), just looks at the standard hosting plan for Redis could make you cry.

## Credits

This is implemented based on this [article](https://levelup.gitconnected.com/how-we-created-a-real-time-leaderboard-for-a-million-users-555aaa3ccf7b).
