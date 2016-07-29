var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

var sendJsonResponse = function (res, status, content) {
  res.status(status);
  res.json(content);
};

// GET Locations by Distance
module.exports.locationsListByDistance = function(req, res) {
  var lng = parseFloat(req.query.lng);
  var lat = parseFloat(req.query.lat);
  var maxDistance = parseFloat(req.query.maxDistance);
  if ((lng || lng === 0) && (lat || lat === 0) && maxDistance) {
    var point = {
      type: "Point",
      coordinates: [lng, lat]
    };
    var geoOptions = {
      spherical: true,
      maxDistance: maxDistance,
      num: 10
    };
    Loc.geoNear(point, geoOptions, function(err, results, stats) {
      if (err) {
        sendJsonResponse(res, 400, err);
        return;
      } else {
        var locations = buildLocationList(req, res, results, stats);
        sendJsonResponse(res, 200, locations);
      }
    });
  } else {
    sendJsonResponse(res, 404, {
      "message": "lng, lat and maxDistance query parameters are all required"
    });
  }
};

var buildLocationList = function(req, res, results, stats) {
  var locations = [];
  results.forEach(function(doc) {
    locations.push({
      distance: doc.dis,
      name: doc.obj.name,
      address: doc.obj.address,
      rating: doc.obj.rating,
      facilities: doc.obj.facilities,
      _id: doc.obj._id
    });
  });
  return locations;
};

// POST Locations
module.exports.locationsCreate = function(req, res) {
  Loc.create({
    name: req.body.name,
    address: req.body.address,
    facilities: req.body.facilities.split(","),
    coords: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
    "2dsphereIndexVersion" : 1,
    openingTimes: [{
      days: req.body.days1,
      opening: req.body.opening1,
      closing: req.body.closing1,
      closed: req.body.closed1,
    }, {
      days: req.body.days2,
      opening: req.body.opening2,
      closing: req.body.closing2,
      closed: req.body.closed2,
    }]
  }, function (err, location) {
    if (err) {
      sendJsonResponse(res, 400, err);
    } else {
      sendJsonResponse(res, 201, location);
    }
  });
};

// GET Location
module.exports.locationsReadOne = function(req, res) {
  if (req.params && req.params.locationid) {
    Loc
      .findById(req.params.locationid)
      .exec(function(err, location) {
        if (err) {
          sendJsonResponse(res, 404, err);
          return;
        } else if (!location) {
          sendJsonResponse(res, 404, {
            "message" : "locationid not found"
          });
          return;
        }
        sendJsonResponse(res, 200, location);
      });
  } else {
    sendJsonResponse(res, 404, {
      "message" : "No locationid in request"
    });
  }
};

// PUT Location
module.exports.locationsUpdateOne = function(req, res) {
  if (req.params && req.params.locationid) {
    Loc
      .findById(req.params.locationid)
      .select('-reviews -rating')
      .exec(function(err, location) {
        if (err) {
          sendJsonResponse(res, 400, err);
          return;
        } else if (!location) {
          sendJsonResponse(res, 404, {
            "message" : "locationid not found"
          });
          return;
        }
        location.name = req.body.name;
        location.address = req.body.address;
        location.facilities = req.body.facilities.split(",");
        location.coords = [parseFloat(req.body.lng), parseFloat(req.body.lat)];
        location.openingTimes = [{
          days: req.body.days1,
          opening: req.body.opening1,
          closing: req.body.closing1,
          closed: req.body.closed1,
        }, {
          days: req.body.days2,
          opening: req.body.opening2,
          closing: req.body.closing2,
          closed: req.body.closed2,
        }];
        location.save(function(err, location) {
          if (err) {
            sendJsonResponse(res, 400, err);
          } else {
            sendJsonResponse(res, 200, location);
          }
        });
      });
  } else {
    sendJsonResponse(res, 404, {
      "message" : "No locationid in request"
    });
  }
};

// DELETE Location
module.exports.locationsDeleteOne = function(req, res) {
  var locationid = req.params.locationid;
  if (locationid) {
    Loc
      .findByIdAndRemove(locationid)
      .exec(function(err, location) {
        if (err) {
          console.log(err);
          sendJsonResponse(res, 400, err);
          return;
        }
        console.log("Location id " + locationid + " deleted");
        sendJsonResponse(res, 204, null);
      });
  } else {
    sendJsonResponse(res, 404, {
      "message": "No locationid"
    });
  }
};

