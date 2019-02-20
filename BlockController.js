const SHA256 = require('crypto-js/sha256');

const StarClass = require('./chain/Star');
const BlockClass = require('./chain/Block');
const RequestClass = require('./chain/Request');
const RequestValidatedClass = require('./chain/RequestValidated');

const simpleChain = require('./chain/simpleChain');
const blockChain = new simpleChain.Blockchain();
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii')
/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app 
     */
    constructor(app) {
        this.app = app;
		this.mempool = [];
		this.mempoolValid = [];
		this.timeoutRequests = [];
		this.getBlock();
		this.addBlock();
		this.requestValidation();
		this.validateRequestByWallet();
		this.Dup_Check();
		this.removeValidationRequest();
		this.verifyAddressRequest();
		this.hashSearch();
		this.walletSearch();
		this.timeCheck();
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/api/block/:index"
     */

	getBlock() {
		this.app.get("/block/:index", function(req,res) {
			blockChain.getBlockHeightLevel().then((height) => {
				
				if (req.params.index <= height - 1) {
						blockChain.getBlockLevel(req.params.index)
						.then((result) => {
						return res.status(200).json(result);
					  })
					  .catch(function(result) {
						return res.status(422).json( { errors: { index: "Block not found." }})
					  })
					}
				else {
					return res.status(422).json( { errors: { index: "Exeeded chain length." }})
					}	
			}).catch(error => {
				console.log('Exeeded chain length.');
			})
		})	
	}
    /**
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     */
	 
	 
	verifyAddressRequest(toVerify) {
		//verify if the request validation exists and if it is valid
		for (let item of this.mempoolValid) {
			if (item.status.address == toVerify) {
				return true;
			} else {
				return false;
			}	
		}
	
	}	 
	
		
	 
	encodeData(data) {
		const toEncode = new Buffer.from(data);
		const encoded = toEncode.toString('hex');
		return encoded
		
	} 
	 
	addBlock() {
		let self = this;
		this.app.post("/block", function(req,res) {
			if(!req.body.address) {
				return res.status(422).json( {errors: { address: "cannot be blank" }})
			}
			
			let ver = self.verifyAddressRequest(req.body.address);
			if (ver == true) {
				let starBody = new StarClass.Star(req.body.address, req.body.star.dec, req.body.star.ra, self.encodeData(req.body.star.story)); //create star object with body input
				let blockus = new BlockClass.Block(starBody);
				blockChain.addBlock_promise(blockus)	
				.then((result) => {
					
				result.body.star.storyDecoded = hex2ascii(result.body.star.story);
				//console.log("test" + result.body.star.storyDecoded);
				//console.log("blockus"+blockus.body.address)
				
				for (let item of self.mempoolValid) {
					//console.log("mempoolvalid"+item.status.address)
					let count =+ 1;
					if (item.status.address == blockus.body.address) {
						self.mempoolValid.splice(count-1, 1);	
					}
				}		
				return res.status(200).json(blockus);	
				})
				.catch(function(result) {
				return res.status(422).json( { errors: { result: "error" }})
				})
			} else {
				return res.status(422).json( { errors: { ver: "Wallet not verified." }})
			}
		}) 
	}

	Dup_Check(newWallet) { //Does wallet request already exist in mempool
		for (let item of this.mempool) {
			let count =+ 1;
			const TimeoutRequestsWindowTime = 5*60*1000;
			if (item.walletAddress == newWallet) {
				let timeElapse = (new Date().getTime().toString().slice(0,-3)) - item.requesttimeStamp;
				let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
				item.validationWindow = timeLeft;
				if (timeLeft < 0) {
					//expire request
					this.mempool.splice(count-1, 1);
				}else {
					return item
				}
			}		
		}
	}
	
	removeValidationRequest(newWallet)	{ //used by timeout array to delete expired requests
		for (let item of this.mempool) {
			let count =+ 1;
			if (item.walletAddress == newWallet) {
				this.mempool.splice(count-1, 1);
				//console.log(item.WalletAddress +"Expired.")
			}		
		}
	}
	
	requestValidation() { //Add a validation
		this.app.post("/requestValidation", (req, res) => {
			if(!req.body.address) {
				return res.status(422).json( {errors: { address: "cannot be blank" }})
			}
			if(this.Dup_Check(req.body.address)) {
				return res.status(200).json(this.Dup_Check(req.body.address));
			} 	else {
					let TimeoutRequestsWindowTime = 5*60*1000;
					let req_mem = new RequestClass.Request(req.body.address);
					let self = this;
					self.timeoutRequests[req_mem.walletAddress]=setTimeout(function(){self.removeValidationRequest(req_mem.walletAddress) }, TimeoutRequestsWindowTime );
					this.mempool.push(req_mem);
					return res.status(200).json(req_mem);
					}
		})
	}
	
	timeCheck(newWallet) { //Does wallet request already exist in mempool
		for (let item of this.mempool) {
			let count =+ 1;
			const TimeoutRequestsWindowTime = 5*60*1000;
			if (item.walletAddress == newWallet) {
				let timeElapse = (new Date().getTime().toString().slice(0,-3)) - item.requesttimeStamp;
				let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
				item.validationWindow = timeLeft;
				if (timeLeft < 0) {
					//expire request
					this.mempool.splice(count-1, 1);
				}else {
					return item.validationWindow
				}
			}		
		}
	}

	
	//Sign a request
	validateRequestByWallet() {
		this.app.post("/message-signature/validate", (req, res) => {
			if(!req.body.address) {
				return res.status(422).json( {errors: { address: "cannot be blank" }})
			}
			
			if(!req.body.signature) {
				return res.status(422).json( {errors: { signature: "cannot be blank" }})
			}
			
			if (this.mempool.length > 0) {
				for (let request of this.mempool) { //Loop mempool and find wallet
					if(request.validationWindow > 0) {
						if (request.walletAddress == req.body.address) {
							request.validationWindow = this.timeCheck(request.walletAddress)
							let isValid = bitcoinMessage.verify(request.message, request.walletAddress, req.body.signature); //verify bitcoin address
							//console.log(isValid);
							if (isValid == true) { //If wallet signed
								let req_valid = new RequestValidatedClass.RequestValidated(request.walletAddress,request.requesttimeStamp, request.message, request.validationWindow);
								this.mempoolValid.push(req_valid);
								return res.status(200).json(this.mempoolValid);
								
							} else {
								return res.status(422).json( {errors: { req_valid: "Sig Invalid" }})	
								}
						}			
					}
				}
			} else {
				return res.status(422).json( {errors: { address: "Mempool is Empty." }})		
			}
			
		})
	}

	hashSearch() {
		this.app.get("/stars/hash/:hash", function(req,res) {
			blockChain.getBlockHeightLevel().then((height) => {

				if (height => 0) {
					blockChain.getBlockByHash(req.params.hash).then((block) => {
						
					if (block) {
						return res.status(200).json(block);
					 } else {
						return res.status(422).json( { errors: { block: "Hash not found." }})
						}	
					}).catch(error => {
						console.log('total error / hash not found!');
					})
				}
			})
		})	
	}
	
	walletSearch(){
		this.app.get("/stars/address/:address", function(req,res) {
			blockChain.getBlockHeightLevel().then((height) => {

				if (height => 0) {
					blockChain.getBlockByWallet(req.params.address).then((block) => {
						return res.status(200).json(block);
					}).catch(error => {
						console.log('total error / address not found!');
						})
				}
			})
		})
	}
	
	
}


	
	
	
/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}