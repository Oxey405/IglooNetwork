// Simple hosting app
const express = require('express');
const fs = require('fs');
const path = require('path');
/**
 * determines the server info (igloo)
 */
const serverInfo = {
    IglooName:"Default Igloo name",
    description:"Description"
}
//start server
const app = express()
//define statics
app.use(express.static('./views'));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//define cache variables in this one :
var resCache = {}
let clearCacheTimeout;
const port = 3000

//Treat requests
app.get('/', (req, res) => {
    console.log("request : " + req.url);
    //If NOT a resource request
    
        //generate and send a view
        res.render('view', {
            IglooName:serverInfo.IglooName
        })
    

})


function deleteCache() {
    console.log(resCache)
 resCache = {};
 console.log("cleared cache after 60s");
}
app.listen(port, () => {
    console.log(`You started your own Igloo on port ${3000}\r\nMake sure your firewall is correctly setup}`)
  })  