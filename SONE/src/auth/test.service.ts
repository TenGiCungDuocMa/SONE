import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class TestService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;

  constructor() {
    const rpcUrl = "https://sepolia.infura.io/v3/71d6584bf8054c05acff9ed99d9ca4cd"; 
    const privateKey = "5dce08bd98fc66216ae180225de318148e55f37b1395e39b45ee9b026e86bef6";

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