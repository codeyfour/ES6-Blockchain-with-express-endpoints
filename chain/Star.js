/* ===== Star Class ==============================
|  Class with a constructor for Star 			   |
|  ===============================================*/

class Star {
	constructor(address, dec, ra, story, storyDecoded = ""){
		this.address = address;
		this.star = {
			dec: dec,
			ra: ra,
			story: story,
			storyDecoded: storyDecoded
		}

	};
}

module.exports.Star = Star;