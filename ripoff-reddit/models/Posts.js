var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String,
  link: String,
  flagBool: {type: Number, default: 0},
  upvotes: {type: Number, default: 0},
  timeStamp: {type: Number, default: 1},
  priority: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

PostSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.priority += 1;
  console.log('this.priority:');
  console.log(this.priority);

  this.save(cb);
};

PostSchema.methods.flag = function(cb) {
  if(this.flagBool == 0){
    this.flagBool = 1;
    this.priority += 1000;
  }else{
    this.flagBool = 0;
    this.priority -= 1000;
  }
  this.save(cb);
};

mongoose.model('Post', PostSchema);