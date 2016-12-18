var app = angular.module('speedFeed', ['ui.router']);

$(".slides").on('scroll', function () {
    $(".StressBars").scrollTop($(this).scrollTop());
 });

//adding different routes to site
app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
		url: '/home',
		templateUrl: '/home.html',
		controller: 'MainCtrl',
		resolve: {
			//Promises to populate posts in database upon load
		postPromise: ['posts', function(posts){
			return posts.getAll();
		}]
		}
    })

	.state('posts', {
		url: '/posts/{id}',
		templateUrl: '/posts.html',
		controller: 'PostsCtrl',
		resolve: {
			post: ['$stateParams', 'posts', function($stateParams, posts) {
				return posts.get($stateParams.id);
			}]
		}
	})

	.state('login', {
	  url: '/login',
	  templateUrl: '/login.html',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	  }]
	})

	.state('register', {
	  url: '/register',
	  templateUrl: '/register.html',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
	    }
	  }]
	});

  $urlRouterProvider.otherwise('home');
}]);


app.factory('posts', ['$http', 'auth', function($http, auth){
	var o = {
	posts: [],
	};

	//Gets current posts in the database
	o.getAll = function() {
		return $http.get('/posts').success(function(data){
			angular.copy(data, o.posts);
		});
	};

	//Allows creation of posts into the database
	o.create = function(post) {
	  return $http.post('/posts', post, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	  	

	  	post.upvotes = 0;
	  	post.flagBool = 0;
	  	console.log(o.posts.length + 1);

	  	console.log(o);
	  	post.priority = post.upvotes + 1000*post.flagBool;
	  	data.upvotes = post.upvotes;
	  	data.flagBool = post.flagBool;
	  	data.timeStamp = post.timeStamp;
	  	data.priority = post.priority;
	  	console.log(data);
	    o.posts.push(data);
	  });
	};

	//Allows updating of upvotes
	o.flag = function(post) {
	  return $http.put('/posts/' + post._id + '/flag', null, {
	    headers: {Authorization: 'Bearer ' +auth.getToken()}
	  }).success(function(data){

	  	if(post.flagBool == 0){
	  		post.flagBool = 1;
	  		post.priority += 1000;
	  		console.log(post.priority);
	  	}else{
	  		post.flagBool = 0;
	  		post.priority -= 1000;
	  		console.log(post.priority);
	  	}
	  });
	};

	//Allows updating of upvotes
	o.upvote = function(post) {
	  return $http.put('/posts/' + post._id + '/upvote', null, {
	    headers: {Authorization: 'Bearer ' +auth.getToken()}
	  }).success(function(data){
	    post.upvotes += 1;
	    console.log(post.priority);
	    post.priority += 1;
	    console.log(post.priority);
	  });
	};

	//Retrieves single post
	o.get = function(id) {
	  return $http.get('/posts/' + id).then(function(res){
	    return res.data;
	  });
	};

	o.addComment = function(id, comment) {
	  return $http.post('/posts/' + id + '/comments', comment, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
	  });
	};

    o.delete = function(id) {
    return $http.delete('/posts/' + id).success(function(data){
        console.log(data);
    });
    }

	return o;

}]);

app.factory('auth', ['$http', '$window', function($http, $window){
	var auth = {};
	auth.saveToken = function (token){
	  $window.localStorage['ripoff-reddit-token'] = token;
	};

	auth.getToken = function (){
	  return $window.localStorage['ripoff-reddit-token'];
	};

	auth.isLoggedIn = function(){
	  var token = auth.getToken();

	  if(token){
	    var payload = JSON.parse($window.atob(token.split('.')[1]));

	    return payload.exp > Date.now() / 1000;
	  } else {
	    return false;
	  }
	};

	auth.currentUser = function(){
	  if(auth.isLoggedIn()){
	    var token = auth.getToken();
	    var payload = JSON.parse($window.atob(token.split('.')[1]));

	    return payload.username;
	  }
	};

	auth.register = function(user){
	  return $http.post('/register', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	auth.logIn = function(user){
	  return $http.post('/login', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	auth.logOut = function(){
	  $window.localStorage.removeItem('ripoff-reddit-token');
	};

	return auth;

}]);

app.controller('MainCtrl', [
	'$scope', 
	'posts',
	'auth',
	function($scope, posts, auth) {
		$scope.posts = posts.posts;
		console.log(posts.posts);
		$scope.isLoggedIn = auth.isLoggedIn;

		$scope.isProf = 0;
		if(auth.currentUser()) {
			if(auth.currentUser().substring(0,4) == "prof") {
				$scope.isProf = 1;
			}
		}

        $scope.addPost = function(){
        	if(!$scope.title || $scope.title === '') { return; }

        	console.log(posts.posts);
			posts.create({
				title: $scope.title,
				link: $scope.link,
				flagBool: $scope.flagBool,
  				upvotes: $scope.upvotes,
  				timeStamp: $scope.timeStamp,
  				priority: $scope.priority
			});

        	$scope.title = '';
        	$scope.link = '';
        };

		$scope.incrementUpvotes = function(post) {
		  console.log(posts.posts);
		  posts.upvote(post);
		};

		$scope.submitFlag = function(post) {
		  console.log(posts.posts);
		  posts.flag(post);
		};

        $scope.deletePost = function(id) {
        	posts.delete(id);
        };
    }
]);

app.controller('PostsCtrl', [
	'$scope',
	'posts',
	'post',
	'auth',
	function($scope, posts, post, auth){
		$scope.post = post;
		$scope.isLoggedIn = auth.isLoggedIn;

		if(auth.currentUser().substring(0,4) == "prof") {
			$scope.isProf = 1;
		}

		$scope.addComment = function(){
			if($scope.body === '') { return; }
			posts.addComment(post._id, {
				body: $scope.body,
				author: 'user',
			}).success(function(comment) {
				$scope.post.comments.push(comment);
			});

		  $scope.body = '';
		};
}]);

app.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth){
	  $scope.user = {};

	  $scope.register = function(){
	    auth.register($scope.user).error(function(error){
	      $scope.error = error;
	    }).then(function(){
	      $state.go('home');
	    });
	  };

	  $scope.logIn = function(){
	    auth.logIn($scope.user).error(function(error){
	      $scope.error = error;
	    }).then(function(){
	      $state.go('home');
	    });
	  };
}]);

app.controller('NavCtrl', [
	'$scope',
	'auth',
	function($scope, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
}]);

app.controller('SlideCtrl', [
	'$scope',
	'auth',
	function($scope, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;

		if(auth.currentUser().substring(0,4) == "prof") {
			$scope.isProf = 1;
		}
}]);

$(document).ready( function() {
  console.log("Yay");

  $(".slides").on('scroll', function () {
    $(".StressBars").scrollTop($(this).scrollTop());
  });

});

