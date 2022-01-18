// Crypto
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

var MsgSignature;
var MsgSignatureExported;

//Functions

/**
 * Generates a RSA-PSS KeyPair
 */
function generateRSAKeyPair() {
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
function sendMessageToServer(message, publicKey, signature) {
    exportCryptoKey(publicKey,"spki").then((exportedKey) => {
        console.log("hello!");
        var msgObjectText = `{"message":"${message}", "signerPublicKey":"${exportedKey}", "signature":"${getMessageEncoding(signature)}"}`;
        console.log(msgObjectText);
        msgObject = JSON.parse(msgObjectText);
        console.log(msgObject);
    })

}
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
   * Creates a CryptoKey object from a PEM string
   * @param {String} pem 
   * @returns 
   */
  function importPublicKey(pem) {

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
    );
  }