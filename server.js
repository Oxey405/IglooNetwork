// Simple hosting app
const express = require('express');
const fs = require('fs');
const path = require('path');
/**
 * determines the server info (igloo)
 */
const serverInfo = {
    IglooName:"Default Igloo name",
    description:"Description",
    GreetsMessageSign:"Hey ! Welcome on this Igloo ! Generate your creditentials here and save them.",
    GreetsMessageLogin:"Hey ! Welcome back on the Igloo ! We just need your creditentials really quick."
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

//Treat "CLASSIC HTML" requests

app.get('/', (req, res) => {
    console.log("request : " + req.url);
    //If NOT a resource request
    
        //generate and send a view
        res.render('view', {
            IglooName:serverInfo.IglooName,
            GreetsMessageSign:serverInfo.GreetsMessageSign,
            description:serverInfo.description,
            GreetsMessageLogin:serverInfo.GreetsMessageLogin
        })
    

})


// Treat API requests using Websocket as a tool
const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 2007 })
var clients = [];
wss.on('connection', ws => {
    //adds the connected client to the collection of clients we already have
  clients.push(ws);
    console.log("A user is connected");
    //Send the client a message to confirm his connection
    ws.send(`{"type":"connectStatus","content":"connected"}`);
    //When a message is recieved, we treat it


    ws.on('message', message => {
      console.log(`Received ws message`)

      var messageParsed;

      try {
        messageParsed = JSON.parse(message.toString());
        console.log(messageParsed);
        if(messageParsed.type == "post") {
           
            //Cap message's length
            if((messageParsed.content).length >= 800) {
                messageParsed.content = (messageParsed.content).substring(0, 800);
            } 

            var contentLength = (messageParsed.content).length;
            // Prevent XSS or HTML injection from content
                    if((messageParsed.content).includes("<") ) {
                    messageParsed.content = (messageParsed.content).replace(/</g, " ");
                    }
                    if((messageParsed.content).includes(">")) {
                    messageParsed.content = (messageParsed.content).replace(/>/g, " ")
                    }
 
            
            // Then send it to every other connected clients     "content" contains the message object
          clients.forEach(s =>  s.send(`{"type":"post","content":"${messageParsed.content}"}`));

          // TODO : Add a way to save messages inside a JSON file (chuncking this file)
          // Need to chunks that contains messages sent in a 8 hours window.

          
        }
        if(messageParsed.type == "connectStatus") {
            console.log("client connection status : " + messageParsed.content);
        }
        //TODO Add a way for the client to recover last posts sent (in like 8 hours)
  
      } catch (error) {
        console.log("can't parse message");
      }
    
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