var nodes7 = require('nodes7');  // This is the package name, if the repository is cloned you may need to require 'nodeS7' with uppercase S
var conn = new nodes7;
const mkdirp = require('mkdirp');
const moment = require('moment');


var doneReading = false;
var doneWriting = false;

var fs = require('fs');
const csv = require('csv-parser');

let arrLengthData = [];
let arrQtyData = [];





let logPath = fs.readFileSync('C:/HMI/config/log.txt', 'utf8');
// Global variable
const opts = {
  // errorEventName:'error',
  logDirectory:logPath, // NOTE: folder must exist and be writable...
  fileNamePattern:'<DATE>.log',
  dateFormat:'YYYY.MM.DD'
};
let log = require('simple-node-logger').createRollingFileLogger( opts );

async function main(){
	log.info(' =============== START PROGRAM =============== ')
	deleteLogFile(5, logPath)

	f_01_init()
	setTimeout(function() {
		//console.log(arrQtyData)
		writeToPLC(arrLengthData, arrQtyData)
	}, 800)
	
}

main()

function f_01_init(){
	let arrData = []
	let jsonData
	let i = 0;
	try {  
    let currentPath = fs.readFileSync('C:/HMI/config/csvpath.txt', 'utf8');
    

    fs.createReadStream(currentPath)
      .on('error', (err) => {
        log.error('Stream file error ' + err.message);
      })
  		.pipe(csv({separator:','}))
		  .on('data', (data_row) => {
		  	console.log(data_row)
        try{
          jsonData = {
          	i: i,
            length: data_row.length,
            qty : data_row.qty,
          }

          if (i < 20) {
          	arrData.push(jsonData)
          	arrLengthData.push(data_row.length);
						arrQtyData.push(data_row.qty);
						i++;
          }
          
        }catch (err){

        }
		  })
		  .on('end', async function(){
		  	//console.log(arrData)
        if (arrData.length == 0) {
          try{
            

          }catch(err){

          }
        }else{
        	log.info('Length: ' + arrLengthData)
        	log.info('Qty: ' + arrQtyData)
          //console.log(arrLengthData, arrQtyData)

        }			  	  				
		  }) 

	} catch(e) {
		log.info('Error: ' + e.stack)
	  //console.log('Error:', e.stack);
	}
}


async function writeToPLC(arrLength, arrQty){
	var variables = 
	{ SEND: 'DB1,INT4200', 		// Memory real at MD4
		QTY: 'DB1,INT4000.20', 		// Bit at M32.2
		LENGTH: 'DB1,INT4100.20', 		// Bit at M32.2

	};

	//conn.initiateConnection({port: 102, host: '192.168.0.200', rack: 0, slot: 2}, connected); // slot 2 for 300/400, slot 1 for 1200/1500
	conn.initiateConnection({port: 102, host: '192.168.0.200', localTSAP: 0x1000, remoteTSAP: 0x1001, timeout: 8000}, connected); // local and remote TSAP can also be directly specified instead.  The timeout option specifies the TCP timeout.

	async function connected(err) {
		if (typeof(err) !== "undefined") {
			log.error('Error: ' + err.message)
			// We have an error.  Maybe the PLC is not reachable.
			//console.log(err);
			process.exit();
		}
		conn.setTranslationCB(function(tag) {return variables[tag];}); 	// This sets the "translation" to allow us to work with object names
		conn.addItems(['SEND']);
		conn.addItems('LENGTH');
		conn.addItems('QTY');

		conn.writeItems('SEND', [100], valuesWritten);
		await sleep(200)
		await conn.writeItems('QTY', arrQty, valuesWritten);
		await sleep(500)
		await conn.writeItems('LENGTH', arrLength, valuesWritten);
		await sleep(500)
		await conn.writeItems('SEND', [0], valuesWritten);
		await conn.readAllItems(valuesReady);
	}

	function valuesReady(anythingBad, values) {
		if (anythingBad) { console.log("SOMETHING WENT WRONG READING VALUES!!!!"); }
		//console.log(values);
		doneReading = true;
		if (doneWriting) { process.exit(); }
	}

	function valuesWritten(anythingBad) {
		if (anythingBad) { console.log("SOMETHING WENT WRONG WRITING VALUES!!!!"); }
		//console.log("Done writing.");
		doneWriting = true;
		if (doneReading) { process.exit(); }
	}


}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   


function deleteLogFile(days, path){
	let _beforeNdays = moment().subtract(days + 2, 'days');
  
  let _TempDate = _beforeNdays
  for(let i = 1; i <= 5; i++ ){
    _TempDate = moment(_TempDate).add(1, 'd');
    folderName = moment(_TempDate).format("YYYY.MM.DD")
    strFolderPath = path + '\\' + folderName + '.log'
    console.log(strFolderPath)
    try{
    	fs.unlinkSync(strFolderPath)
    }catch(err){
    	console.log(err)
    }
    
    // if (fs.existsSync(strFolderPath)) {
    //   rimraf.sync(strFolderPath);
    //   log.warn('Deleted folder ' + folderName + ' in ' + strFolderPath)
    // } 
  }
}