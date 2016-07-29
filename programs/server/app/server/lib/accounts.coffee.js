(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// server/lib/accounts.coffee.js                                       //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var accountsConfig, resetPasswordHtml, verifyEmailHtml,                // 2
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
                                                                       //
accountsConfig = {                                                     // 2
  forbidClientAccountCreation: true,                                   // 2
  loginExpirationInDays: RocketChat.settings.get('Accounts_LoginExpiration')
};                                                                     //
                                                                       //
Accounts.config(accountsConfig);                                       // 2
                                                                       //
RocketChat.settings.get('Accounts_AllowedDomainsList', function(_id, value) {
  var domainWhiteList, restrictCreationByEmailDomain;                  // 6
  domainWhiteList = _.map(value.split(','), function(domain) {         // 6
    return domain.trim();                                              //
  });                                                                  //
  restrictCreationByEmailDomain = domainWhiteList.length === 1 ? domainWhiteList[0] : function(email) {
    var domain, i, len, ret;                                           // 8
    ret = false;                                                       // 8
    for (i = 0, len = domainWhiteList.length; i < len; i++) {          // 9
      domain = domainWhiteList[i];                                     //
      if (email.match('@' + RegExp.escape(domain) + '$')) {            // 10
        ret = true;                                                    // 11
        break;                                                         // 12
      }                                                                //
    }                                                                  // 9
    return ret;                                                        // 14
  };                                                                   //
  delete Accounts._options['restrictCreationByEmailDomain'];           // 6
  if (!_.isEmpty(value)) {                                             // 17
    return Accounts.config({                                           //
      restrictCreationByEmailDomain: restrictCreationByEmailDomain     // 18
    });                                                                //
  }                                                                    //
});                                                                    // 5
                                                                       //
Accounts.emailTemplates.siteName = RocketChat.settings.get('Site_Name');
                                                                       //
Accounts.emailTemplates.from = (RocketChat.settings.get('Site_Name')) + " <" + (RocketChat.settings.get('From_Email')) + ">";
                                                                       //
verifyEmailHtml = Accounts.emailTemplates.verifyEmail.text;            // 2
                                                                       //
Accounts.emailTemplates.verifyEmail.html = function(user, url) {       // 2
  url = url.replace(Meteor.absoluteUrl(), Meteor.absoluteUrl() + 'login/');
  return verifyEmailHtml(user, url);                                   //
};                                                                     // 24
                                                                       //
resetPasswordHtml = Accounts.emailTemplates.resetPassword.text;        // 2
                                                                       //
Accounts.emailTemplates.resetPassword.html = function(user, url) {     // 2
  url = url.replace(/\/#\//, '/');                                     // 30
  return resetPasswordHtml(user, url);                                 //
};                                                                     // 29
                                                                       //
Accounts.emailTemplates.enrollAccount.subject = function(user) {       // 2
  var subject;                                                         // 34
  if (RocketChat.settings.get('Accounts_Enrollment_Customized')) {     // 34
    subject = RocketChat.settings.get('Accounts_Enrollment_Email_Subject');
  } else {                                                             //
    subject = TAPi18n.__('Accounts_Enrollment_Email_Subject_Default', {
      lng: (user != null ? user.language : void 0) || RocketChat.settings.get('language') || 'en'
    });                                                                //
  }                                                                    //
  return RocketChat.placeholders.replace(subject);                     // 39
};                                                                     // 33
                                                                       //
Accounts.emailTemplates.enrollAccount.html = function(user, url) {     // 2
  var footer, header, html, ref, ref1;                                 // 43
  if (RocketChat.settings.get('Accounts_Enrollment_Customized')) {     // 43
    html = RocketChat.settings.get('Accounts_Enrollment_Email');       // 44
  } else {                                                             //
    html = TAPi18n.__('Accounts_Enrollment_Email_Default', {           // 46
      lng: (user != null ? user.language : void 0) || RocketChat.settings.get('language') || 'en'
    });                                                                //
  }                                                                    //
  header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || "");
  footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || "");
  html = RocketChat.placeholders.replace(html, {                       // 43
    name: user.name,                                                   // 50
    email: (ref = user.emails) != null ? (ref1 = ref[0]) != null ? ref1.address : void 0 : void 0
  });                                                                  //
  return header + html + footer;                                       // 55
};                                                                     // 41
                                                                       //
Accounts.onCreateUser(function(options, user) {                        // 2
  var ref, ref1, ref2, service, serviceName;                           // 62
  RocketChat.callbacks.run('beforeCreateUser', options, user);         // 62
  user.status = 'offline';                                             // 62
  user.active = !RocketChat.settings.get('Accounts_ManuallyApproveNewUsers');
  if (((user != null ? user.name : void 0) == null) || user.name === '') {
    if (((ref = options.profile) != null ? ref.name : void 0) != null) {
      user.name = (ref1 = options.profile) != null ? ref1.name : void 0;
    }                                                                  //
  }                                                                    //
  if (user.services != null) {                                         // 71
    ref2 = user.services;                                              // 72
    for (serviceName in ref2) {                                        // 72
      service = ref2[serviceName];                                     //
      if (((user != null ? user.name : void 0) == null) || user.name === '') {
        if (service.name != null) {                                    // 74
          user.name = service.name;                                    // 75
        } else if (service.username != null) {                         //
          user.name = service.username;                                // 77
        }                                                              //
      }                                                                //
      if ((user.emails == null) && (service.email != null)) {          // 79
        user.emails = [                                                // 80
          {                                                            //
            address: service.email,                                    // 81
            verified: true                                             // 81
          }                                                            //
        ];                                                             //
      }                                                                //
    }                                                                  // 72
  }                                                                    //
  return user;                                                         // 85
});                                                                    // 57
                                                                       //
Accounts.insertUserDoc = _.wrap(Accounts.insertUserDoc, function(insertUserDoc, options, user) {
  var _id, hasAdmin, roles;                                            // 89
  roles = [];                                                          // 89
  if (Match.test(user.globalRoles, [String]) && user.globalRoles.length > 0) {
    roles = roles.concat(user.globalRoles);                            // 91
  }                                                                    //
  delete user.globalRoles;                                             // 89
  if (user.type == null) {                                             //
    user.type = 'user';                                                //
  }                                                                    //
  _id = insertUserDoc.call(Accounts, options, user);                   // 89
  if (roles.length === 0) {                                            // 99
    hasAdmin = RocketChat.models.Users.findOne({                       // 101
      roles: 'admin'                                                   // 101
    }, {                                                               //
      fields: {                                                        // 101
        _id: 1                                                         // 101
      }                                                                //
    });                                                                //
    if (hasAdmin != null) {                                            // 102
      roles.push('user');                                              // 103
    } else {                                                           //
      roles.push('admin');                                             // 105
    }                                                                  //
  }                                                                    //
  RocketChat.authz.addUserRoles(_id, roles);                           // 89
  RocketChat.callbacks.run('afterCreateUser', options, user);          // 89
  return _id;                                                          // 110
});                                                                    // 88
                                                                       //
Accounts.validateLoginAttempt(function(login) {                        // 2
  var ref, ref1, validEmail;                                           // 113
  login = RocketChat.callbacks.run('beforeValidateLogin', login);      // 113
  if (login.allowed !== true) {                                        // 115
    return login.allowed;                                              // 116
  }                                                                    //
  if (!!((ref = login.user) != null ? ref.active : void 0) !== true) {
    throw new Meteor.Error('error-user-is-not-activated', 'User is not activated', {
      "function": 'Accounts.validateLoginAttempt'                      // 119
    });                                                                //
    return false;                                                      // 120
  }                                                                    //
  if (indexOf.call((ref1 = login.user) != null ? ref1.roles : void 0, 'admin') < 0 && login.type === 'password' && RocketChat.settings.get('Accounts_EmailVerification') === true) {
    validEmail = login.user.emails.filter(function(email) {            // 124
      return email.verified === true;                                  // 125
    });                                                                //
    if (validEmail.length === 0) {                                     // 127
      throw new Meteor.Error('error-invalid-email', 'Invalid email __email__');
      return false;                                                    // 129
    }                                                                  //
  }                                                                    //
  RocketChat.models.Users.updateLastLoginById(login.user._id);         // 113
  Meteor.defer(function() {                                            // 113
    return RocketChat.callbacks.run('afterValidateLogin', login);      //
  });                                                                  //
  return true;                                                         // 136
});                                                                    // 112
                                                                       //
Accounts.validateNewUser(function(user) {                              // 2
  var ref;                                                             // 139
  if (RocketChat.settings.get('Accounts_Registration_AuthenticationServices_Enabled') === false && RocketChat.settings.get('LDAP_Enable') === false && (((ref = user.services) != null ? ref.password : void 0) == null)) {
    throw new Meteor.Error('registration-disabled-authentication-services', 'User registration is disabled for authentication services');
  }                                                                    //
  return true;                                                         // 141
});                                                                    // 138
                                                                       //
/////////////////////////////////////////////////////////////////////////

}).call(this);

//# sourceMappingURL=accounts.coffee.js.map
