import { Wallet } from "ethers";

export interface setRandomnessInput {
    randomNumber: number,
    signature: string,
    signer: string,
    requestId: string
}

export interface verifyRandomness {
    randomNumber: number,
    signer: string,
    requestId: string
}

export class GenerateRandomeNumber {
    jobId: number;
    attestation: any;
}