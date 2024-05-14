import { Injectable } from '@nestjs/common';
import {createHash, randomUUID} from "crypto";
import { ec}  from 'elliptic';
import { AbiCoder, ethers } from 'ethers';
import { setRandomness, verify } from './blockchain.service';
import { verifyRandomness } from './interfaces';
import { getProviderDetails } from './helpers/utils';


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


  generateRandomness = async () => {
    const randomNum =1234567878899;
    console.log("randomNum: ",randomNum);
    const requestId = randomUUID();
    const randomNumBytes = Buffer.from(randomNum.toString());
    console.log("randomNumBytes: ",randomNumBytes);
    
    const hashedRandomNum = ethers.keccak256(randomNumBytes);
    console.log("hashedRandomNum: ",hashedRandomNum);
    const { signer, provider } = await getProviderDetails();
    console.log("signer: ",signer);
    const signature = await signer.signMessage("\x19Ethereum Signed Message:\n32" + hashedRandomNum);
    console.log("signature: ",signature);
    // set randomNum in blockchain
    const tx = await setRandomness({randomNumber: randomNum,requestId,signature,signer})
    return { randomNum, tx }
  }

  generateKey = () => {
    const keyPair = EC.genKeyPair();
    const privateKey = keyPair.getPrivate('hex');
    console.log("privateKey: ", privateKey)
    const publicKey = keyPair.getPublic(true,'hex');
    console.log("publicKey: ", publicKey)
    return { publicKey, privateKey}
  }

  verify = async(args: verifyRandomness) => {
    return await verify(args);
  }

}
