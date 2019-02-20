/* ===== RequestValidated Class ==============================
|  Class with a constructor for RequestValidated 			   |
|  ===============================================*/

class RequestValidated {
	constructor(walletAddress, requesttimeStamp, message, validationWindow){
		this.registerStar = true;
		this.status = {
			address: walletAddress,
			requesttimeStamp: requesttimeStamp,
			message: message,
			validationWindow: validationWindow,
			messageSignature: true,
		}

	};
}

module.exports.RequestValidated = RequestValidated;