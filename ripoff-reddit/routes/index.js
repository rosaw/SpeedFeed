var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Preloading posts. */
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

/* Preloading comment */
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error("can't find comment")); }

    req.comment = comment;
    return next();
  });
});

/* Returning single post */
router.get('/posts/:post', function(req, res) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});

/* Get posts. */
router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }

    //sends received post back to client in json format
    res.json(posts);
  });
});

/* Create posts. */
router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  console.log("HELLO");

  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

/* Upvote post route */
router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

/* Flag post route */
router.put('/posts/:post/flag', auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

/* Comment Route */
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.payload.username;

  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});


/* User register route */
router.post('/register', function(req, res, next){
	console.log("potato");
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message: 'Please fill out all fields'});
	}

	var user = new User();

	user.username = req.body.username;

	user.setPassword(req.body.password)

	user.save(function (err){
	if(err){ return next(err); }

	return res.json({token: user.generateJWT()})
	});
});

/* User login route */
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

/* Delete a post. */
router.delete('/posts/:post', function(req, res) {
  req.post.comments.forEach(function(id) {
    Comment.remove({
      _id: id
    }, function(err) {
      if (err) { return next(err)}
    });
  })
  Post.remove({
    _id: req.params.post
  }, function(err, post) {
    if (err) { return next(err); }

    // Get and return all the posts after you delete one
    Post.find(function(err, posts) {
      if (err) { return next(err); }

      res.json(posts);
    });
  });
});

module.exports = router;
