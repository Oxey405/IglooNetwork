/**
 * This software was made by Oxey405
 * (c) 2022 Oxey405 <Oxey405@gmail.com>
 * Released under MIT License
 * NO WARANTY INCLUDED ! (And no battery too )
 */
/**
 * Crypto web module in itself
 */
const Crypto = crypto.subtle;
/**
 * This key is used for verify purposes.
 */
var publicKey;
/**
 * This one shall always be private because used to sign the message.
 */
var privateKey;

//Those are the signatures that are stored
var MsgSignature;
var MsgSignatureExported;

//Can change anytime.
var definedUname;
/**
 * The config variable
 */
var config = {authorName:"",pubKey:"",privKey:""};

var creds;


// ----------------------------------- HERE STARTS THE "TOOLS" FUNCTIONS -----------------------------------

/**
 * Generates a RSA-PSS KeyPair
 */
function generateRSAKeyPair(callback) {
    window.crypto.subtle.generateKey(
        {
        name: "RSA-PSS",
        // Consider using a 4096-bit key for systems that require long-term security
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
        },
        true,
        ["sign", "verify"]
      ).then((keyPair) => {
        publicKey = keyPair.publicKey;
        privateKey = keyPair.privateKey;
        callback();
      });
    
    
}


/**
 * encodes the message in UTF-8
 * @param {String} message 
 * @returns encoded text
 */
function getMessageEncoding(message) {
    let enc = new TextEncoder();
    return enc.encode(message);
  }
  function getMessageDecoding(message) {
    let dec = new TextDecoder();
    return dec.decode(message);
  }
/**
 * Checks a message validity
 * @param {String} publicKey signer's public key
 * @param {ArrayBuffer} signature the signature of the message
 * @param {String} message 300 chars max
 */
  async function verifyMessage(publicKey, signature, message) {
  
    let encoded = getMessageEncoding(message);
    let result = await window.crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      publicKey,
      signature,
      encoded
    );
  
    console.log(result ? "valid" : "invalid");
  }

/**
 * Signs a message using client's private key
 * @param {String} msg 
 * @param {String} privateKey 
 */
async function signMessage(msg, privateKey) {
    let encoded = getMessageEncoding(msg);
    let signature = await window.crypto.subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        privateKey,
        encoded
      ).then((signature) => {
        console.log("message signed... sending it");
        console.log(signature);
        MsgSignature = signature;
        sendMessageToServer(msg, publicKey, signature);
      })
}

/**
 * Create a JSON object containing the message, the public key and the signature
 * then try to send it to the connected server at port 1801 or other if specified
 * @param {String} message 
 * @param {String} publicKey 
 * @param {ArrayBuffer} signature 
 */
var msgObject;


//Converts String to ArrayBuffer
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
  //Converts ArrayBuffer to string
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }


async function exportCryptoKey(key, algo) {
    const exported = await window.crypto.subtle.exportKey(
        algo,
        key
      );
      const exportedAsString = ab2str(exported);
      const exportedAsBase64 = window.btoa(exportedAsString);
      const pemExported = `${exportedAsBase64}`;
    return pemExported;
  }

  /**
   * Creates a CryptoKey object from a PEM string (public key)
   * @param {String} pem 
   * @returns {CryptoKey} publicKey
   */
  async function importPublicKey(pem) {

    const pemContents = pem;
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSA-PSS",
        hash: "SHA-256"
      },
      true,
      ["verify"]
    )
  }

  /**
   * Creates a CryptoKey from a PEM string (private key)
   * @param {String} pem 
   * @returns {CryptoKey} privateKey
   */
  function importPrivateKey(Privpem) {

    const pemContents = Privpem;
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

     return window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign"]
    );
  }


// ----------------------------------- HERE STARTS THE "INTERACTIONS" FUNCTIONS -----------------------------------

var loginDiv = document.getElementById("logindiv");
var signinDiv = document.getElementById("signindiv");

  function generateKeysProcess() {
    if(signinDiv.className == "signin-div") {
      signinDiv.className = "hidden signin-div";


    } else {
      signinDiv.className = "signin-div";
      loginDiv.className = "hidden signin-div";


    }
  }
  function loadKeysProcess() {
    if(loginDiv.className == "signin-div") {
      loginDiv.className = "hidden signin-div";

    } else {
      loginDiv.className = "signin-div";
      signinDiv.className = "hidden signin-div";


    }
  }
  function generateKeysReturn() {
      var exp_PublicKey;
      var exp_PrivateKey;
      //Export public key (spki required)
      exportCryptoKey(publicKey,"spki").then((exportedKey) => {
        exp_PublicKey = exportedKey ;
          //then export private key (pkcs#8 required)
          exportCryptoKey(privateKey,"pkcs8").then((exportedKey) => {
            exp_PrivateKey = exportedKey ;
            var jsonKeyWallet = `{"uname":"${document.getElementById("uname").value}","privKey":"${exp_PrivateKey}","pubKey":"${exp_PublicKey}"}`
            var blob = new Blob([jsonKeyWallet],
            { type: "text/plain;charset=utf-8"});
            document.getElementById("dlcreds").href = URL.createObjectURL(blob);
            definedUname = document.getElementById("uname").value;

        });
      });
  

}

  function sendMessageToServer(message, publicKey, signature) {
    exportCryptoKey(publicKey,"spki").then((exportedKey) => {
        console.log("hello!");
        var msgObjectText = `{"message":"${message}", "signerPublicKey":"${exportedKey}", "signature":"${getMessageEncoding(signature)}","uname":"${definedUname}","type":"post"}`;
        console.log(msgObjectText);
        msgObject = JSON.parse(msgObjectText);
      sendMessageObjectToServ(msgObject);
      })

}
var credsFileLoaded ;
document.getElementById("credsfile").addEventListener('change', function() {
  var CredsFile = new FileReader();
  CredsFile .onload=function() {
      credsFileLoaded = CredsFile.result;
  }
  CredsFile.readAsText(this.files[0]);
});

async function importCredsProcess() {
  var credsToLoad = JSON.parse(credsFileLoaded);
  console.log("creditentials file parsed");
  creds = credsToLoad;
  goToMain();

  setTimeout(async () => {
     publicKey = await importPublicKey(creds.pubKey);
     privateKey = await importPrivateKey(creds.privKey);
    definedUname = credsFileLoaded.uname;
    console.log("creditentials loaded !");
  }, 500)



}

function goToMain() {
  //Delete the sign in and log in button
  document.getElementById("sign-and-log-in").remove();
}



// ----------------------------------- HERE STARTS THE API CALLER -----------------------------------

let socket ;
var uid ;
function establishConnectionToServer() {
// Create WebSocket connection.
var serverIP;
if(serverIP == "" || serverIP == undefined) {
    serverIP = window.location.hostname;
}
 socket = new WebSocket('ws://'+serverIP+':2007');
// Connection opened
socket.addEventListener('open', function (event) {
    socket.send('{"type":"connectStatus","content":"connected"}');
});


// Listen for messages
socket.addEventListener('message', function (event) {
    console.log("recieved " + event);
    var serverMsg ;
    try {
        serverMsg = JSON.parse(event.data);
        console.log(serverMsg);
    } catch (error) {
        console.error("can't parse response from server");
    }
});

}

function sendMessageObjectToServ(msgObject) {
  socket.send(JSON.stringify(msgObject));
  console.log("sent ws message to server containing msgObject");
} 