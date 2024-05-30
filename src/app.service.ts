import { Injectable } from '@nestjs/common';
import {createHash, randomUUID} from "crypto";
import { ec}  from 'elliptic';
import { ethers,  toBeArray } from 'ethers';
import { executeJob, verify } from './blockchain.service';
import { setRandomnessInput, verifyRandomness } from './interfaces';
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


  generateRandomness = async (jobId: any, attestation:any) => {
    const { signer, provider } = await getProviderDetails();
    console.log("signer: ",signer);
    const randomNum = Math.random() * 1E18;
    console.log("randomNum: ",randomNum);
    const tmp = randomNum.toString();
    console.log("tmp: ",tmp);
    const hashedRandomNum = ethers.solidityPackedKeccak256(['uint256'],[tmp])
    console.log("hashedRandomNum: ",hashedRandomNum);   
    const signature = await signer.signMessage(toBeArray(hashedRandomNum))
    console.log("signature: ",signature);
   const data: setRandomnessInput = {
    randomNumber: randomNum,
    signature,
    signer:signer.address,
    requestId: jobId,
   }
    // set randomNum in blockchain
    const tx = await executeJob(jobId, data, attestation);
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
