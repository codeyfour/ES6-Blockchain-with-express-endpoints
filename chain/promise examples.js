Udacity logo

Knowledge
post

0
Promise Chains in ValidateChain() creates issues
A
Andreas L1 day agoEdited 1 day ago

Hi there,

do you have an idea where i made some mistakes in validateChain()?

The loop creates some issues

/* ===== SHA256 with Crypto-js ===============================
|  Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/
const SHA256 = require('crypto-js/sha256');
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);
/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/
class Block{
	constructor(data){
     this.hash = "";
     this.height = 0;
     this.body = data;
     this.time = 0;
     this.previousBlockHash = "";
    }
}
/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/
class Blockchain{
  constructor(){
	this.getBlockHeight().then((height) => {
	if (height == 0 ) // database == empty -> load genesis
	{
		let newBlock = new Block ("First block in the chain - Genesis block");
		// UTC timestamp
		newBlock.time = new Date().getTime().toString().slice(0,-3);
		newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
		//addDataToLevelDB(newBlock);
		addLevelDBData(0, newBlock);
	}
	}).catch(error => {
        console.log("Error in constructor " + error);})
  }
  // Add new block
  addBlock(newBlock){
    // Block height
   this.getBlockHeight().then((height) => {
       
    if (height != undefined)
    {
 	console.log("result getBlockHeight() " + height);
	newBlock.height = ++height;
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(newBlock.height>0){
	this.getBlock(--newBlock.height).then((Block) => {
      	newBlock.previousBlockHash = Block.hash; 
    // Block hash with SHA256 using newBlock and converting to a string
    	newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    	// Adding block object to db
	addDataToLevelDB(newBlock);
	}).catch(error => {
        console.log("Error in getBlock at addBlock with newBlock.height "  + newBlock.height + error);
    })
    }}
    })
    .catch(error => {
        console.log("Error in AddBlock" + error);
    })
  }
  // Get block height
 getBlockHeight() {
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
		console.log(" getblock return value " + i);
                if(i>0) --i;
		resolve(i);
            });
    })
}
    // get block
getBlock(blockHeight){
	return new Promise((resolve, reject) => {
	  	db.get(blockHeight, function(err, value) {
    		if (err) 	
		{				
			console.log('Not found!', err);
			reject(err);
		};
    		console.log('Value = ' + value);
		resolve(JSON.parse(value));
  		})
		})
	}
   
    // validate block
    validateBlock(blockHeight){ return new Promise((resolve, reject) => {
      // get block object which will be validated
	this.getBlock(blockHeight).then((Block) => {
      // get block hash to save the hash which was created by addBlock 
      let blockHash = Block.hash;
      // remove block hash to test block integrity - are there any changes?
	console.log("\n getblock blockHash " + blockHash);
     Block.hash = "";
	//console.log("\n getblock Block.hash " + Block.hash);
	//console.log("\n getblock Block " + JSON.stringify(Block));
      // generate block hash of the hashless block under validation
      let validBlockHash = SHA256(JSON.stringify(Block)).toString();
	console.log("\n getblock blockHash " + validBlockHash);
      // Compare the saved hash and the new calculated
      if (blockHash==validBlockHash) {
          resolve(true);
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          resolve(false);
        }}).catch(error => {
        console.log("Error in getBlock at ValidateBlock() with Block "  + Block + error);})
	})
    }
   // Validate blockchain
    validateChain(){
      let errorLog = [];
	let cnt;
	let cnt2;
	// getBlockHeight() to check how many blocks are saved (increment by one,  because result of 
	// getBlockHeight() is n-1 )
	this.getBlockHeight().then((height) => { cnt= height-1; cnt2= height -2;
		console.log(" \n ValidateChain -> height " + cnt);
	// Validate each block
	let i = 0;
      	do {
		// validate block, false return creates an errorlog entry
		this.validateBlock(i).then(value => {
			if (!value) { errorLog.push(i); }
        // compare blocks hash link
	// save current block hash
        let blockHash;
  	let previousHash;
	this.getBlock(i).then((Block) => {
      	blockHash = Block.hash;  console.log(" \n ValidateChain -> Block.hash " + i);
		
	this.getBlock(i+1).then((b) => {
	// save next block hash	
	previousHash = b.previousBlockHash;
		console.log(" \n ValidateChain -> getBlock i+1 " + i);
        if (blockHash!==previousHash) 
	{
          errorLog.push(i);
	}
	//raise promise when loop ends
	if (i == cnt2)
	{	    
	  if (errorLog.length>0) 
		{
		console.log('Block errors = ' + errorLog.length);
		console.log('Blocks: '+errorLog);
	      } else {
			console.log('No errors detected');
		}
	}
	
	
	}).catch(error => {
		console.log("Error in ValidateChain -> getBlock(i+1)" + error);
      		})
	}).catch(error => {
		console.log("Error in ValidateChain -> getBlock(i)" + error);
      		})    
	}).catch(error => {
		console.log("Error in ValidateChain -> validate(i)" + i + error);
		})
	i++;
	}
	while (i < cnt);
	}).catch(error => {
		console.log("Error in ValidateChain" + error);
      		})
     
	}
}
//db functions
// Add data to levelDB with key/value pair
function addLevelDBData(key,value){
	// save the object as a string
  db.put(key, JSON.stringify(value), function(err) {
    if (err) return console.log('Block ' + key + ' submission failed', err);
  })
}
// Get data from levelDB with key
function getLevelDBData(key){
	return new Promise((resolve, reject) => {
	  	db.get(key, function(err, value) {
    		if (err) 	
		{				
			console.log('Not found!', err);
			reject(err);
		};
    		console.log('Value = ' + value);
		resolve(value);
  		})
		})
	}
// Add data to levelDB with value
function addDataToLevelDB(value) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
          console.log('Block #' + i);
          addLevelDBData(i, value);
        });
}
//test
let blockchain = new Blockchain();
(function theLoop (i) 
{setTimeout(function () {
blockchain.addBlock(new Block("test data "+i));
if (--i) theLoop(i);
}, 100);
})(10);
//blockchain.validateBlock(3).then(value => {console.log(value);})
//blockchain.validateChain();

    Private BlockchainBlockchain Developer

1 Answer

-1

The indenting is hard to follow and I can't copy/paste out of this page - but you might want to await some of the async operations you are doing within the validateChain()
Profile image
Oliver Oabout 20 hours ago

