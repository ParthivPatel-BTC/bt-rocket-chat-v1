(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var babelHelpers = Package['babel-runtime'].babelHelpers;
var Symbol = Package['ecmascript-runtime'].Symbol;
var Map = Package['ecmascript-runtime'].Map;
var Set = Package['ecmascript-runtime'].Set;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var logger;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_slackbridge/logger.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals logger:true */                                                                                             //
/* exported logger */                                                                                                 //
                                                                                                                      //
logger = new Logger('SlackBridge', {                                                                                  // 4
	sections: {                                                                                                          // 5
		connection: 'Connection',                                                                                           // 6
		events: 'Events'                                                                                                    // 7
	}                                                                                                                    //
});                                                                                                                   //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_slackbridge/settings.js                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.startup(function () {                                                                                          // 1
	RocketChat.settings.addGroup('SlackBridge', function () {                                                            // 2
		this.add('SlackBridge_Enabled', false, {                                                                            // 3
			type: 'boolean',                                                                                                   // 4
			i18nLabel: 'Enabled'                                                                                               // 5
		});                                                                                                                 //
                                                                                                                      //
		this.add('SlackBridge_APIToken', '', {                                                                              // 8
			type: 'string',                                                                                                    // 9
			enableQuery: {                                                                                                     // 10
				_id: 'SlackBridge_Enabled',                                                                                       // 11
				value: true                                                                                                       // 12
			},                                                                                                                 //
			i18nLabel: 'API_Token'                                                                                             // 14
		});                                                                                                                 //
	});                                                                                                                  //
});                                                                                                                   //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_slackbridge/slackbridge.js                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals logger */                                                                                                  //
                                                                                                                      //
var SlackBridge = (function () {                                                                                      //
	function SlackBridge() {                                                                                             // 4
		var _this = this;                                                                                                   //
                                                                                                                      //
		babelHelpers.classCallCheck(this, SlackBridge);                                                                     //
                                                                                                                      //
		this.slackClient = Npm.require('slack-client');                                                                     // 5
		this.apiToken = RocketChat.settings.get('SlackBridge_APIToken');                                                    // 6
		this.rtm = {};                                                                                                      // 7
		this.connected = false;                                                                                             // 8
		this.userTags = {};                                                                                                 // 9
                                                                                                                      //
		RocketChat.settings.onload('SlackBridge_APIToken', function (key, value) {                                          // 11
			_this.apiToken = value;                                                                                            // 12
			if (_this.connected) {                                                                                             // 13
				_this.disconnect();                                                                                               // 14
				_this.connect();                                                                                                  // 15
			} else if (RocketChat.settings.get('SlackBridge_Enabled')) {                                                       //
				_this.connect();                                                                                                  // 17
			}                                                                                                                  //
		});                                                                                                                 //
                                                                                                                      //
		RocketChat.settings.onload('SlackBridge_Enabled', function (key, value) {                                           // 21
			if (value && _this.apiToken) {                                                                                     // 22
				_this.connect();                                                                                                  // 23
			} else {                                                                                                           //
				_this.disconnect();                                                                                               // 25
			}                                                                                                                  //
		});                                                                                                                 //
	}                                                                                                                    //
                                                                                                                      //
	SlackBridge.prototype.connect = (function () {                                                                       // 3
		function connect() {                                                                                                // 30
			if (this.connected === false) {                                                                                    // 31
				this.connected = true;                                                                                            // 32
				logger.connection.info('Connecting via token: ', this.apiToken);                                                  // 33
				var RtmClient = this.slackClient.RtmClient;                                                                       // 34
				this.rtm = new RtmClient(this.apiToken);                                                                          // 35
				this.rtm.start();                                                                                                 // 36
				this.setEvents();                                                                                                 // 37
			}                                                                                                                  //
		}                                                                                                                   //
                                                                                                                      //
		return connect;                                                                                                     //
	})();                                                                                                                //
                                                                                                                      //
	SlackBridge.prototype.disconnect = (function () {                                                                    // 3
		function disconnect() {                                                                                             // 41
			if (this.connected === true) {                                                                                     // 42
				this.rtm.disconnect && this.rtm.disconnect();                                                                     // 43
				this.connected = false;                                                                                           // 44
				logger.connection.info('Disconnected');                                                                           // 45
			}                                                                                                                  //
		}                                                                                                                   //
                                                                                                                      //
		return disconnect;                                                                                                  //
	})();                                                                                                                //
                                                                                                                      //
	SlackBridge.prototype.convertSlackMessageToRocketChat = (function () {                                               // 3
		function convertSlackMessageToRocketChat(message) {                                                                 // 49
			var _this2 = this;                                                                                                 //
                                                                                                                      //
			if (!_.isEmpty(message)) {                                                                                         // 50
				message = message.replace(/<!everyone>/g, '@all');                                                                // 51
				message = message.replace(/<!channel>/g, '@all');                                                                 // 52
				message = message.replace(/&gt;/g, '<');                                                                          // 53
				message = message.replace(/&lt;/g, '>');                                                                          // 54
				message = message.replace(/&amp;/g, '&');                                                                         // 55
				message = message.replace(/:simple_smile:/g, ':smile:');                                                          // 56
				message = message.replace(/:memo:/g, ':pencil:');                                                                 // 57
				message = message.replace(/:piggy:/g, ':pig:');                                                                   // 58
				message = message.replace(/:uk:/g, ':gb:');                                                                       // 59
				message = message.replace(/<(http[s]?:[^>]*)>/g, '$1');                                                           // 60
                                                                                                                      //
				message.replace(/(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g, function (match, userId) {                                 // 62
					if (!_this2.userTags[userId]) {                                                                                  // 63
						_this2.findUser(userId) || _this2.addUser(userId); // This adds userTags for the userId                         // 64
					}                                                                                                                //
					var userTags = _this2.userTags[userId];                                                                          // 66
					if (userTags) {                                                                                                  // 67
						message = message.replace(userTags.slack, userTags.rocket);                                                     // 68
					}                                                                                                                //
				});                                                                                                               //
			} else {                                                                                                           //
				message = '';                                                                                                     // 72
			}                                                                                                                  //
			return message;                                                                                                    // 74
		}                                                                                                                   //
                                                                                                                      //
		return convertSlackMessageToRocketChat;                                                                             //
	})();                                                                                                                //
                                                                                                                      //
	SlackBridge.prototype.findChannel = (function () {                                                                   // 3
		function findChannel(channelId) {                                                                                   // 77
			return RocketChat.models.Rooms.findOneByImportId(channelId);                                                       // 78
		}                                                                                                                   //
                                                                                                                      //
		return findChannel;                                                                                                 //
	})();                                                                                                                //
                                                                                                                      //
	SlackBridge.prototype.addChannel = (function () {                                                                    // 3
		function addChannel(channelId) {                                                                                    // 81
			var _this3 = this;                                                                                                 //
                                                                                                                      //
			var hasRetried = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];                       //
                                                                                                                      //
			var data = null;                                                                                                   // 82
			var isGroup = false;                                                                                               // 83
			if (channelId.charAt(0) === 'C') {                                                                                 // 84
				data = HTTP.get('https://slack.com/api/channels.info', { params: { token: this.apiToken, channel: channelId } });
			} else if (channelId.charAt(0) === 'G') {                                                                          //
				data = HTTP.get('https://slack.com/api/groups.info', { params: { token: this.apiToken, channel: channelId } });   // 87
				isGroup = true;                                                                                                   // 88
			}                                                                                                                  //
			if (data && data.data && data.data.ok === true) {                                                                  // 90
				var _iterator, _isArray, _i;                                                                                      //
                                                                                                                      //
				var _ref;                                                                                                         //
                                                                                                                      //
				var _ret = (function () {                                                                                         //
					var channelData = isGroup ? data.data.group : data.data.channel;                                                 // 91
					var existingRoom = RocketChat.models.Rooms.findOneByName(channelData.name);                                      // 92
					if (existingRoom || channelData.is_general) {                                                                    // 93
						if (channelData.is_general && channelData.name !== (existingRoom && existingRoom.name)) {                       // 94
							Meteor.call('saveRoomSettings', 'GENERAL', 'roomName', channelData.name);                                      // 95
						}                                                                                                               //
						channelData.rocketId = channelData.is_general ? 'GENERAL' : existingRoom._id;                                   // 97
						RocketChat.models.Rooms.update({ _id: channelData.rocketId }, { $addToSet: { importIds: channelData.id } });    // 98
					} else {                                                                                                         //
						var _ret2 = (function () {                                                                                      //
							var users = [];                                                                                                // 100
							for (_iterator = channelData.members, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
								if (_isArray) {                                                                                               //
									if (_i >= _iterator.length) break;                                                                           //
									_ref = _iterator[_i++];                                                                                      //
								} else {                                                                                                      //
									_i = _iterator.next();                                                                                       //
									if (_i.done) break;                                                                                          //
									_ref = _i.value;                                                                                             //
								}                                                                                                             //
                                                                                                                      //
								var member = _ref;                                                                                            //
                                                                                                                      //
								if (member !== channelData.creator) {                                                                         // 102
									var user = _this3.findUser(member) || _this3.addUser(member);                                                // 103
									if (user) {                                                                                                  // 104
										users.push(user.username);                                                                                  // 105
									}                                                                                                            //
								}                                                                                                             //
							}                                                                                                              //
							var creator = _this3.findUser(channelData.creator) || _this3.addUser(channelData.creator);                     // 109
							if (!creator) {                                                                                                // 110
								logger.events.error('Could not fetch room creator information', channelData.creator);                         // 111
								return {                                                                                                      // 112
									v: {                                                                                                         //
										v: undefined                                                                                                //
									}                                                                                                            //
								};                                                                                                            //
							}                                                                                                              //
                                                                                                                      //
							try {                                                                                                          // 115
								Meteor.runAsUser(creator._id, function () {                                                                   // 116
									if (isGroup) {                                                                                               // 117
										var channel = Meteor.call('createPrivateGroup', channelData.name, users);                                   // 118
										channelData.rocketId = channel._id;                                                                         // 119
									} else {                                                                                                     //
										var channel = Meteor.call('createChannel', channelData.name, users);                                        // 121
										channelData.rocketId = channel._id;                                                                         // 122
									}                                                                                                            //
								});                                                                                                           //
							} catch (e) {                                                                                                  //
								if (!hasRetried) {                                                                                            // 126
									// If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.
									Meteor._sleepForMs(1000);                                                                                    // 128
									return {                                                                                                     // 129
										v: {                                                                                                        //
											v: _this3.findChannel(channelId) || _this3.addChannel(channelId, true)                                     //
										}                                                                                                           //
									};                                                                                                           //
								}                                                                                                             //
							}                                                                                                              //
                                                                                                                      //
							var roomUpdate = {                                                                                             // 133
								ts: new Date(channelData.created * 1000)                                                                      // 134
							};                                                                                                             //
							var lastSetTopic = 0;                                                                                          // 136
							if (!_.isEmpty(channelData.topic && channelData.topic.value)) {                                                // 137
								roomUpdate.topic = channelData.topic.value;                                                                   // 138
								lastSetTopic = channelData.topic.last_set;                                                                    // 139
							}                                                                                                              //
							if (!_.isEmpty(channelData.purpose && channelData.purpose.value) && channelData.purpose.last_set > lastSetTopic) {
								roomUpdate.topic = channelData.purpose.value;                                                                 // 142
							}                                                                                                              //
							RocketChat.models.Rooms.update({ _id: channelData.rocketId }, { $set: roomUpdate, $addToSet: { importIds: channelData.id } });
						})();                                                                                                           //
                                                                                                                      //
						if (typeof _ret2 === 'object') return _ret2.v;                                                                  //
					}                                                                                                                //
					return {                                                                                                         // 146
						v: RocketChat.models.Rooms.findOne(channelData.rocketId)                                                        //
					};                                                                                                               //
				})();                                                                                                             //
                                                                                                                      //
				if (typeof _ret === 'object') return _ret.v;                                                                      //
			}                                                                                                                  //
                                                                                                                      //
			return;                                                                                                            // 149
		}                                                                                                                   //
                                                                                                                      //
		return addChannel;                                                                                                  //
	})();                                                                                                                //
                                                                                                                      //
	SlackBridge.prototype.findUser = (function () {                                                                      // 3
		function findUser(userId) {                                                                                         // 152
			var user = RocketChat.models.Users.findOneByImportId(userId);                                                      // 153
			if (user && !this.userTags[userId]) {                                                                              // 154
				this.userTags[userId] = { slack: '<@' + userId + '>', rocket: '@' + user.username };                              // 155
			}                                                                                                                  //
			return user;                                                                                                       // 157
		}                                                                                                                   //
                                                                                                                      //
		return findUser;                                                                                                    //
	})();                                                                                                                //
                                                                                                                      //
	SlackBridge.prototype.addUser = (function () {                                                                       // 3
		function addUser(userId) {                                                                                          // 160
			var _this4 = this;                                                                                                 //
                                                                                                                      //
			var data = HTTP.get('https://slack.com/api/users.info', { params: { token: this.apiToken, user: userId } });       // 161
			if (data && data.data && data.data.ok === true && data.data.user && data.data.user.profile && data.data.user.profile.email) {
				var _ret3 = (function () {                                                                                        //
					var userData = data.data.user;                                                                                   // 163
					var existingUser = RocketChat.models.Users.findOneByEmailAddress(userData.profile.email) || RocketChat.models.Users.findOneByUsername(userData.name);
					if (existingUser) {                                                                                              // 165
						userData.rocketId = existingUser._id;                                                                           // 166
						userData.name = existingUser.username;                                                                          // 167
					} else {                                                                                                         //
						userData.rocketId = Accounts.createUser({ email: userData.profile.email, password: Date.now() + userData.name + userData.profile.email.toUpperCase() });
						Meteor.runAsUser(userData.rocketId, function () {                                                               // 170
							Meteor.call('setUsername', userData.name);                                                                     // 171
							Meteor.call('joinDefaultChannels', true);                                                                      // 172
							var url = null;                                                                                                // 173
							if (userData.profile.image_original) {                                                                         // 174
								url = userData.profile.image_original;                                                                        // 175
							} else if (userData.profile.image_512) {                                                                       //
								url = userData.profile.image_512;                                                                             // 177
							}                                                                                                              //
							Meteor.call('setAvatarFromService', url, null, 'url');                                                         // 179
							// Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600                                  //
							if (userData.tz_offset) {                                                                                      // 181
								Meteor.call('updateUserUtcOffset', userData.tz_offset / 3600);                                                // 182
							}                                                                                                              //
							if (userData.profile.real_name) {                                                                              // 184
								RocketChat.models.Users.setName(userData.rocketId, userData.profile.real_name);                               // 185
								// Deleted users are 'inactive' users in Rocket.Chat                                                          //
								if (userData.deleted) {                                                                                       // 187
									Meteor.call('setUserActiveStatus', userData.rocketId, false);                                                // 188
								}                                                                                                             //
							}                                                                                                              //
						});                                                                                                             //
					}                                                                                                                //
					RocketChat.models.Users.update({ _id: userData.rocketId }, { $addToSet: { importIds: userData.id } });           // 193
					if (!_this4.userTags[userId]) {                                                                                  // 194
						_this4.userTags[userId] = { slack: '<@' + userId + '>', rocket: '@' + userData.name };                          // 195
					}                                                                                                                //
					return {                                                                                                         // 197
						v: RocketChat.models.Users.findOneById(userData.rocketId)                                                       //
					};                                                                                                               //
				})();                                                                                                             //
                                                                                                                      //
				if (typeof _ret3 === 'object') return _ret3.v;                                                                    //
			}                                                                                                                  //
                                                                                                                      //
			return;                                                                                                            // 200
		}                                                                                                                   //
                                                                                                                      //
		return addUser;                                                                                                     //
	})();                                                                                                                //
                                                                                                                      //
	SlackBridge.prototype.saveMessage = (function () {                                                                   // 3
		function saveMessage(room, user, message, msgDataDefaults) {                                                        // 203
			if (message.type === 'message') {                                                                                  // 204
				var msgObj = {};                                                                                                  // 205
				if (!_.isEmpty(message.subtype)) {                                                                                // 206
					msgObj = this.processSubtypedMessage(room, user, message, msgDataDefaults);                                      // 207
					if (!msgObj) {                                                                                                   // 208
						return;                                                                                                         // 209
					}                                                                                                                //
				} else {                                                                                                          //
					msgObj = {                                                                                                       // 212
						msg: this.convertSlackMessageToRocketChat(message.text),                                                        // 213
						rid: room._id,                                                                                                  // 214
						u: {                                                                                                            // 215
							_id: user._id,                                                                                                 // 216
							username: user.username                                                                                        // 217
						}                                                                                                               //
					};                                                                                                               //
				}                                                                                                                 //
				_.extend(msgObj, msgDataDefaults);                                                                                // 221
				if (message.edited) {                                                                                             // 222
					msgObj.ets = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);                                         // 223
				}                                                                                                                 //
				if (message.subtype === 'bot_message') {                                                                          // 225
					user = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 } });                           // 226
				}                                                                                                                 //
				RocketChat.sendMessage(user, msgObj, room);                                                                       // 228
			}                                                                                                                  //
		}                                                                                                                   //
                                                                                                                      //
		return saveMessage;                                                                                                 //
	})();                                                                                                                //
                                                                                                                      //
	SlackBridge.prototype.processSubtypedMessage = (function () {                                                        // 3
		function processSubtypedMessage(room, user, message) {                                                              // 232
			var msgObj = null;                                                                                                 // 233
			switch (message.subtype) {                                                                                         // 234
				case 'bot_message':                                                                                               // 235
					msgObj = {                                                                                                       // 236
						msg: this.convertSlackMessageToRocketChat(message.text),                                                        // 237
						rid: room._id,                                                                                                  // 238
						bot: true,                                                                                                      // 239
						attachments: message.attachments,                                                                               // 240
						username: message.username                                                                                      // 241
					};                                                                                                               //
					if (message.icons) {                                                                                             // 243
						msgObj.emoji = message.icons.emoji;                                                                             // 244
					}                                                                                                                //
					break;                                                                                                           // 246
				case 'me_message':                                                                                                // 247
					return {                                                                                                         // 248
						msg: '_' + this.convertSlackMessageToRocketChat(message.text) + '_'                                             // 249
					};                                                                                                               //
				case 'message_changed':                                                                                           // 250
					this.editMessage(room, user, message);                                                                           // 252
					return;                                                                                                          // 253
				case 'message_deleted':                                                                                           // 253
					msgObj = RocketChat.models.Messages.findOneById(message.channel + 'S' + message.deleted_ts);                     // 255
					if (msgObj) {                                                                                                    // 256
						Meteor.runAsUser(user._id, function () {                                                                        // 257
							Meteor.call('deleteMessage', msgObj);                                                                          // 258
						});                                                                                                             //
					}                                                                                                                //
					return;                                                                                                          // 261
				case 'channel_join':                                                                                              // 262
					return this.joinRoom(room, user);                                                                                // 263
				case 'group_join':                                                                                                // 264
					var inviter = this.findUser(message.inviter) || this.addUser(message.inviter);                                   // 265
					if (inviter) {                                                                                                   // 266
						return this.joinPrivateGroup(inviter, room, user);                                                              // 267
					}                                                                                                                //
					break;                                                                                                           // 269
				case 'channel_leave':                                                                                             // 270
				case 'group_leave':                                                                                               // 271
					return this.leaveRoom(room, user);                                                                               // 272
				case 'channel_topic':                                                                                             // 272
				case 'group_topic':                                                                                               // 274
					this.setRoomTopic(room, user, message.topic);                                                                    // 275
					return;                                                                                                          // 276
				case 'channel_purpose':                                                                                           // 276
				case 'group_purpose':                                                                                             // 278
					this.setRoomTopic(room, user, message.purpose);                                                                  // 279
					return;                                                                                                          // 280
				case 'channel_name':                                                                                              // 280
				case 'group_name':                                                                                                // 282
					this.setRoomName(room, user, message.name);                                                                      // 283
					return;                                                                                                          // 284
				case 'channel_archive':                                                                                           // 284
				case 'group_archive':                                                                                             // 286
					this.archiveRoom(room, user);                                                                                    // 287
					return;                                                                                                          // 288
				case 'channel_unarchive':                                                                                         // 288
				case 'group_unarchive':                                                                                           // 290
					this.unarchiveRoom(room, user);                                                                                  // 291
					return;                                                                                                          // 292
				case 'file_share':                                                                                                // 292
					if (message.file && message.file.url_private_download !== undefined) {                                           // 294
						var details = {                                                                                                 // 295
							message_id: 'S' + message.ts,                                                                                  // 296
							name: message.file.name,                                                                                       // 297
							size: message.file.size,                                                                                       // 298
							type: message.file.mimetype,                                                                                   // 299
							rid: room._id                                                                                                  // 300
						};                                                                                                              //
						return this.uploadFile(details, message.file.url_private_download, user, room, new Date(parseInt(message.ts.split('.')[0]) * 1000));
					}                                                                                                                //
					break;                                                                                                           // 304
				case 'file_comment':                                                                                              // 305
					logger.events.error('File comment not implemented');                                                             // 306
					return;                                                                                                          // 307
				case 'file_mention':                                                                                              // 308
					logger.events.error('File mentioned not implemented');                                                           // 309
					return;                                                                                                          // 310
				case 'pinned_item':                                                                                               // 311
					if (message.attachments && message.attachments[0] && message.attachments[0].text) {                              // 312
						msgObj = {                                                                                                      // 313
							_id: message.attachments[0].channel_id + 'S' + message.attachments[0].ts,                                      // 314
							ts: new Date(parseInt(message.attachments[0].ts.split('.')[0]) * 1000),                                        // 315
							rid: room._id,                                                                                                 // 316
							msg: this.convertSlackMessageToRocketChat(message.attachments[0].text),                                        // 317
							u: {                                                                                                           // 318
								_id: user._id,                                                                                                // 319
								username: user.username                                                                                       // 320
							}                                                                                                              //
						};                                                                                                              //
						Meteor.runAsUser(user._id, function () {                                                                        // 323
							Meteor.call('pinMessage', msgObj);                                                                             // 324
						});                                                                                                             //
					} else {                                                                                                         //
						logger.events.error('Pinned item with no attachment');                                                          // 327
					}                                                                                                                //
					return;                                                                                                          // 329
				case 'unpinned_item':                                                                                             // 330
					logger.events.error('Unpinned item not implemented');                                                            // 331
					return;                                                                                                          // 332
			}                                                                                                                  // 332
		}                                                                                                                   //
                                                                                                                      //
		return processSubtypedMessage;                                                                                      //
	})();                                                                                                                //
                                                                                                                      //
	/**                                                                                                                  //
 * Archives a room                                                                                                    //
 **/                                                                                                                  //
                                                                                                                      //
	SlackBridge.prototype.archiveRoom = (function () {                                                                   // 3
		function archiveRoom(room, user) {                                                                                  // 339
			Meteor.runAsUser(user._id, function () {                                                                           // 340
				return Meteor.call('archiveRoom', room._id);                                                                      // 341
			});                                                                                                                //
		}                                                                                                                   //
                                                                                                                      //
		return archiveRoom;                                                                                                 //
	})();                                                                                                                //
                                                                                                                      //
	/**                                                                                                                  //
 * Unarchives a room                                                                                                  //
 **/                                                                                                                  //
                                                                                                                      //
	SlackBridge.prototype.unarchiveRoom = (function () {                                                                 // 3
		function unarchiveRoom(room, user) {                                                                                // 348
			Meteor.runAsUser(user._id, function () {                                                                           // 349
				return Meteor.call('unarchiveRoom', room._id);                                                                    // 350
			});                                                                                                                //
		}                                                                                                                   //
                                                                                                                      //
		return unarchiveRoom;                                                                                               //
	})();                                                                                                                //
                                                                                                                      //
	/**                                                                                                                  //
 * Adds user to room and sends a message                                                                              //
 **/                                                                                                                  //
                                                                                                                      //
	SlackBridge.prototype.joinRoom = (function () {                                                                      // 3
		function joinRoom(room, user) {                                                                                     // 357
			Meteor.runAsUser(user._id, function () {                                                                           // 358
				return Meteor.call('joinRoom', room._id);                                                                         // 359
			});                                                                                                                //
		}                                                                                                                   //
                                                                                                                      //
		return joinRoom;                                                                                                    //
	})();                                                                                                                //
                                                                                                                      //
	/**                                                                                                                  //
 * Adds user to room and sends a message                                                                              //
 **/                                                                                                                  //
                                                                                                                      //
	SlackBridge.prototype.joinPrivateGroup = (function () {                                                              // 3
		function joinPrivateGroup(inviter, room, user) {                                                                    // 366
			Meteor.runAsUser(inviter._id, function () {                                                                        // 367
				return Meteor.call('addUserToRoom', { rid: room._id, username: user.username });                                  // 368
			});                                                                                                                //
		}                                                                                                                   //
                                                                                                                      //
		return joinPrivateGroup;                                                                                            //
	})();                                                                                                                //
                                                                                                                      //
	/**                                                                                                                  //
 * Removes user from room and sends a message                                                                         //
 **/                                                                                                                  //
                                                                                                                      //
	SlackBridge.prototype.leaveRoom = (function () {                                                                     // 3
		function leaveRoom(room, user) {                                                                                    // 375
			Meteor.runAsUser(user._id, function () {                                                                           // 376
				return Meteor.call('leaveRoom', room._id);                                                                        // 377
			});                                                                                                                //
		}                                                                                                                   //
                                                                                                                      //
		return leaveRoom;                                                                                                   //
	})();                                                                                                                //
                                                                                                                      //
	/**                                                                                                                  //
 * Sets room topic                                                                                                    //
 **/                                                                                                                  //
                                                                                                                      //
	SlackBridge.prototype.setRoomTopic = (function () {                                                                  // 3
		function setRoomTopic(room, user, topic) {                                                                          // 384
			Meteor.runAsUser(user._id, function () {                                                                           // 385
				return Meteor.call('saveRoomSettings', room._id, 'roomTopic', topic);                                             // 386
			});                                                                                                                //
		}                                                                                                                   //
                                                                                                                      //
		return setRoomTopic;                                                                                                //
	})();                                                                                                                //
                                                                                                                      //
	/**                                                                                                                  //
 * Sets room name                                                                                                     //
 **/                                                                                                                  //
                                                                                                                      //
	SlackBridge.prototype.setRoomName = (function () {                                                                   // 3
		function setRoomName(room, user, name) {                                                                            // 393
			Meteor.runAsUser(user._id, function () {                                                                           // 394
				return Meteor.call('saveRoomSettings', room._id, 'roomName', name);                                               // 395
			});                                                                                                                //
		}                                                                                                                   //
                                                                                                                      //
		return setRoomName;                                                                                                 //
	})();                                                                                                                //
                                                                                                                      //
	/**                                                                                                                  //
 * Edits a message                                                                                                    //
 **/                                                                                                                  //
                                                                                                                      //
	SlackBridge.prototype.editMessage = (function () {                                                                   // 3
		function editMessage(room, user, message) {                                                                         // 402
			var msgObj = {                                                                                                     // 403
				_id: message.channel + 'S' + message.message.ts,                                                                  // 404
				rid: room._id,                                                                                                    // 405
				msg: this.convertSlackMessageToRocketChat(message.message.text)                                                   // 406
			};                                                                                                                 //
			Meteor.runAsUser(user._id, function () {                                                                           // 408
				return Meteor.call('updateMessage', msgObj);                                                                      // 409
			});                                                                                                                //
		}                                                                                                                   //
                                                                                                                      //
		return editMessage;                                                                                                 //
	})();                                                                                                                //
                                                                                                                      //
	/**                                                                                                                  //
 Uploads the file to the storage.                                                                                     //
 @param [Object] details an object with details about the upload. name, size, type, and rid                           //
 @param [String] fileUrl url of the file to download/import                                                           //
 @param [Object] user the Rocket.Chat user                                                                            //
 @param [Object] room the Rocket.Chat room                                                                            //
 @param [Date] timeStamp the timestamp the file was uploaded                                                          //
 **/                                                                                                                  //
                                                                                                                      //
	SlackBridge.prototype.uploadFile = (function () {                                                                    // 3
		function uploadFile(details, fileUrl, user, room, timeStamp) {                                                      // 421
			HTTP.get(fileUrl, Meteor.bindEnvironment(function (stream) {                                                       // 422
				var fileId = Meteor.fileStore.create(details);                                                                    // 423
				if (fileId) {                                                                                                     // 424
					Meteor.fileStore.write(stream, fileId, function (err, file) {                                                    // 425
						if (err) {                                                                                                      // 426
							throw new Error(err);                                                                                          // 427
						} else {                                                                                                        //
							var url = file.url.replace(Meteor.absoluteUrl(), '/');                                                         // 429
							var attachment = {                                                                                             // 430
								title: 'File Uploaded: ' + file.name,                                                                         // 431
								title_link: url                                                                                               // 432
							};                                                                                                             //
                                                                                                                      //
							if (/^image\/.+/.test(file.type)) {                                                                            // 435
								attachment.image_url = url;                                                                                   // 436
								attachment.image_type = file.type;                                                                            // 437
								attachment.image_size = file.size;                                                                            // 438
								attachment.image_dimensions = file.identify && file.identify.size;                                            // 439
							}                                                                                                              //
							if (/^audio\/.+/.test(file.type)) {                                                                            // 441
								attachment.audio_url = url;                                                                                   // 442
								attachment.audio_type = file.type;                                                                            // 443
								attachment.audio_size = file.size;                                                                            // 444
							}                                                                                                              //
							if (/^video\/.+/.test(file.type)) {                                                                            // 446
								attachment.video_url = url;                                                                                   // 447
								attachment.video_type = file.type;                                                                            // 448
								attachment.video_size = file.size;                                                                            // 449
							}                                                                                                              //
                                                                                                                      //
							var msg = {                                                                                                    // 452
								rid: details.rid,                                                                                             // 453
								ts: timeStamp,                                                                                                // 454
								msg: '',                                                                                                      // 455
								file: {                                                                                                       // 456
									_id: file._id                                                                                                // 457
								},                                                                                                            //
								groupable: false,                                                                                             // 459
								attachments: [attachment]                                                                                     // 460
							};                                                                                                             //
                                                                                                                      //
							if (details.message_id && typeof details.message_id === 'string') {                                            // 463
								msg['_id'] = details.message_id;                                                                              // 464
							}                                                                                                              //
                                                                                                                      //
							return RocketChat.sendMessage(user, msg, room);                                                                // 467
						}                                                                                                               //
					});                                                                                                              //
				}                                                                                                                 //
			}));                                                                                                               //
		}                                                                                                                   //
                                                                                                                      //
		return uploadFile;                                                                                                  //
	})();                                                                                                                //
                                                                                                                      //
	SlackBridge.prototype.setEvents = (function () {                                                                     // 3
		function setEvents() {                                                                                              // 474
			var _this5 = this;                                                                                                 //
                                                                                                                      //
			var CLIENT_EVENTS = this.slackClient.CLIENT_EVENTS;                                                                // 475
			this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function () {                                                         // 476
				logger.connection.info('Connected');                                                                              // 477
			});                                                                                                                //
                                                                                                                      //
			this.rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, function () {                                                   // 480
				_this5.disconnect();                                                                                              // 481
			});                                                                                                                //
                                                                                                                      //
			this.rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, function () {                                                            // 484
				_this5.disconnect();                                                                                              // 485
			});                                                                                                                //
                                                                                                                      //
			var RTM_EVENTS = this.slackClient.RTM_EVENTS;                                                                      // 488
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when someone messages a channel the bot is in                                                        //
   * {                                                                                                                //
   *	type: 'message',                                                                                                 //
   * 	channel: [channel_id],                                                                                          //
   * 	user: [user_id],                                                                                                //
   * 	text: [message],                                                                                                //
   * 	ts: [ts.milli],                                                                                                 //
   * 	team: [team_id],                                                                                                //
   * 	subtype: [message_subtype],                                                                                     //
   * 	inviter: [message_subtype = 'group_join|channel_join' -> user_id]                                               //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.MESSAGE, Meteor.bindEnvironment(function (message) {                                        // 503
				logger.events.debug('MESSAGE: ', message);                                                                        // 504
				if (message) {                                                                                                    // 505
					var channel = _this5.findChannel(message.channel) || _this5.addChannel(message.channel);                         // 506
					var user = null;                                                                                                 // 507
					if (message.subtype === 'message_deleted' || message.subtype === 'message_changed') {                            // 508
						user = _this5.findUser(message.previous_message.user) || _this5.addUser(message.previous_message.user);         // 509
					} else {                                                                                                         //
						user = _this5.findUser(message.user) || _this5.addUser(message.user);                                           // 511
					}                                                                                                                //
					if (channel && user) {                                                                                           // 513
						var msgDataDefaults = {                                                                                         // 514
							_id: message.channel + 'S' + message.ts,                                                                       // 515
							ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)                                                        // 516
						};                                                                                                              //
						_this5.saveMessage(channel, user, message, msgDataDefaults);                                                    // 518
					}                                                                                                                //
				}                                                                                                                 //
			}));                                                                                                               //
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when someone creates a public channel                                                                //
   * {                                                                                                                //
   *	type: 'channel_created',                                                                                         //
   *	channel: {                                                                                                       //
   *		id: [channel_id],                                                                                               //
   *		is_channel: true,                                                                                               //
   *		name: [channel_name],                                                                                           //
   *		created: [ts],                                                                                                  //
   *		creator: [user_id],                                                                                             //
   *		is_shared: false,                                                                                               //
   *		is_org_shared: false                                                                                            //
   *	},                                                                                                               //
   *	event_ts: [ts.milli]                                                                                             //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.CHANNEL_CREATED, Meteor.bindEnvironment(function () {}));                                   // 539
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when the bot joins a public channel                                                                  //
   * {                                                                                                                //
   * 	type: 'channel_joined',                                                                                         //
   * 	channel: {                                                                                                      //
   * 		id: [channel_id],                                                                                              //
   * 		name: [channel_name],                                                                                          //
   * 		is_channel: true,                                                                                              //
   * 		created: [ts],                                                                                                 //
   * 		creator: [user_id],                                                                                            //
   * 		is_archived: false,                                                                                            //
   * 		is_general: false,                                                                                             //
   * 		is_member: true,                                                                                               //
   * 		last_read: [ts.milli],                                                                                         //
   * 		latest: [message_obj],                                                                                         //
   * 		unread_count: 0,                                                                                               //
   * 		unread_count_display: 0,                                                                                       //
   * 		members: [ user_ids ],                                                                                         //
   * 		topic: {                                                                                                       //
   * 			value: [channel_topic],                                                                                       //
   * 			creator: [user_id],                                                                                           //
   * 			last_set: 0                                                                                                   //
   * 		},                                                                                                             //
   * 		purpose: {                                                                                                     //
   * 			value: [channel_purpose],                                                                                     //
   * 			creator: [user_id],                                                                                           //
   * 			last_set: 0                                                                                                   //
   * 		}                                                                                                              //
   * 	}                                                                                                               //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.CHANNEL_JOINED, Meteor.bindEnvironment(function () {}));                                    // 572
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when the bot leaves (or is removed from) a public channel                                            //
   * {                                                                                                                //
   * 	type: 'channel_left',                                                                                           //
   * 	channel: [channel_id]                                                                                           //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.CHANNEL_LEFT, Meteor.bindEnvironment(function () {}));                                      // 581
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when an archived channel is deleted by an admin                                                      //
   * {                                                                                                                //
   * 	type: 'channel_deleted',                                                                                        //
   * 	channel: [channel_id],                                                                                          //
   *	event_ts: [ts.milli]                                                                                             //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.CHANNEL_DELETED, Meteor.bindEnvironment(function () {}));                                   // 591
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when the channel has its name changed                                                                //
   * {                                                                                                                //
   * 	type: 'channel_rename',                                                                                         //
   * 	channel: {                                                                                                      //
   * 		id: [channel_id],                                                                                              //
   * 		name: [channel_name],                                                                                          //
   * 		is_channel: true,                                                                                              //
   * 		created: [ts]                                                                                                  //
   * 	},                                                                                                              //
   *	event_ts: [ts.milli]                                                                                             //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.CHANNEL_RENAME, Meteor.bindEnvironment(function () {}));                                    // 606
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when the bot joins a private channel                                                                 //
   * {                                                                                                                //
   * 	type: 'group_joined',                                                                                           //
   * 	channel: {                                                                                                      //
   * 		id: [channel_id],                                                                                              //
   * 		name: [channel_name],                                                                                          //
   * 		is_group: true,                                                                                                //
   * 		created: [ts],                                                                                                 //
   * 		creator: [user_id],                                                                                            //
   * 		is_archived: false,                                                                                            //
   * 		is_mpim: false,                                                                                                //
   * 		is_open: true,                                                                                                 //
   * 		last_read: [ts.milli],                                                                                         //
   * 		latest: [message_obj],                                                                                         //
   * 		unread_count: 0,                                                                                               //
   * 		unread_count_display: 0,                                                                                       //
   * 		members: [ user_ids ],                                                                                         //
   * 		topic: {                                                                                                       //
   * 			value: [channel_topic],                                                                                       //
   * 			creator: [user_id],                                                                                           //
   * 			last_set: 0                                                                                                   //
   * 		},                                                                                                             //
   * 		purpose: {                                                                                                     //
   * 			value: [channel_purpose],                                                                                     //
   * 			creator: [user_id],                                                                                           //
   * 			last_set: 0                                                                                                   //
   * 		}                                                                                                              //
   * 	}                                                                                                               //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.GROUP_JOINED, Meteor.bindEnvironment(function () {}));                                      // 639
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when the bot leaves (or is removed from) a private channel                                           //
   * {                                                                                                                //
   * 	type: 'group_left',                                                                                             //
   * 	channel: [channel_id]                                                                                           //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.GROUP_LEFT, Meteor.bindEnvironment(function () {}));                                        // 648
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when the private channel has its name changed                                                        //
   * {                                                                                                                //
   * 	type: 'group_rename',                                                                                           //
   * 	channel: {                                                                                                      //
   * 		id: [channel_id],                                                                                              //
   * 		name: [channel_name],                                                                                          //
   * 		is_group: true,                                                                                                //
   * 		created: [ts]                                                                                                  //
   * 	},                                                                                                              //
   *	event_ts: [ts.milli]                                                                                             //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.GROUP_RENAME, Meteor.bindEnvironment(function () {}));                                      // 663
                                                                                                                      //
			/**                                                                                                                //
   * Event fired when a new user joins the team                                                                       //
   * {                                                                                                                //
   * 	type: 'team_join',                                                                                              //
   * 	user:                                                                                                           //
   * 	{                                                                                                               //
   * 		id: [user_id],                                                                                                 //
   * 		team_id: [team_id],                                                                                            //
   * 		name: [user_name],                                                                                             //
   * 		deleted: false,                                                                                                //
   * 		status: null,                                                                                                  //
   * 		color: [color_code],                                                                                           //
   * 		real_name: '',                                                                                                 //
   * 		tz: [timezone],                                                                                                //
   * 		tz_label: [timezone_label],                                                                                    //
   * 		tz_offset: [timezone_offset],                                                                                  //
   * 		profile:                                                                                                       //
   * 		{                                                                                                              //
   * 			avatar_hash: '',                                                                                              //
   * 			real_name: '',                                                                                                //
   * 			real_name_normalized: '',                                                                                     //
   * 			email: '',                                                                                                    //
   * 			image_24: '',                                                                                                 //
   * 			image_32: '',                                                                                                 //
   * 			image_48: '',                                                                                                 //
   * 			image_72: '',                                                                                                 //
   * 			image_192: '',                                                                                                //
   * 			image_512: '',                                                                                                //
   * 			fields: null                                                                                                  //
   * 		},                                                                                                             //
   * 		is_admin: false,                                                                                               //
   * 		is_owner: false,                                                                                               //
   * 		is_primary_owner: false,                                                                                       //
   * 		is_restricted: false,                                                                                          //
   * 		is_ultra_restricted: false,                                                                                    //
   * 		is_bot: false,                                                                                                 //
   * 		presence: [user_presence]                                                                                      //
   * 	},                                                                                                              //
   * 	cache_ts: [ts]                                                                                                  //
   * }                                                                                                                //
   **/                                                                                                                //
			this.rtm.on(RTM_EVENTS.TEAM_JOIN, Meteor.bindEnvironment(function () {}));                                         // 706
		}                                                                                                                   //
                                                                                                                      //
		return setEvents;                                                                                                   //
	})();                                                                                                                //
                                                                                                                      //
	return SlackBridge;                                                                                                  //
})();                                                                                                                 //
                                                                                                                      //
RocketChat.SlackBridge = new SlackBridge();                                                                           // 710
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package['rocketchat:slackbridge'] = {};

})();

//# sourceMappingURL=rocketchat_slackbridge.js.map
