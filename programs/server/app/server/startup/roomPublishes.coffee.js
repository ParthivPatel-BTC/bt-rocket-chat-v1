(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// server/startup/roomPublishes.coffee.js                              //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function() {                                            // 1
  RocketChat.roomTypes.setPublish('c', function(identifier) {          // 2
    var options, ref, roomId;                                          // 3
    options = {                                                        // 3
      fields: {                                                        // 4
        name: 1,                                                       // 5
        t: 1,                                                          // 5
        cl: 1,                                                         // 5
        u: 1,                                                          // 5
        usernames: 1,                                                  // 5
        topic: 1,                                                      // 5
        muted: 1,                                                      // 5
        archived: 1,                                                   // 5
        jitsiTimeout: 1                                                // 5
      }                                                                //
    };                                                                 //
    if (RocketChat.authz.hasPermission(this.userId, 'view-c-room')) {  // 15
      return RocketChat.models.Rooms.findByTypeAndName('c', identifier, options);
    } else if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room')) {
      roomId = RocketChat.models.Subscriptions.findByTypeNameAndUserId('c', identifier, this.userId).fetch();
      if (roomId.length > 0) {                                         // 19
        return RocketChat.models.Rooms.findById((ref = roomId[0]) != null ? ref.rid : void 0, options);
      }                                                                //
    }                                                                  //
    return this.ready();                                               // 21
  });                                                                  //
  RocketChat.roomTypes.setPublish('p', function(identifier) {          // 2
    var options, user;                                                 // 24
    options = {                                                        // 24
      fields: {                                                        // 25
        name: 1,                                                       // 26
        t: 1,                                                          // 26
        cl: 1,                                                         // 26
        u: 1,                                                          // 26
        usernames: 1,                                                  // 26
        topic: 1,                                                      // 26
        muted: 1,                                                      // 26
        archived: 1,                                                   // 26
        jitsiTimeout: 1                                                // 26
      }                                                                //
    };                                                                 //
    user = RocketChat.models.Users.findOneById(this.userId, {          // 24
      fields: {                                                        // 36
        username: 1                                                    // 36
      }                                                                //
    });                                                                //
    return RocketChat.models.Rooms.findByTypeAndNameContainingUsername('p', identifier, user.username, options);
  });                                                                  //
  return RocketChat.roomTypes.setPublish('d', function(identifier) {   //
    var options, user;                                                 // 40
    options = {                                                        // 40
      fields: {                                                        // 41
        name: 1,                                                       // 42
        t: 1,                                                          // 42
        cl: 1,                                                         // 42
        u: 1,                                                          // 42
        usernames: 1,                                                  // 42
        topic: 1,                                                      // 42
        jitsiTimeout: 1                                                // 42
      }                                                                //
    };                                                                 //
    user = RocketChat.models.Users.findOneById(this.userId, {          // 40
      fields: {                                                        // 50
        username: 1                                                    // 50
      }                                                                //
    });                                                                //
    if (RocketChat.authz.hasPermission(this.userId, 'view-d-room')) {  // 51
      return RocketChat.models.Rooms.findByTypeContainigUsernames('d', [user.username, identifier], options);
    }                                                                  //
    return this.ready();                                               // 53
  });                                                                  //
});                                                                    // 1
                                                                       //
/////////////////////////////////////////////////////////////////////////

}).call(this);

//# sourceMappingURL=roomPublishes.coffee.js.map
