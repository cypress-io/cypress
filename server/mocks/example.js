module.exports = function(app, express) {
  var router = express.Router();

  router.get('/', function(req, res) {
    res.send({ greeting: 'Hi', name: 'There' });
  });

  app.use('/api/data', router);
};
