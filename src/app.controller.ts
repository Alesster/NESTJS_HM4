import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import {
  AppService,
  ClaimCastVote,
  ClaimPaymentDTO,
  PaymentOrder,
} from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('total-supply')
  getTotalSupply() {
    return this.appService.getTotalSupply();
  }

  @Get('allowance')
  getAllowance(@Query('from') from: string, @Query('to') to: string) {
    return this.appService.getAllowance(from, to);
  }

  @Get('transaction-by-hash/:hash')
  getTransactionByHash(@Param('hash') hash: string) {
    return this.appService.getTransactionByHash(hash);
  }

  @Get('transaction-receipt-by-hash/:hash')
  getTransactionReceiptByHash(@Param('hash') hash: string) {
    return this.appService.getTransactionReceiptByHash(hash);
  }

  @Get('vote-power')
  getVotePower(@Query('address') address: string) {
    return this.appService.getVotePower(address);
  }

  @Get('list-payment-oreders')
  listPaymentOrders() {
    return this.appService.listPaymentOrders();
  }

  @Get('get-payment-oreders')
  getPaymentOrders(@Query('id') id: string) {
    return this.appService.getPaymentOrderById(id);
  }

  @Post('create-order')
  createOrder(@Body() body: PaymentOrder) {
    this.appService.createPaymentOrder(body);
  }

  @Post('claim-payment')
  claimPayment(@Body() body: ClaimPaymentDTO) {
    return this.appService.claimPayment(body);
  }

  @Post('self-delegate')
  selfDelegate(@Query('address') address: string) {
    return this.appService.selfDelegate(address);
  }

  @Post('cast-vote')
  castVote(@Body() body: ClaimCastVote) {
    return this.appService.castVote(body);
  }

  @Get('winning-proposal')
  getWinningProposal() {
    return this.appService.getWinningProposal();
  }

  @Get('winner-name')
  getWinnerName() {
    return this.appService.getWinnerName();
  }
}
