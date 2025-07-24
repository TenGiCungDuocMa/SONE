import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class TestService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;

  constructor() {
    const rpcUrl = "https://sepolia.infura.io/v3/15c95792af744aaca94fbb66a40dcf6a"; 
    const privateKey = "ce65d0093544e12317fee156c185d6dcd2f30257d2ee6403d71bd104fc937241";

    if (!rpcUrl || !privateKey) {
      throw new Error('RPC_URL and PRIVATE_KEY must be set in environment variables');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
  }

  async getSignMessage(message: string): Promise<string> {
    try {
      const hash = await this.signer.signMessage(message);
      return hash;
    } catch (error) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }
}