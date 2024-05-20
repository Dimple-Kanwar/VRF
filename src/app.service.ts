import { Injectable } from '@nestjs/common';
import {createHash, randomUUID} from "crypto";
import { ec}  from 'elliptic';
import { ethers,  toBeArray } from 'ethers';
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
    const { signer, provider } = await getProviderDetails();
    console.log("signer: ",signer);
    const randomNum =1234567878899;
    console.log("randomNum: ",randomNum);
    const requestId = randomUUID(); 
    const hashedRandomNum = ethers.solidityPackedKeccak256(['uint256'],[randomNum])
    console.log("hashedRandomNum: ",hashedRandomNum);   
    const signature = await signer.signMessage(toBeArray(hashedRandomNum))
    console.log("signature: ",signature);
    // const ethHash = ethers.solidityPackedKeccak256(['string','bytes32'], ["\x19Ethereum Signed Message:\n32", hashedRandomNum]);
    // console.log("ethHash: ",ethHash);
   
    // set randomNum in blockchain
    const tx = await setRandomness(randomNum,requestId,signature,signer.address)
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
