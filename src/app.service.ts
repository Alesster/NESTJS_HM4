import { HttpException, Injectable } from '@nestjs/common';
import * as TokenJson from './assets/MyToken.json';
import * as TokenizedBallot from './assets/TokenizedBallot.json';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { SrvRecord } from 'dns';
import { ethers } from 'ethers';
import e from 'express';

const CONTRACT_ADDRESS = '0x6E2eb6e2f59454d158b31Fd100a93f6eac67a85A';
const CONTRACT_ADDRESS_TB = '0x7802d3dd23453f090d3a802622ce4bfbed884eac';

export class ClaimPaymentDTO {
  id: string;
  secret: string;
  address: string;
}

export class PaymentOrder {
  id: string;
  secret: string;
  amount: number;
}

export class ClaimCastVote {
  proposal: number;
  secret: string;
  amount: number;
}

@Injectable()
export class AppService {
  database: PaymentOrder[];
  contract: ethers.Contract;
  contractTb: ethers.Contract;
  signedContract: ethers.Contract;
  signedContractTB: ethers.Contract;
  provider: ethers.providers.Provider;
  seed: string;
  wallet: ethers.Wallet;
  wallet1: ethers.Wallet;
  signer: ethers.Wallet;
  hdNode: ethers.utils.HDNode;
  acc1: ethers.Wallet;

  constructor() {
    this.provider = ethers.getDefaultProvider('goerli');
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      TokenJson.abi,
      this.provider,
    );
    this.contractTb = new ethers.Contract(
      CONTRACT_ADDRESS_TB,
      TokenizedBallot.abi,
      this.provider,
    );

    this.seed = process.env.MNEMONIC!;
    this.hdNode = ethers.utils.HDNode.fromMnemonic(this.seed);
    this.wallet = new ethers.Wallet(this.hdNode.derivePath(`m/44'/60'/0'/0/0`));
    this.signer = this.wallet.connect(this.provider);

    this.wallet1 = new ethers.Wallet(
      this.hdNode.derivePath(`m/44'/60'/0'/0/1`),
    );
    this.acc1 = this.wallet1.connect(this.provider);

    this.signedContract = this.contract.connect(this.signer);
    this.signedContractTB = this.contractTb.connect(this.signer);

    this.database = [];
  }

  async getTotalSupply() {
    const totalSupplyBN = await this.contract.totalSupply();
    const totalSupply = ethers.utils.formatEther(totalSupplyBN);
    return totalSupply;
  }

  async getAllowance(from: string, to: string) {
    const allowanceBN = await this.contract.allowance(from, to);
    const allowance = ethers.utils.formatEther(allowanceBN);
    return allowance;
  }

  getTransactionByHash(hash: string) {
    return this.provider.getTransaction(hash);
  }

  async getTransactionReceiptByHash(hash: string) {
    const tx = await this.getTransactionByHash(hash);
    return await tx.wait();
  }

  async getVotePower(address: string) {
    const votePowerBN = await this.contract.getVotes(address);
    const votePower = ethers.utils.formatEther(votePowerBN);
    return votePower;
  }

  getPaymentOrderById(id: string) {
    const element = this.database.find((entry) => entry.id === id);
    if (!element) throw new HttpException('Not Found', 404);
    return { id: element.id, amount: element.amount };
  }

  listPaymentOrders() {
    const filteredDatabase = [];
    this.database.forEach((element) => {
      filteredDatabase.push({ id: element.id, amount: element.amount });
    });
    return filteredDatabase;
  }

  createPaymentOrder(body: PaymentOrder) {
    this.database.push(body);
  }

  claimPayment(body: ClaimPaymentDTO) {
    const element = this.database.find((entry) => entry.id === body.id);
    if (!element) throw new HttpException('Not Found', 404);
    if (body.secret != element.secret) return false;
    // TODO mint tokens here
    const tx = this.signedContract.mint(
      body.address,
      ethers.utils.parseEther(element.amount.toString()),
    );
    return tx;
  }

  selfDelegate(address: string) {
    const delegateTx = this.signedContract.connect(this.acc1).delegate(address);
    return delegateTx;
  }

  castVote(body: ClaimCastVote) {
    const element = this.database.find((entry) => entry.secret === body.secret);
    if (!element) throw new HttpException('Not Found', 404);
    const voteTx = this.signedContractTB
      .connect(this.acc1)
      .vote(body.proposal, body.amount);
    return voteTx;
  }

  async getVoteCount(id_proposal: number) {
    const proposal = await this.contractTb.proposals(id_proposal);
    const voteCount = proposal.voteCount;
    return voteCount;
  }

  getWinningProposal() {
    const winningProposalTx = this.signedContractTB.winningProposal();
    return winningProposalTx;
  }

  getWinnerName() {
    const winnerTx = this.signedContractTB.winningName();
    return winnerTx;
  }
}
