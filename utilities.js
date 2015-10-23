//UTILITIES


module.exports = {
	
	// Returns a random integer between min (included) and max (included)
	// Using Math.round() will give you a non-uniform distribution!

	getRandom: function (min, max){
	 	return Math.floor(Math.random() * (max - min + 1)) + min;
	},


	shuffleWord: function (word){

		for(var i = 0; i<this.getRandom(3, word.length+3); i++){

			var start = this.getRandom(0, word.length-1);
			var end = this.getRandom(start, word.length-1);

			word = word.substring(0,start) + word.substring(start, end+1).split('').reverse().join('') + word.substring(end+1, word.length);
		}

		return word;
	},


	checkAnswer: function (answer, currentWord){
		return answer.trim().toLowerCase() === currentWord.trim().toLowerCase();
	},

	getScore: function (correctAnswersBeforeNow){
		if(correctAnswersBeforeNow === 0) return 10;
		else if(correctAnswersBeforeNow === 1) return 3;
		else if(correctAnswersBeforeNow === 2) return 2;
		else return 1;
	}


};