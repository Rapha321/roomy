const express = require('express');
const router = express.Router();

module.exports = (knex) => {
  router.get('/', (req, res) => {
    knex.select('*')
      .from('places')
      .then( (results) => {
        res.send(results);
      });
  });


  router.post('/new', (req, res) => {
    console.log(req.body);

    let newPlace = {
      postalCode: req.body.newPlace.postalCode,
      streetNumber: req.body.newPlace.streetNumber,
      streetName: req.body.newPlace.streetName,
      unitNumber: req.body.newPlace.unitNumber,
      neighbourhood: req.body.newPlace.neighbourhood,
      buildingType: req.body.newPlace.buildingType,
      price: req.body.newPlace.price,
      description: req.body.newPlace.description,
      bathrooms: req.body.newPlace.bathrooms,
      laundry: req.body.newPlace.laundry,
      furnished: req.body.newPlace.furnished,
      ac: req.body.newPlace.ac,
      parking: req.body.newPlace.parking,
      lat: req.body.newPlace.lat,
      lng: req.body.newPlace.lng
    }

    console.log(newPlace)

    knex('places')
    .insert({postal_code: newPlace.postalCode,
             street_number: newPlace.streetNumber,
             street_name: newPlace.streetName,
             unit_number: newPlace.unitNumber,
             city: 'Toronto',
             price: newPlace.price,
             number_of_bathrooms: newPlace.bathrooms,
             neighbourhood: newPlace.neighbourhood,
             type_of_building: newPlace.buildingType,
             description: newPlace.description,
             laundry: newPlace.laundry,
             furnished: newPlace.furnished,
             air_condition: newPlace.ac,
             parking: newPlace.parking,
             lat: newPlace.lat,
             lng: newPlace.lng
    })
    .then ( () => {
      console.log("Succesfully inserted data to places");
    });



  });

  //work-around to send user data. Using POST instead of GET
  router.post('/:id', (req, res) =>{
    dummyId = 10;//grab data from req.body current user
    //DUmmy users
    const profile1 = {
      gender: 'male',
      smoker: false,
      pets: true,
      work_sched: 'day',
      cleanliness: 'medium',
      go_out_freq: 'high',
      guests_freq: 'low',
      hobbies: ['Reading', 'Video Games'],
      diet: 'none',
      personality: 'introvert'
    }
    const profile2 = {
      gender: 'male',
      smoker: false,
      pets: true,
      work_sched: 'day',
      cleanliness: 'medium',
      go_out_freq: 'high',
      guests_freq: 'low',
      hobbies: ['Reading', 'Video Games'],
      diet: 'none',
      personality: 'introvert'
    }

    let owner = {};
    let current_user = req.body.user_info;
    console.log("CurrentUser:", current_user)
    let place = {};
    //get the place w/ params.id and get the corresponding place owner profile
    //SELECT * FROM places JOIN users ON users.id=places.user_id;
    knex.select('*')
      .from('places')
      .where('id', req.params.id)
      .then( (results) => {
        place = results[0];
        getUserInfo(results[0].user_id)
        .then((owner_info) => {
          owner = owner_info;
          //compare mathcing %
          //console.log("Matching %:", compareUsers(profile1, profile2));
          place['matchPercent'] = compareUsers(current_user, owner);
          res.send(place);
 
        });


        
      })
    
    
  });

  async function getUserInfo(id) {
    const info = await knex('users').select('*').where('id', id).returning('*');
    return info;
  }

  //compares users profiles and gives a % matching
  function compareUsers(user1, user2) {
    let weight = {
      gender: 5,
      smoker: 5,
      pets: 5,
      work_sched: 10,
      cleanliness: 10,
      go_out_freq: 5,
      guests_freq: 5,
      hobbies: 20,
      diet: 5,
      personality: 10
    }
    let maxScore = 0;
    for (i in weight){
      maxScore += weight[i];
    }
    let scores = [];
    let finalScore = 0;

    //Calculate weighted score for attributes that should match 1:1
    function _score1To1(user1, user2, attrName){
      if(user1[attrName] === user2[attrName]){
        scores.push(1 * weight[attrName]);
      }
      else {
        scores.push(0);
      }
    }

    //Calculate weighted score for attributes that have 3 options low, medium, high
    function _score3(user1, user2, attrName, attrWeight){
      let user1_attr = _convertToNum(user1[attrName]);
      let user2_attr = _convertToNum(user2[attrName]);
      
      switch (user1_attr - user2_attr){
        case 0:
          scores.push(1 * attrWeight);
          break;
        case 1:
          scores.push(0.5 * attrWeight)
          break;
        case 2:
          scores.push(0 * attrWeight)
          break;
        default:
          return Error("Err on weighted scores calc")
      }
    }

    //take array of hobbies from 2 users and calc % matching
    function _scoreHobbies(user1, user2){
      const total = user1.length;
      let matches = 0;

      user1.forEach( hobby1 => {
        if (user2.indexOf(hobby1) >= 0){
          matches++;
        }
      })

      return (matches / total);
    }

    function _convertToNum(rank) {
      switch (rank.toLowerCase()){
        case "low":
          return 0;
          break;
        case "moderate":
          return 1;
          break;
        case "high":
          return 2;
          break;
        default:
          return Error("Err: convert ranking to number"); 
      }
    }

    //go thru profile attributes
      //compare each attribute
      //provide % match for the attribute
      //get weighted score for the attribute
    _score1To1(user1, user2, 'gender');
    _score1To1(user1, user2, 'smoker');
    _score1To1(user1, user2, 'pets');
    _score1To1(user1, user2, 'work_sched');
    _score1To1(user1, user2, 'diet');
    _score1To1(user1, user2, 'personality');
    _score3(user1, user2, 'cleanliness', weight.cleanliness);
    _score3(user1, user2, 'go_out_freq', weight.go_out_freq);
    _score3(user1, user2, 'guests_freq', weight.guests_freq);
  
    scores.push(_scoreHobbies(user1.hobbies, user2.hobbies) * weight.hobbies);

    //total all weighted scores for all attributes
    scores.forEach((score) => {
      finalScore += score;
    })
    //console.log("Matching scores:", scores);
    //console.log("max scores:", maxScore);

    return (finalScore / maxScore);
  }



  

  return router;
}



