import { Wallet } from "ethers";

export interface setRandomnessInput {
    randomNumber: number,
    signature: string,
    signer: Wallet,
    requestId: string
}

export interface verifyRandomness {
    randomNumber: number,
    signer: string,
    requestId: string
}