/* ===== Request Class ==============================
|  Class with a constructor for Request 			   |
|  ===============================================*/

class Request {
	constructor(wallet_req){
		this.walletAddress = wallet_req;
		this.requesttimeStamp = new Date().getTime().toString().slice(0,-3);
		this.message = this.walletAddress+":"+this.requesttimeStamp+":"+"starRegistry";
		this.validationWindow = 300;
		this.messageSignature = "";
	}
}

module.exports.Request = Request;