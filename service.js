var Service = require('node-windows').Service;
var EventLogger = require('node-windows').EventLogger;
 
var log = new EventLogger('BLUESCOPE-KL406');

// Create a new service object
var svc = new Service({
  name:'KL406_plc',
  description: 'The service send data to KL406 Machine',
  //script: 'E:\\Aucontech\\02. Project\\02. Linde Malaysia\\Project\\GatewayIOT_Demo\\index1.js',
  script: require('path').join(__dirname,'index.js')
});
 
// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
  log.info('The service is running successfully');
});
 
svc.install();

 
