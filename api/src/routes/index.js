const points = require('./points')

module.exports = app => {
  app.use("/", points)
}