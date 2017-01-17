WordList = new Mongo.Collection('words');

var lookUpWord; 

if(Meteor.isClient){

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_AND_EMAIL"
	});

	


	Meteor.subscribe('theWords');

	


	Template.SpellingBee.helpers({
		'words': function(){
			var onlyWord = Session.get('selectedWord');
			return WordList.findOne(onlyWord);
		},
		'dashedWord': function(){
			var dashed = Session.get('dashes');
			return dashed;
		}
	});

	


	Template.wordOnly.helpers({
		'justWord': function(){
			return WordList.find({}, {sort: {word: 1}});
		}
	});

	


	Template.removeOneWord.helpers({
		'remove': function(){
			var onlyWord = Session.get('selectedWord');
			return WordList.findOne(onlyWord);
		}
	});

	


	Template.wordOnly.events({
		'click .dash': function(){
			var str = this.word;
			newstr = str.charAt(0);
			strlength = str.length;
			for (i = 1; i < strlength; i++) {
				newstr = newstr.concat("-", str.charAt(i));
			}

			Session.set('dashes', newstr);
			Session.set('selectedWord', this._id);
			var selectedWord = Session.get('selectedWord');
		},

		'click .remove': function(){
			var removeWord = Session.get('selectedWord');
			removed = WordList.findOne(removeWord)

			if (confirm("Are you sure you want to delete '" + removed.word + "'")) {
				Meteor.call('removeOneWord', removeWord);
				$('.main_word').text("");
				// console.log("removed");
			}
		}
	});

	


	Template.addWordForm.events({
		'submit form': function(){
			event.preventDefault();

			lookUpWord = event.target.wordName.value;

			Meteor.call('getData', lookUpWord, function(error, result){
				Meteor.setTimeout(function(){
   					console.log("Timeout called after three seconds..."); }, 1000);
				if(error){
					console.log(error);
				}else{
					console.log(result);
		
					var begin = result.indexOf("<definition>") + "<definition>".length;
					var end = result.indexOf("</def");
					var definition = result.slice(begin,end);						

					var begin = result.indexOf("<example>") + "<example>".length;
					var end = result.indexOf("</exa");
					var example = result.slice(begin,end);

					var begin = result.indexOf("<partofspeech>") + "<partofspeech>".length;
					var end = result.indexOf("</par");
					var partofspeech = result.slice(begin,end);
					
					Meteor.call('addWord', lookUpWord, partofspeech, definition, example);

					var anotherWord = WordList.findOne({}, {sort: {createdAt: -1}});
					Session.set('selectedWord', anotherWord._id);
				}
			});

			var str = lookUpWord;
			newstr = str.charAt(0);
			strlength = str.length;
			for (i = 1; i < strlength; i++) {
				newstr = newstr.concat("-", str.charAt(i));
			}

			Session.set('dashes', newstr);

			event.target.wordName.value = "";
		}
	});
}

if(Meteor.isServer){
	Meteor.publish('theWords', function(){
		var currentUserId = this.userId;

		return WordList.find({createdBy:currentUserId});
	});

	Meteor.methods({
		'getData': function(lookUpWord){
			this.unblock();
			appId = "" + Meteor.settings.definitions.appId;
			token = "" + Meteor.settings.definitions.token;
			def = "uid=" + appId + "&tokenid=" + token + "&word=" + lookUpWord;
			
			var apiUrl = "http://www.stands4.com/services/v2/defs.php?" + def;
			var responseW = HTTP.get(apiUrl);
			return responseW.content;
		}
	});
}

Meteor.methods({
	'addWord': function(lookUpWord, partOfSpeech, wordDefinition, wordExample){
		
		// check(lookUpWord, String);
		// check(partOfSpeech, String);
		// check(wordDefinition, String);
		// check(wordExample, String);
		var currentUserId = Meteor.userId();

		if(currentUserId){	
			WordList.insert({
				word: lookUpWord,
				definition: wordDefinition,
				partOfSpeech: partOfSpeech,
				example: wordExample,
				createdBy: currentUserId,
				createdAt: new Date()
			});
		}
	},

	'removeOneWord': function(removeWord){
		var currentUserId = Meteor.userId();
		if(currentUserId){
			WordList.remove({ _id:removeWord, createdBy:currentUserId});
		}
	},
});