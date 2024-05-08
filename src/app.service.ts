import { Injectable } from '@nestjs/common';
import {createHash} from "crypto";
import { ec}  from 'elliptic';
import { ethers } from 'ethers';


const EC = new ec('secp256k1');

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getPublicKey = (privateKey: string) => {
    const key = EC.keyFromPrivate(privateKey);
    return {
      key: key.getPublic("hex"),
      compressed: key.getPublic(true, "hex"),
      x: key.getPublic().getX(),
      y: key.getPublic().getY(),
    };
  };


  hash = (...args: any[]) => {
    const sha256 = createHash("sha256");
    for (const arg of args) {
      sha256.update(arg);
    }
    return sha256.digest().toString("hex");
  };

  generateRandomness = async () => {
    const randomNum = 1234567890;
    console.log("randomNum: ",randomNum);
    const hashedRandomNum = this.hash("\x19Ethereum Signed Message:\n32",randomNum.toString());
    console.log("hashedRandomNum: ",hashedRandomNum);

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/"));
    console.log("signer: ",signer);
    const signature = await signer.signMessage(hashedRandomNum);
    console.log("signature: ",signature);
    return { randomNum }
  }

  generateRandomnessV2 = () => {
    const keyPair = EC.keyFromPrivate(process.env.PRIVATE_KEY);
    console.log("keyPair: ", keyPair);
    const randomNum = Math.random().toPrecision(18);
    console.log("randomNum: ", randomNum);
    const hashedRandomNum = this.hash(randomNum.toString());
    console.log("hashedRandomNum: ", hashedRandomNum);
    const signature = keyPair.sign(hashedRandomNum);
    console.log("signature: ", signature);
    // Export DER encoded signature in Array
    var derSign = signature.toDER();
    console.log("derSign: ", derSign);
    const publicKey = this.getPublicKey(process.env.PRIVATE_KEY!);
    console.log("publicKey: ", publicKey);
    const isValid = keyPair.verify(randomNum, signature);
    console.log("isValid: ", isValid);
    return { randomNum }
  }

  generateKey = () => {
    const keyPair = EC.genKeyPair();
    const privateKey = keyPair.getPrivate('hex');
    console.log("privateKey: ", privateKey)
    const publicKey = keyPair.getPublic(true,'hex');
    console.log("publicKey: ", publicKey)
    return { publicKey, privateKey}
  }

}
