//
// Data constructs and initialization.
//
// Adding comment to test commit and test out CI/CD pipeline

var albumBucketName = 'don-sisto-photos';

// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:37c7813f-c2d0-410e-8af7-b3d034fa875c',
});

// Create a new service object
var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
});


//
// Functions
//

// List the photo albums that exist in the bucket.
function listAlbums() {
  s3.listObjects({ Delimiter: "/" }, function(err, data) {
    if (err) {
      return alert("There was an error listing your albums: " + err.message);
    } else {
      var albums = data.CommonPrefixes.map(function(commonPrefix) {
        var prefix = commonPrefix.Prefix;
        var albumName = decodeURIComponent(prefix.replace("/", ""));
        return getHtml([
          "<li>",
          "<span onclick=\"viewAlbum('" + albumName + "')\">",
          albumName,
          "</span>",
          "</li>"
        ]);
      });
      var message = albums.length
        ? getHtml([
            "<p>Click on an album name to view it.</p>",
          ])
        : "<p>You do not have any albums. Please Create album.";
      var htmlTemplate = [
        "<h2>Albums</h2>",
        message,
        "<ul>",
        getHtml(albums),
        "</ul>",
      ];
      document.getElementById("app").innerHTML = getHtml(htmlTemplate);
    }
  });
}

// Show the photos that exist in an album.
function viewAlbum(albumName) {
  var albumPhotosKey = encodeURIComponent(albumName) + '/';
  s3.listObjects({Prefix: albumPhotosKey}, function(err, data) {
    if (err) {
      return alert('There was an error viewing your album: ' + err.message);
    }
    // 'this' references the AWS.Request instance that represents the response
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + albumBucketName + '/';

    var photos = data.Contents.map(function(photo) {
      var photoKey = photo.Key;
      var photoUrl = bucketUrl + encodeURIComponent(photoKey);
      return getHtml([
        '<span>',
          '<div>',
            '<br/>',
			'<style>',
			'img {',
				'border: 1px solid #ddd;',
				'border-radius: 4px;',
				'padding: 5px;',
				'width: 150px;',
				'}',
			'img:hover {',
				'box-shadow: 0 0 2px 1px rgba(0, 140, 186, 0.5);',
			'}',
			'</style>',
			'<a target="_blank" href="' + photoUrl + '">',
				'<img src="' + photoUrl + '"/>',
			'</a>',
          '</div>',
          '<div>',
            '<span>',
              photoKey.replace(albumPhotosKey, ''),
            '</span>',
          '</div>',
        '</span>',
      ]);
    });
    var message = photos.length ?
      '<p>The following photos are present.</p>' :
      '<p>There are no photos in this album.</p>';
    var htmlTemplate = [
      "<h2>",
      "Album: " + albumName,
      "</h2>",
      message,
      "<div>",
      getHtml(photos),
      "</div>",
      '<input id="photoupload" type="file" accept="image/*">',
      '<button id="addphoto" onclick="addPhoto(\'' + albumName + "')\">",
      "Add Photo",
      "</button>",
      '<button onclick="listAlbums()">',
      "Back To Albums",
      "</button>"
    ];
    document.getElementById('app').innerHTML = getHtml(htmlTemplate);
    //document.getElementsByTagName('img')[0].setAttribute('style', 'display:none;');
  });
}

function addPhoto(albumName) {
  var files = document.getElementById("photoupload").files;
  if (!files.length) {
    return alert("Please choose a file to upload first.");
  }
  var file = files[0];
  var fileName = file.name;
  var albumPhotosKey = encodeURIComponent(albumName) + "/";

  var photoKey = albumPhotosKey + fileName;

  // Use S3 ManagedUpload class as it supports multipart uploads
  var upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: albumBucketName,
      Key: photoKey,
      Body: file
    }
  });

  var promise = upload.promise();

  promise.then(
    function(data) {
      alert("Successfully uploaded photo.");
      viewAlbum(albumName);
    },
    function(err) {
      return alert("There was an error uploading your photo: ", err.message);
    }
  );
}