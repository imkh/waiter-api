var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var config = require('config');
var jwt = require('jsonwebtoken');
var jsend = require('jsend');

var User = require('./../models/User');
var Event = require('./../models/Event');

var httpCodes = config.get('httpCodes');
var zoomDistanceRatio = config.get('zoomDistanceRatio');
var tokenConfig = config.get('JWT');

const tokenSecret = tokenConfig.tokenSecret;

//@TODO remove callback hell !!!
//@TODO implement promise or wait !!!
//@TODO create named callback functions !!!

router.use(methodOverride(function(req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));

router.use(jsend.middleware);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));

// Start: Middleware (1)
/**
 * Middleware verify event exists
 */
router.param('id', function(req, res, next, id) {
    var causes = [];

    Event.findById(id, function (err, event) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (event === null) {
            causes.push('Event not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Event middleware failed', causes: causes});
            return ;
        }
        next();


        /* if (err) {
         *     console.log(id + ' was not found');
         *     res.status(404)
         *     var err = new Error('Not Found');
         *     err.status = 404;
         *     res.format({
         *         json: function(){
         *             res.status(404).json({status: "fail", data : { message: err.status  + ' ' + err}});
         res.status(httpCodes.notFound).jsend.fail({message: '', causes: causes});
         *         }
         *     });
         * } else {
         *     req.id = id;
         *     next();
         * }*/
    });
});
// End: Middleware (2)

/**
 * Route Create Event
 */

router.post('/bulkInsert', function(req, res) {
  var causes = [];

  var events = [
    {
      name: "Tour Eiffel",
      address: "Parc Du Champs De Mars, Paris 75007, France",
      location: [48.8582546, 2.2903622],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2600-4028907509-88.jpg",
      description: "Construite par Gustave Eiffel et ses collaborateurs pour l’Exposition universelle de Paris de 1889, la Tour Eiffel est tour de fer situé au Champ de Mars à Paris."
    },
    {
      name: "Musées du Vatican",
      address: "Viale Vaticano, 00165 Roma RM, Italie",
      location: [41.9064878, 12.4514526],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2600-4028907509-88.jpg",
      description: "Les Musées du Vatican constituent un ensemble muséal situé au Vatican. Il regroupe douze musées, ce qui représente cinq galeries et 1 400 salles. L'ensemble abrite l'une des plus grandes collections d'art dans le monde, car il expose l'énorme collection d'œuvres d'art accumulées au fil des siècles par les papes. Les musées sont en partie hébergés dans le Palais du Vatican."
    },
    {
      name: "Musée du Louvre",
      address: "Musée du Louvre, 75058 Paris, France",
      location: [48.8607175,2.3313171],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-3224-2027111310-88.jpg",
      description: "Les Musées du Vatican constituent un ensemble muséal situé au Vatican. Il regroupe douze musées, ce qui représente cinq galeries et 1 400 salles. L'ensemble abrite l'une des plus grandes collections d'art dans le monde, car il expose l'énorme collection d'œuvres d'art accumulées au fil des siècles par les papes. Les musées sont en partie hébergés dans le Palais du Vatican."
    },
    {
      name: "Sagrada Familia",
      address: "Carrer de Mallorca, 401, 08013 Barcelona, Espagne",
      location: [41.4036299, 2.1721671],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2699-1642475940-88.jpg",
      description: "La Sagrada Família est une basilique de Barcelone dont la construction a commencé en 1882."
    },
    {
      name: "Burj Khalifa",
      address: "1 Sheikh Mohammed bin Rashid Blvd - Dubai - Émirats arabes unis",
      location: [25.197197, 55.2721877],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2703-2535313405-88.jpg",
      description: "Burj Khalifa est la plus grande tour du monde. Appelée Burj Dubaï jusqu’à son inauguration, il s'agit d'un gratte-ciel situé à Dubaï aux Émirats arabes unis, devenu en mai 2009 la plus haute structure humaine jamais construite."
    },
    {
      name: "Empire State Building",
      address: "350 5th Ave, New York, NY 10118, États-Unis",
      location: [40.7484405, -73.9878531],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2608-2364645235-88.jpg",
      description: "L’Empire State Building est un gratte-ciel de style Art déco situé dans l'arrondissement de Manhattan, à New York.",
    },
    {
      name: "Colisée",
      address: "Piazza del Colosseo, 1, 00184 Roma RM, Italie",
      location: [41.8902102, 12.4911366],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2619-417048476-88.jpg",
      description: "Le Colisée, à l'origine amphithéâtre Flavien, est un immense amphithéâtre ovoïde situé dans le centre de la ville de Rome, entre l'Esquilin et le Cælius, le plus grand jamais construit dans l'empire romain. Il est l'une des plus grandes œuvres de l'architecture et de l'ingénierie romaines.",
    },
    {
      name: "Église Santa Maria delle Grazie de Milan",
      address: "Piazza di Santa Maria delle Grazie, 20123 Milano MI, Italie",
      location: [45.465963, 9.1687734],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-3586-4287674686-88.jpg",
      description: "L'église et le monastère ont été fondés vers 1463 par des Dominicains sur un terrain offert par Gasparo Vimercati. Sur ce terrain existait déjà un oratoire dédié à une image miraculeuse de la Vierge des Miséricordes ( Vergine delle Grazie ).",
    },
     {
      name: "Machu Picchu",
      address: "Pérou",
      location: [-13.1631098,-72.5451171],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-1570-4165020824-88.jpg",
      description: "Machu Picchu est une ancienne cité inca du XVe siècle au Pérou, perchée sur un promontoire rocheux qui unit les monts Machu Picchu et Huayna Picchu sur le versant oriental des Andes centrales.",
     },
    {
      name: "Alcatraz",
      address: "San Francisco, Californie, États-Unis",
      location: [37.8267028, -122.4240831],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-535-3520021547-88.jpg",
      description: "L'île d'Alcatraz, est une île située dans la baie de San Francisco à 2,4 km de la côte de San Francisco en Californie, dans l'ouest des États-Unis.",
    },
     {
      name: "Tour de Pise",
      address: "Piazza del Duomo, 56126 Pisa PI, Italie",
      location: [43.722952,10.3944083],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2975-3898103639-88.jpg",
      description: "La tour de Pise est le campanile de la cathédrale Notre-Dame de l’Assomption de Pise, en Toscane. Elle est située à proximité du chevet de la cathédrale et fait partie des monuments de la piazza dei Miracoli (la « place des Miracles »), classés au patrimoine mondial de l'UNESCO. Sa construction débuta en 1173. Mondialement connue, elle est un des symboles de l’Italie et l’emblème de la ville de Pise.",
     },
     {
      name: "Château de Versailles",
      address: "Place d'Armes, 78000 Versailles",
      location: [48.8048649, 2.1181667],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-317-1229727573-88.jpg",
      description: "Le château de Versailles est un château et un monument historique français qui se situe à Versailles, dans les Yvelines, en France. Il fut la résidence des rois de France Louis XIV, Louis XV et Louis XVI. Le roi et la cour y résidèrent de façon permanente du 6 mai 1682 au 6 octobre 1789, à l'exception des années de la Régence de 1715 à 1723.",
     },
     {
      name: "Statue de la Liberté",
      address: "New York, État de New York 10004, États-Unis",
      location: [40.6892494,-74.0466891],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2612-1070479656-88.jpg",
      description: "La statue de la Liberté (Statue Of Liberty), est l'un des monuments les plus célèbres des États-Unis. Cette statue monumentale est située à New York, sur l'île Liberty Island, au sud de Manhattan, à l'embouchure de l'Hudson et à proximité d'Ellis Island.",
     },
     {
      name: "Sainte-Sophie",
      address: "Sultan Ahmet Mahallesi, Ayasofya Meydanı, 34122 Fatih/İstanbul, Turquie",
      location: [41.008583,28.9779863],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2705-3212734944-88.jpg",
      description: "La basilique Sainte-Sophie est une grande basilique chrétienne de Constantinople construite dans un premier temps au IVe siècle, puis reconstruite bien plus grande au VIe siècle",
     },
     {
      name: "Musée d'Orsay",
      address: "1 Rue de la Légion d'Honneur, 75007 Paris",
      location: [48.8599614,2.3243727],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-2976-790674265-88.jpg",
      description: "Le musée d’Orsay est un musée national inauguré en 1986, situé dans le 7e arrondissement de Paris le long de la rive gauche de la Seine.",
     },
    {
      name: "Taj Mahal",
      address: "Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001, Inde",
      location: [27.1750151,78.0399665],
      date: "tout le temps",
      img: "https://cdn.getyourguide.com/img/location_img-4856-4253588928-88.jpg",
      description: "Le Tāj Mahal qui signifie « le palais de la couronne » en persan, est situé à Agra, au bord de la rivière Yamuna, dans l'État de l'Uttar Pradesh, en Inde. C'est un mausolée de marbre blanc construit par l'empereur moghol musulman Shâh Jahân en mémoire de son épouse Arjumand Bânu Begam, aussi connue sous le nom de Mumtaz Mahal, qui signifie en persan « la lumière du palais ».",
    }
  ];

  Event.insertMany(events)
       .then(function(docs) {
	 res.jsend.success({events: docs});
       })
       .catch(function(err) {
	 // error handling here
         res.status(httpCodes.internalServerError).jsend.error({message: err.message});
       });
});

router.post('/create', function(req, res) {
  var causes = [];

  var event = {
    name: res.req.body.name,
    description: res.req.body.description,
    address: res.req.body.address,
    location: [res.req.body.long, res.req.body.lat],
    img: res.req.body.img,
    date: res.req.body.date
  };

  Event.create(event, function(err, createdEvent) {
    if (err) {
      if (err.errors) {
        if (err.errors.name)
          causes.push(err.errors.name.message);
        if (err.errors.description)
          causes.push(err.errors.description.message);
        if (err.errors.location)
          causes.push(err.errors.location.message);
	if (err.errors.img)
	  causes.push(err.errors.location.img.message);
        if (err.errors.date)
          causes.push(err.errors.date.message)
      }
      res.status(httpCodes.badRequest).jsend.fail({message: 'Create event failed', causes: causes});
      return ;
    }
    
        var response = {
          event: createdEvent
        };
    res.status(httpCodes.created).jsend.success(response);
  });
});

/**
 * Route Get One Event By ID
 */
router.get('/:id', function(req, res) {
    var causes = [];

    Event.findById(req.params.id, function (err, event) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        if (event === null) {
            causes.push('Event not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Get event failed', causes: causes});
            return ;
        }
        res.jsend.success({event: event});
    }).select('-__v');
});

/**
 * Route Get Event Near a Location
 */
router.get('/long/:long/lat/:lat/zoom/:zoom', function(req, res) {
    var causes = [];

    var long = parseFloat(req.params.long);
    var lat = parseFloat(req.params.lat);
    var zoom = parseInt(req.params.zoom);

    if (!long)
        causes.push('A long is required');
    if (!lat)
        causes.push('A lat is required');
    if (!zoom)
        causes.push('A zoom is required');
    if (causes.length > 0) {
        res.status(httpCodes.badRequest).jsend.fail({message: 'Get Event Near Location failed', causes: causes});
        return ;
    }

    Event.find({}, function (err, events) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        res.jsend.success({events: events});
    }).where('location')
        .near({ center: {type: 'Point', coordinates: [long, lat]}, maxDistance: zoomDistanceRatio[zoom - 1], spherical: true})
        .select('-__v');
});

/**
 * Route Get All Events
 */
router.get('/', function(req, res) {
    Event.find({}, function (err, events) {
        if (err) {
            res.status(httpCodes.internalServerError).jsend.error({message: err.message});
            return ;
        }
        res.jsend.success({events: events});
    }).select('-__v');
});

/**
 * Route Delete Event
 */
router.delete('/:id/delete', function(req, res) {
    var causes = [];

    Event.findById(req.params.id, function (err, event) {
        if (err) {
            res.status(httpCodes.badRequest).jsend.error({message: err.message});
            return ;
        }
        if (event === null) {
            causes.push('Event not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Delete event failed', causes: causes});
            return ;
        }

        event.remove(function (err) {
            if (err) {
                res.status(httpCodes.badRequest).jsend.error({message: err.message});
                return ;
            }
            res.jsend.success({message: 'Event successfully deleted'});
        });
    });
});

// Start: Middleware (2)
/**
 * Middleware verify token
 */
router.use(function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (!token) {
        res.status(httpCodes.badRequest).jsend.fail({message: 'No token provided.'});
        return ;
    }
    jwt.verify(token, tokenSecret, function(err, decoded) {
        if (err) {
            res.status(httpCodes.unauthorized).jsend.fail({message: 'Failed to authenticate token'});
            return ;
        }
        req.decoded = decoded;
        next();
    });
});
// End: Middleware (2)

/**
 * Route Waiter Join Event
 */
router.put('/:eventId/join/:waiterId', function(req, res) {
    var causes = [];

    User.findById(req.params.waiterId, function (err, user) {
        if (err) {
            res.status(httpCodes.badRequest).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Join event failed', causes: causes});
            return ;
        }
        Event.findById(req.params.eventId, function (err, event) {
            if (err) {
                res.status(httpCodes.badRequest).jsend.error({message: err.message});
                return ;
            }

            if (event === null) {
                causes.push('Event not found');
                res.status(httpCodes.notFound).jsend.fail({message: 'Join event failed', causes: causes});
                return ;
            }
            if (user.waiterCurrentEvent !== null) {
                causes.push('You have currently a wait in progress');
                res.status(httpCodes.conflict).jsend.fail({message: 'Join event failed', causes: causes});
                return ;
            }


            user.update({waiterCurrentEvent: event._id }, function (err) {
                if (err) {
                    res.status(httpCodes.badRequest).jsend.error({message: err.message});
                    return ;
                }
                event.listOfWaiters.push(user._id);
                event.save(function (err) {
                    if (err) {
                        res.status(httpCodes.badRequest).jsend.error({message: err.message});
                        return ;
                    }
                    res.jsend.success({message: 'You have successfully joined the event'});
                });
            });
        });
    });
});

/**
 * Route Waiter Leave Event
 */
router.put('/:eventId/leave/:waiterId', function(req, res) {
    var causes = [];

    User.findById(req.params.waiterId, function (err, user) {
        if (err) {
            res.status(httpCodes.badRequest).jsend.error({message: err.message});
            return ;
        }
        if (user === null) {
            causes.push('User not found');
            res.status(httpCodes.notFound).jsend.fail({message: 'Leave event failed', causes: causes});
            return ;
        }
        Event.findById(req.params.eventId, function (err, event) {
            if (err) {
                res.status(httpCodes.badRequest).jsend.error({message: err.message});
                return ;
            }

            if (event === null) {
                causes.push('Event not found');
                res.status(httpCodes.notFound).jsend.fail({message: 'Leave event failed', causes: causes});
                return ;
            }

            if (!user.waiterCurrentEvent) {
                causes.push("Waiter hasn't joined any events");
                res.status(httpCodes.conflict).jsend.fail({message: 'Leave event failed', causes: causes});
                return ;
            }

            if (user.waiterCurrentEvent !== req.params.eventId) {
                causes.push("Waiter hasn't joined this event");
                res.status(httpCodes.conflict).jsend.fail({message: 'Leave event failed', causes: causes});
                return ;
            }

            user.update({
                waiterCurrentEvent: null
            }, function (err) {
                if (err) {
                    res.status(httpCodes.badRequest).jsend.error({message: err.message});
                    return ;
                }
                event.listOfWaiters.remove(user._id);
                event.save(function (err) {
                    if (err) {
                        res.status(httpCodes.badRequest).jsend.error({message: err.message});
                        return ;
                    }
                    res.jsend.success({message: 'Waiter has successfully left the event'});
                });
            });
        });
    });
});

module.exports = router;
