/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("user_points", {
    id: "id",
    userId: { type: "integer", notNull: true },
    amount: { type: "integer", notNull: true },
    topicId: { type: "integer", notNull: true },
    createdAt: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("user_points", "userId")
  pgm.createIndex("user_points", "topicId")
  pgm.createIndex("user_points", "createdAt")
};

exports.down = (pgm) => {
  pgm.dropIndex("user_points", "userId")
  pgm.dropIndex("user_points", "topicId")
  pgm.dropIndex("user_points", "createdAt")
  pgm.dropTable("user_points");
};
