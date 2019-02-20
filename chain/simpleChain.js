/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);
const BlockClass = require('./Block');


/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    //this.addBlock(new Block("First block in the chain - Genesis block"));
	this.getBlockHeightLevel().then((height) => {
		if (height == 0) {
			console.log('Creating Genesis block... ');	
			this.addBlock(new BlockClass.Block("First block in the chain - Genesis block"));
			}
		}).catch(error => {
			console.log('Genesis block already existing.');
		})
  }
  
	//validate a block
	 validateBlock(height) {
		 this.getBlockLevel(height).then((result) => {
			//get block height
			let block = result;
			//get block hash
			let blockHash = block.hash;
			//remove block hash to test block integrity
			block.hash = '';
			//generate block hash
			let validBlockHash = SHA256(JSON.stringify(block)).toString();
			//compare
			if (blockHash == validBlockHash) {
				console.log("validated : " + blockHash + " Valid Block " + validBlockHash);
			} else {
				console.log("Not validated :" + blockHash + " Valid Block " + validBlockHash);
			}
		}).catch(error => {
			console.log('Error in validate root');
		})
	}
	
	validator() { //to run validate chain
		this.getBlockHeightLevel().then((height) => {
			height = height - 1;
			for (var y = height; y > 0; y-- ) {
				this.chainTest()
			}
		  })
	}
	
	//validate chain function
	chainTest() {
		this.getBlockHeightLevel().then((height) => {
			if (height > 0) { 
				this.getBlockLevel(height-1).then((current_block) => {
					this.getBlockLevel(height-2).then((previous_block) => {
						//console.log('current prev hash is :' + current_block.previousBlockHash);
						//console.log('Actual prev hash is:' + previous_block.hash);
						if (current_block.previousBlockHash === previous_block.hash) {
							console.log('Blockchain verified at position: ' + height);
						}
					}).catch(error => {
						console.log('Error in getting previous block.');
					})
				}).catch(error => {
				console.log('Error in previous current block.');
				})
			}
		}).catch(error => {
			console.log('error in testing the chain root');
		})
	}
				
       //creates a logical block for adding 
	  addBlock(newBlock) { 
		  this.getBlockHeightLevel().then((height) => {
			newBlock.height = height; //Add block height
			console.log('Creating Block', + height);		
			newBlock.time = new Date().getTime().toString().slice(0,-3);
			if (height > 0) { //get previous block hash
				this.getBlockLevel(height-1).then((result) => {				
				newBlock.previousBlockHash = result.hash;
				newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
				this.addBlockLevel(newBlock);
				//console.log('Previous block hash calculated', + result.hash);
			}).catch(error => {
				console.log('Error in previous hash calculation');
			})
			}
			if(height == 0){
				newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
				this.addBlockLevel(newBlock);
			}
			

		}).catch(error => {
			console.log('Error in Block creation');
		})
	} 
  
    // Add new block to level 
	 addBlockLevel(newBlock) {
		 this.getBlockHeightLevel().then((height) => {	
			let newBlock_string = JSON.stringify(newBlock).toString(); //turn block array to string
			let internal_key = newBlock.height;
			console.log('Adding Block', + internal_key);
			db.put(internal_key,newBlock_string, function(err) {
			if (err) return console.log('Block ' + internal_key + 'submission failed', err);
		}) //places string verable into level database
			
			
		}).catch(error => {
			console.log('Error in testy');
		})
		
	}
  
	 testy() {
		 this.getBlockHeightLevel().then((height) => {
			if (height > 0) {
				console.log('Next block in chain : ', + height);				
			}
		}).catch(error => {
			console.log('Error in testy');
		})
	}

	
 //creates a logical block for adding 
	addBlock_promise(newBlock) {
		let self = this;
		return new Promise(function(resolve, reject) {
		  self.getBlockHeightLevel().then((height) => {
			newBlock.height = height; //Add block height
			console.log('Creating Block', + height);
			newBlock.time = new Date().getTime().toString().slice(0,-3);
			if (height > 0) { //get previous block hash
			  self.getBlockLevel(height-1).then((result) => {
				newBlock.previousBlockHash = result.hash;
				newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
				self.addBlockLevel(newBlock);
				
				resolve(newBlock);
			  }).catch(error => {
				reject('Error in previous hash calculation');
			  })
			}
			if(height == 0){
			  newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
			  self.addBlockLevel(newBlock);
			  
			  resolve(newBlock);
			}
		  }).catch(error => {
			reject('Error in Block creation');
		  })
		})
	  }
	
	//Get block by hash
	getBlockByHash(hash) {
		let self = this;
		return new Promise(function(resolve, reject) {
			self.getBlockHeightLevel().then((height) => {
				let position = height;
				db.createReadStream()
					.on('data', function() {
						position--;
						self.getBlockLevel(position).then((result) => {
							if (hash == result.hash) {
								console.log(result);
								resolve(result);
							}
						})
					})
				   .on('error', function() {
						reject("Could not retrieve chain length");
					})
					.on('close', function() {
					//resolve(position); //current block
					});
			})
		})
	}
	
	//Get block by hash
	getBlockByWallet(wallet) {
		let self = this;
		return new Promise(function(resolve, reject) {
			self.getBlockHeightLevel().then((height) => {
				let position = height;
				db.createReadStream()
					.on('data', function() {
						position--;
						self.getBlockLevel(position).then((result) => {
							if (wallet == result.body.address) {
								console.log(result);
								resolve(result);
							}
						})
					})
				   .on('error', function() {
						reject("Could not retrieve chain length");
					})
					.on('close', function() {
					//resolve(position); //current block
					});
			})
		})
	}	
	
	//block height 
	 getBlockHeightLevel() {
		return new Promise(function(resolve, reject) {
			let i = 0;
			db.createReadStream()
				.on('data', function() {
					i++;
				})
			   .on('error', function() {
					reject("Could not retrieve chain length");
				})
				.on('close', function() {
			//console.log(" getblock return value " + i);
					if(i>0);
					//i++ // next block to write
					resolve(i); //current block
				});
		})
	}

	//Get block with key
	getBlockLevel(key){
		return new Promise((resolve, reject) => {
	  	db.get(key, function(err, value) {
    		if (err) 	
		{				
			console.log('Not found!', err);
			reject(err);
		};
    		//console.log('Value = ' + value);
			resolve(JSON.parse(value));
			//resolve(value);
  		})
		})
	}
			
}

module.exports = {
	Blockchain: Blockchain
};