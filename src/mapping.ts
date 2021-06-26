import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/YearnFighterUSDT/YearnFighter";
import { Deposit, Withdraw } from "../generated/DAOVaultCitadel/Citadel";
import { Deposit as FaangDeposit, Withdraw as FaangWithdrawal, Transfer as FaangTransfer } from "../generated/DAOVaultFaangStonk/FaangStonk";
import { Farmer } from "../generated/schema";
import { BIGINT_ZERO, ZERO_ADDRESS } from "./utils/constants";
import { toDecimal } from "./utils/decimals";
import {
  getOrCreateAccount,
  getOrCreateAccountVaultBalance,
  getOrCreateFarmer,
  getOrCreateToken,
  getOrCreateCompoundFarmer,
  getOrCreateHarvestFarmer,
  getOrCreateCitadelFarmer,
  getOrCreateElonFarmer,
} from "./utils/helpers";
import {
  getOrCreateFaangFarmer,
  getOrCreateTransaction,
  getOrCreateVaultDeposit,
  getOrCreateVaultTransfer,
  getOrCreateVaultWithdrawal,
} from "./utils/helpers/yearn-farmer/vault";
import { EACAggregatorProxy } from "../generated/DAOVaultCitadel/EACAggregatorProxy";

function handleTransfer(
  event: Transfer,
  amount: BigInt,
  fromId: string,
  toId: string,
  vault: Farmer,
  transactionId: string
): void {
  let transfer = getOrCreateVaultTransfer(transactionId);

  transfer.farmer = vault.id;
  transfer.from = fromId;
  transfer.to = toId;
  transfer.value = event.params.value;
  transfer.amount = amount;
  transfer.totalSupply = vault.totalSupplyRaw;
  transfer.transaction = event.transaction.hash.toHexString();

  transfer.save();
}

function handleCitadelTransferTemplate(
  event: Transfer,
  amount: BigInt,
  fromId: string,
  toId: string,
  vault: Farmer,
  transactionId: string
): void {
  let transfer = getOrCreateVaultTransfer(transactionId);

  transfer.farmer = vault.id;
  transfer.from = fromId;
  transfer.to = toId;
  transfer.value = event.params.value;
  transfer.amount = amount;
  transfer.totalSupply = vault.totalSupplyRaw;
  transfer.transaction = event.transaction.hash.toHexString();
  
  // Amount of shares in USD, Get ETH <-> USD price from chain link
  let proxyContract = EACAggregatorProxy.bind(Address.fromString("0x9326BFA02ADD2366b30bacB125260Af641031331"));
  let usdPrice = toDecimal(proxyContract.latestAnswer(), proxyContract.decimals());
  let sharesInUSD = toDecimal(event.params.value, 18).times(usdPrice);
  transfer.amountInUSD = sharesInUSD;

  transfer.save();
}

function handleFaangTransferTemplate( event: Transfer,
  amount: BigInt,
  fromId: string,
  toId: string,
  vault: Farmer,
  transactionId: string): void {
    let transfer = getOrCreateVaultTransfer(transactionId);

    transfer.farmer = vault.id;
    transfer.from = fromId;
    transfer.to = toId;
    transfer.value = event.params.value;
    transfer.amount = amount;
    transfer.totalSupply = vault.totalSupplyRaw;
    transfer.transaction = event.transaction.hash.toHexString();

    transfer.save();
}

function handleDeposit(
  event: Transfer,
  amount: BigInt,
  accountId: string,
  vault: Farmer,
  transactionId: string
): void {
  let deposit = getOrCreateVaultDeposit(transactionId);

  deposit.farmer = vault.id;
  deposit.account = accountId;
  deposit.amount = amount;
  deposit.shares = event.params.value;
  deposit.totalSupply = vault.totalSupplyRaw;
  deposit.transaction = event.transaction.hash.toHexString();

  deposit.save();
}

function handleCitadelDepositTemplate(
  event: Deposit,
  amount: BigInt,
  amountInUSD: BigDecimal,
  accountId: string,
  vault: Farmer,
  transactionId: string
): void {
  let deposit = getOrCreateVaultDeposit(transactionId);

  deposit.farmer = vault.id;
  deposit.account = accountId;
  deposit.amount = amount;
  deposit.amountInUSD = amountInUSD,
  deposit.shares = event.params.sharesMint; // TODO change to minted shares
  deposit.totalSupply = vault.totalSupplyRaw;
  deposit.transaction = event.transaction.hash.toHexString();

  deposit.save();
}

function handleElonDepositTemplate(
  event: Deposit,
  amount: BigInt,
  amountInUSD: BigDecimal,
  accountId: string,
  vault: Farmer,
  transactionId: string
): void {
  let deposit = getOrCreateVaultDeposit(transactionId);

  deposit.farmer = vault.id;
  deposit.account = accountId;
  deposit.amount = amount;
  deposit.amountInUSD = amountInUSD,
  deposit.shares = event.params.sharesMint; // TODO change to minted shares
  deposit.totalSupply = vault.totalSupplyRaw;
  deposit.transaction = event.transaction.hash.toHexString();

  deposit.save();
}

function handleFaangDepositTemplate(
    event: FaangDeposit,
    amount: BigInt,
    amountInUSD: BigDecimal,
    accountId: string,
    vault: Farmer,
    transactionId: string
): void {
  let deposit = getOrCreateVaultDeposit(transactionId);

  deposit.farmer = vault.id;
  deposit.account = accountId;
  deposit.amount = amount;
  deposit.amountInUSD = amountInUSD,
  deposit.shares = event.params.sharesMinted;
  deposit.totalSupply = vault.totalSupplyRaw;
  deposit.transaction = event.transaction.hash.toHexString();

  deposit.save();
}

function handleWithdrawal(
  event: Transfer,
  amount: BigInt,
  accountId: string,
  vault: Farmer,
  transactionId: string
): void {
  let withdraw = getOrCreateVaultWithdrawal(transactionId);

  withdraw.farmer = vault.id;
  withdraw.account = accountId;
  withdraw.amount = amount;
  withdraw.shares = event.params.value;
  withdraw.totalSupply = vault.totalSupplyRaw;
  withdraw.transaction = event.transaction.hash.toHexString();

  withdraw.save();
}

function handleCitadelWithdrawalTemplate(
  event: Withdraw,
  amount: BigInt,
  amountInUSD: BigDecimal,
  accountId: string,
  vault: Farmer,
  transactionId: string
): void {
  let withdraw = getOrCreateVaultWithdrawal(transactionId);

  withdraw.farmer = vault.id;
  withdraw.account = accountId;
  withdraw.amount = amount;
  withdraw.amountInUSD = amountInUSD;
  withdraw.shares = event.params.sharesBurn;
  withdraw.totalSupply = vault.totalSupplyRaw;
  withdraw.transaction = event.transaction.hash.toHexString();

  withdraw.save();
}

function handleElonWithdrawalTemplate(
  event: Withdraw,
  amount: BigInt,
  amountInUSD: BigDecimal,
  accountId: string,
  vault: Farmer,
  transactionId: string
): void {
  let withdraw = getOrCreateVaultWithdrawal(transactionId);

  withdraw.farmer = vault.id;
  withdraw.account = accountId;
  withdraw.amount = amount;
  withdraw.amountInUSD = amountInUSD;
  withdraw.shares = event.params.sharesBurn;
  withdraw.totalSupply = vault.totalSupplyRaw;
  withdraw.transaction = event.transaction.hash.toHexString();

  withdraw.save();
}

function handleFaangWithdrawalTemplate(
  event: FaangWithdrawal,
  amount: BigInt,
  amountInUSD: BigDecimal,
  accountId: string,
  vault: Farmer,
  transactionId: string
): void {
  let withdraw = getOrCreateVaultWithdrawal(transactionId);

  withdraw.farmer = vault.id;
  withdraw.account = accountId;
  withdraw.amount = amount;
  withdraw.amountInUSD = amountInUSD;
  withdraw.shares = event.params.sharesBurned;
  withdraw.totalSupply = vault.totalSupplyRaw;
  withdraw.transaction = event.transaction.hash.toHexString();

  withdraw.save();
}

export function handleShareTransfer(event: Transfer): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateFarmer(event.address);
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(farmer.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;

  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.value
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.value;
  }

  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(farmer.id)
  );
  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  // Vault transfer between valid accounts
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    handleTransfer(
      event,
      amount,
      fromAccount.id,
      toAccount.id,
      farmer,
      transactionId
    );

    // Update toAccount totals and balances
    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.underlyingToken;
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
      amount
    );
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value
    );
    toAccountBalance.totalReceivedRaw = toAccountBalance.totalReceivedRaw.plus(
      amount
    );
    toAccountBalance.totalSharesReceivedRaw = toAccountBalance.totalSharesReceivedRaw.plus(
      event.params.value
    );

    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    toAccountBalance.totalReceived = toDecimal(
      toAccountBalance.totalReceivedRaw,
      underlyingToken.decimals
    );
    toAccountBalance.totalSharesReceived = toDecimal(
      toAccountBalance.totalSharesReceivedRaw,
      shareToken.decimals
    );

    // Update fromAccount totals and balances
    fromAccountBalance.account = toAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
      amount
    );
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value
    );
    fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw.plus(
      amount
    );
    fromAccountBalance.totalSharesSentRaw = fromAccountBalance.totalSharesSentRaw.plus(
      event.params.value
    );

    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSent = toDecimal(
      fromAccountBalance.totalSentRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.totalSharesSent = toDecimal(
      fromAccountBalance.totalSharesSentRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
    fromAccountBalance.save();
  }

  // Vault deposit
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleDeposit(event, amount, toAccount.id, farmer, transactionId);
    // We should fact check that the amount deposited is exactly the same as calculated
    // If it's not, we should use a callHandler for deposit(_amount)

    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.underlyingToken;
    toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(
      amount
    );
    toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(
      event.params.value
    );
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
      amount
    );
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value
    );

    toAccountBalance.totalDeposited = toDecimal(
      toAccountBalance.totalDepositedRaw,
      underlyingToken.decimals
    );
    toAccountBalance.totalSharesMinted = toDecimal(
      toAccountBalance.totalSharesMintedRaw,
      shareToken.decimals
    );
    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );

    farmer.totalDepositedRaw = farmer.totalDepositedRaw.plus(amount);
    farmer.totalSharesMintedRaw = farmer.totalSharesMintedRaw.plus(
      event.params.value
    );

    farmer.totalDeposited = toDecimal(
      farmer.totalDepositedRaw,
      underlyingToken.decimals
    );
    farmer.totalSharesMinted = toDecimal(
      farmer.totalSharesMintedRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
  }

  // Vault withdraw
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    handleWithdrawal(event, amount, fromAccount.id, farmer, transactionId);
    // We should fact check that the amount withdrawn is exactly the same as calculated
    // If it's not, we should use a callHandler for withdraw(_amount)

    fromAccountBalance.account = fromAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;
    fromAccountBalance.totalWithdrawnRaw = fromAccountBalance.totalWithdrawnRaw.plus(
      amount
    );
    fromAccountBalance.totalSharesBurnedRaw = fromAccountBalance.totalSharesBurnedRaw.plus(
      event.params.value
    );
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
      amount
    );
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value
    );

    fromAccountBalance.totalWithdrawn = toDecimal(
      fromAccountBalance.totalWithdrawnRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.totalSharesBurned = toDecimal(
      fromAccountBalance.totalSharesBurnedRaw,
      shareToken.decimals
    );
    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );

    farmer.totalWithdrawnRaw = farmer.totalWithdrawnRaw.plus(amount);
    farmer.totalSharesBurnedRaw = farmer.totalSharesBurnedRaw.plus(
      event.params.value
    );

    farmer.totalWithdrawn = toDecimal(
      farmer.totalWithdrawnRaw,
      underlyingToken.decimals
    );
    farmer.totalSharesBurned = toDecimal(
      farmer.totalSharesBurnedRaw,
      shareToken.decimals
    );

    fromAccountBalance.save();
  }

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(
    farmer.netDepositsRaw,
    underlyingToken.decimals
  );
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

export function handleCompoundShareTransfer(event: Transfer): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateCompoundFarmer(event.address);
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(farmer.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;

  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.value
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.value;
  }

  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(farmer.id)
  );
  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  // Vault transfer between valid accounts
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    handleTransfer(
      event,
      amount,
      fromAccount.id,
      toAccount.id,
      farmer,
      transactionId
    );

    // Update toAccount totals and balances
    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.underlyingToken;
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
      amount
    );
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value
    );
    toAccountBalance.totalReceivedRaw = toAccountBalance.totalReceivedRaw.plus(
      amount
    );
    toAccountBalance.totalSharesReceivedRaw = toAccountBalance.totalSharesReceivedRaw.plus(
      event.params.value
    );

    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    toAccountBalance.totalReceived = toDecimal(
      toAccountBalance.totalReceivedRaw,
      underlyingToken.decimals
    );
    toAccountBalance.totalSharesReceived = toDecimal(
      toAccountBalance.totalSharesReceivedRaw,
      shareToken.decimals
    );

    // Update fromAccount totals and balances
    fromAccountBalance.account = toAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
      amount
    );
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value
    );
    fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw.plus(
      amount
    );
    fromAccountBalance.totalSharesSentRaw = fromAccountBalance.totalSharesSentRaw.plus(
      event.params.value
    );

    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSent = toDecimal(
      fromAccountBalance.totalSentRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.totalSharesSent = toDecimal(
      fromAccountBalance.totalSharesSentRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
    fromAccountBalance.save();
  }

  // Vault deposit
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleDeposit(event, amount, toAccount.id, farmer, transactionId);
    // We should fact check that the amount deposited is exactly the same as calculated
    // If it's not, we should use a callHandler for deposit(_amount)

    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.underlyingToken;
    toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(
      amount
    );
    toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(
      event.params.value
    );
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
      amount
    );
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value
    );

    toAccountBalance.totalDeposited = toDecimal(
      toAccountBalance.totalDepositedRaw,
      underlyingToken.decimals
    );
    toAccountBalance.totalSharesMinted = toDecimal(
      toAccountBalance.totalSharesMintedRaw,
      shareToken.decimals
    );
    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );

    farmer.totalDepositedRaw = farmer.totalDepositedRaw.plus(amount);
    farmer.totalSharesMintedRaw = farmer.totalSharesMintedRaw.plus(
      event.params.value
    );

    farmer.totalDeposited = toDecimal(
      farmer.totalDepositedRaw,
      underlyingToken.decimals
    );
    farmer.totalSharesMinted = toDecimal(
      farmer.totalSharesMintedRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
  }

  // Vault withdraw
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    handleWithdrawal(event, amount, fromAccount.id, farmer, transactionId);
    // We should fact check that the amount withdrawn is exactly the same as calculated
    // If it's not, we should use a callHandler for withdraw(_amount)

    fromAccountBalance.account = fromAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;
    fromAccountBalance.totalWithdrawnRaw = fromAccountBalance.totalWithdrawnRaw.plus(
      amount
    );
    fromAccountBalance.totalSharesBurnedRaw = fromAccountBalance.totalSharesBurnedRaw.plus(
      event.params.value
    );
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
      amount
    );
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value
    );

    fromAccountBalance.totalWithdrawn = toDecimal(
      fromAccountBalance.totalWithdrawnRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.totalSharesBurned = toDecimal(
      fromAccountBalance.totalSharesBurnedRaw,
      shareToken.decimals
    );
    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );

    farmer.totalWithdrawnRaw = farmer.totalWithdrawnRaw.plus(amount);
    farmer.totalSharesBurnedRaw = farmer.totalSharesBurnedRaw.plus(
      event.params.value
    );

    farmer.totalWithdrawn = toDecimal(
      farmer.totalWithdrawnRaw,
      underlyingToken.decimals
    );
    farmer.totalSharesBurned = toDecimal(
      farmer.totalSharesBurnedRaw,
      shareToken.decimals
    );

    fromAccountBalance.save();
  }

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(
    farmer.netDepositsRaw,
    underlyingToken.decimals
  );
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

export function handleHarvestShareTransfer(event: Transfer): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateHarvestFarmer(event.address);
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(farmer.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;

  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.value
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.value;
  }

  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(farmer.id)
  );
  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  // Vault transfer between valid accounts
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    handleTransfer(
      event,
      amount,
      fromAccount.id,
      toAccount.id,
      farmer,
      transactionId
    );

    // Update toAccount totals and balances
    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.underlyingToken;
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
      amount
    );
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value
    );
    toAccountBalance.totalReceivedRaw = toAccountBalance.totalReceivedRaw.plus(
      amount
    );
    toAccountBalance.totalSharesReceivedRaw = toAccountBalance.totalSharesReceivedRaw.plus(
      event.params.value
    );

    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    toAccountBalance.totalReceived = toDecimal(
      toAccountBalance.totalReceivedRaw,
      underlyingToken.decimals
    );
    toAccountBalance.totalSharesReceived = toDecimal(
      toAccountBalance.totalSharesReceivedRaw,
      shareToken.decimals
    );

    // Update fromAccount totals and balances
    fromAccountBalance.account = toAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
      amount
    );
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value
    );
    fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw.plus(
      amount
    );
    fromAccountBalance.totalSharesSentRaw = fromAccountBalance.totalSharesSentRaw.plus(
      event.params.value
    );

    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSent = toDecimal(
      fromAccountBalance.totalSentRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.totalSharesSent = toDecimal(
      fromAccountBalance.totalSharesSentRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
    fromAccountBalance.save();
  }

  // Vault deposit
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleDeposit(event, amount, toAccount.id, farmer, transactionId);
    // We should fact check that the amount deposited is exactly the same as calculated
    // If it's not, we should use a callHandler for deposit(_amount)

    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.underlyingToken;
    toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(
      amount
    );
    toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(
      event.params.value
    );
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
      amount
    );
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value
    );

    toAccountBalance.totalDeposited = toDecimal(
      toAccountBalance.totalDepositedRaw,
      underlyingToken.decimals
    );
    toAccountBalance.totalSharesMinted = toDecimal(
      toAccountBalance.totalSharesMintedRaw,
      shareToken.decimals
    );
    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );

    farmer.totalDepositedRaw = farmer.totalDepositedRaw.plus(amount);
    farmer.totalSharesMintedRaw = farmer.totalSharesMintedRaw.plus(
      event.params.value
    );

    farmer.totalDeposited = toDecimal(
      farmer.totalDepositedRaw,
      underlyingToken.decimals
    );
    farmer.totalSharesMinted = toDecimal(
      farmer.totalSharesMintedRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
  }

  // Vault withdraw
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    handleWithdrawal(event, amount, fromAccount.id, farmer, transactionId);
    // We should fact check that the amount withdrawn is exactly the same as calculated
    // If it's not, we should use a callHandler for withdraw(_amount)

    fromAccountBalance.account = fromAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;
    fromAccountBalance.totalWithdrawnRaw = fromAccountBalance.totalWithdrawnRaw.plus(
      amount
    );
    fromAccountBalance.totalSharesBurnedRaw = fromAccountBalance.totalSharesBurnedRaw.plus(
      event.params.value
    );
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
      amount
    );
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value
    );

    fromAccountBalance.totalWithdrawn = toDecimal(
      fromAccountBalance.totalWithdrawnRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.totalSharesBurned = toDecimal(
      fromAccountBalance.totalSharesBurnedRaw,
      shareToken.decimals
    );
    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );

    farmer.totalWithdrawnRaw = farmer.totalWithdrawnRaw.plus(amount);
    farmer.totalSharesBurnedRaw = farmer.totalSharesBurnedRaw.plus(
      event.params.value
    );

    farmer.totalWithdrawn = toDecimal(
      farmer.totalWithdrawnRaw,
      underlyingToken.decimals
    );
    farmer.totalSharesBurned = toDecimal(
      farmer.totalSharesBurnedRaw,
      shareToken.decimals
    );

    fromAccountBalance.save();
  }

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(
    farmer.netDepositsRaw,
    underlyingToken.decimals
  );
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

/** Citadel Strategy  **/

export function handleCitadelShareTransfer(event: Transfer): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateCitadelFarmer(event.address);
  farmer.underlyingToken = getOrCreateToken(event.address).id; // Added deposit token
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;

  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.value
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.value;
  }

  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(farmer.id)
  );
  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    handleCitadelTransferTemplate(
      event,
      amount,
      fromAccount.id,
      toAccount.id,
      farmer,
      transactionId
    );

    // Update toAccount totals and balances
    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.underlyingToken;
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
      amount
    );
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value
    );
    toAccountBalance.totalReceivedRaw = toAccountBalance.totalReceivedRaw.plus(
      amount
    );
    toAccountBalance.totalSharesReceivedRaw = toAccountBalance.totalSharesReceivedRaw.plus(
      event.params.value
    );

    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      shareToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    toAccountBalance.totalReceived = toDecimal(
      toAccountBalance.totalReceivedRaw,
      shareToken.decimals
    );
    toAccountBalance.totalSharesReceived = toDecimal(
      toAccountBalance.totalSharesReceivedRaw,
      shareToken.decimals
    );

    // Update fromAccount totals and balances
    fromAccountBalance.account = toAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
      amount
    );
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value
    );
    fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw.plus(
      amount
    );
    fromAccountBalance.totalSharesSentRaw = fromAccountBalance.totalSharesSentRaw.plus(
      event.params.value
    );

    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      shareToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSent = toDecimal(
      fromAccountBalance.totalSentRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSharesSent = toDecimal(
      fromAccountBalance.totalSharesSentRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
    fromAccountBalance.save();
  }

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(farmer.netDepositsRaw, shareToken.decimals);
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

export function handleCitadelDeposit(event: Deposit): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateCitadelFarmer(event.address);
  farmer.underlyingToken = getOrCreateToken(event.params.tokenDeposit).id; // Added deposit token

  let fromAccount = getOrCreateAccount(event.address.toHexString());
  let toAccount = getOrCreateAccount(event.params.caller.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(farmer.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;
  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.sharesMint
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw); // TODO Change to minted shares
  } else {
    amount = event.params.sharesMint;
  }

  let amountInUSD: BigInt;
  amountInUSD = event.params.amtDeposit
  let finalAmountInUSD: BigDecimal;
  finalAmountInUSD = toDecimal(amountInUSD, underlyingToken.decimals);

  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  // Vault deposit
  handleCitadelDepositTemplate(
    event,
    amount,
    finalAmountInUSD,
    toAccount.id,
    farmer,
    transactionId,
  );
  // We should fact check that the amount deposited is exactly the same as calculated
  // If it's not, we should use a callHandler for deposit(_amount)
  toAccountBalance.account = toAccount.id;
  toAccountBalance.farmer = farmer.id;
  toAccountBalance.shareToken = farmer.id;
  toAccountBalance.underlyingToken = farmer.underlyingToken;
  toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(
    amount
  );
  toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(
    event.params.sharesMint
  ); // TODO change to minted shares
  toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
    amount
  );
  toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
    event.params.sharesMint
  ); // TODO change to minted shares

  toAccountBalance.totalDeposited = toDecimal(
    toAccountBalance.totalDepositedRaw,
    underlyingToken.decimals
  );
  toAccountBalance.totalSharesMinted = toDecimal(
    toAccountBalance.totalSharesMintedRaw,
    shareToken.decimals
  );
  toAccountBalance.netDeposits = toDecimal(
    toAccountBalance.netDepositsRaw,
    underlyingToken.decimals
  );
  toAccountBalance.shareBalance = toDecimal(
    toAccountBalance.shareBalanceRaw,
    shareToken.decimals
  );

  farmer.totalDepositedRaw = farmer.totalDepositedRaw.plus(amount);
  farmer.totalSharesMintedRaw = farmer.totalSharesMintedRaw.plus(
    event.params.sharesMint
  ); // TODO change to minted shares

  farmer.totalDeposited = toDecimal(
    farmer.totalDepositedRaw,
    underlyingToken.decimals
  );
  farmer.totalSharesMinted = toDecimal(
    farmer.totalSharesMintedRaw,
    shareToken.decimals
  );

  toAccountBalance.save();

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(
    farmer.netDepositsRaw,
    underlyingToken.decimals
  );
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

export function handleCitadelWithdraw(event: Withdraw): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateCitadelFarmer(event.address);
  farmer.underlyingToken = getOrCreateToken(event.params.tokenWithdraw).id; // Added withdrawal token

  let fromAccount = getOrCreateAccount(event.params.caller.toHexString());
  let toAccount = getOrCreateAccount(event.address.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(farmer.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;

  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.sharesBurn
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.sharesBurn;
  }

  let amountInUSD: BigInt;
  amountInUSD = event.params.amtWithdraw;
  let finalAmountInUSD: BigDecimal;
  finalAmountInUSD = toDecimal(amountInUSD, underlyingToken.decimals);

  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  // Vault withdraw
  handleCitadelWithdrawalTemplate(
    event,
    amount,
    finalAmountInUSD,
    fromAccount.id,
    farmer,
    transactionId
  );
  // We should fact check that the amount withdrawn is exactly the same as calculated
  // If it's not, we should use a callHandler for withdraw(_amount)

  fromAccountBalance.account = fromAccount.id;
  fromAccountBalance.farmer = farmer.id;
  fromAccountBalance.shareToken = farmer.id;
  fromAccountBalance.underlyingToken = farmer.underlyingToken;
  fromAccountBalance.totalWithdrawnRaw = fromAccountBalance.totalWithdrawnRaw.plus(
    amount
  );
  fromAccountBalance.totalSharesBurnedRaw = fromAccountBalance.totalSharesBurnedRaw.plus(
    event.params.sharesBurn
  );
  fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
    amount
  );
  fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
    event.params.sharesBurn
  );

  fromAccountBalance.totalWithdrawn = toDecimal(
    fromAccountBalance.totalWithdrawnRaw,
    underlyingToken.decimals
  );
  fromAccountBalance.totalSharesBurned = toDecimal(
    fromAccountBalance.totalSharesBurnedRaw,
    shareToken.decimals
  );
  fromAccountBalance.netDeposits = toDecimal(
    fromAccountBalance.netDepositsRaw,
    underlyingToken.decimals
  );
  fromAccountBalance.shareBalance = toDecimal(
    fromAccountBalance.shareBalanceRaw,
    shareToken.decimals
  );

  farmer.totalWithdrawnRaw = farmer.totalWithdrawnRaw.plus(amount);
  farmer.totalSharesBurnedRaw = farmer.totalSharesBurnedRaw.plus(
    event.params.sharesBurn
  );

  farmer.totalWithdrawn = toDecimal(
    farmer.totalWithdrawnRaw,
    underlyingToken.decimals
  );
  farmer.totalSharesBurned = toDecimal(
    farmer.totalSharesBurnedRaw,
    shareToken.decimals
  );

  fromAccountBalance.save();

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(
    farmer.netDepositsRaw,
    underlyingToken.decimals
  );
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

/** Elon's Ape Strategy  **/

export function handleElonShareTransfer(event: Transfer): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateElonFarmer(event.address);
  farmer.underlyingToken = getOrCreateToken(event.address).id; // Added deposit token
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;

  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.value
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.value;
  }

  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(farmer.id)
  );
  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    handleTransfer(
      event,
      amount,
      fromAccount.id,
      toAccount.id,
      farmer,
      transactionId
    );

    // Update toAccount totals and balances
    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.underlyingToken;
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
      amount
    );
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value
    );
    toAccountBalance.totalReceivedRaw = toAccountBalance.totalReceivedRaw.plus(
      amount
    );
    toAccountBalance.totalSharesReceivedRaw = toAccountBalance.totalSharesReceivedRaw.plus(
      event.params.value
    );

    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      shareToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    toAccountBalance.totalReceived = toDecimal(
      toAccountBalance.totalReceivedRaw,
      shareToken.decimals
    );
    toAccountBalance.totalSharesReceived = toDecimal(
      toAccountBalance.totalSharesReceivedRaw,
      shareToken.decimals
    );

    // Update fromAccount totals and balances
    fromAccountBalance.account = toAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
      amount
    );
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value
    );
    fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw.plus(
      amount
    );
    fromAccountBalance.totalSharesSentRaw = fromAccountBalance.totalSharesSentRaw.plus(
      event.params.value
    );

    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      shareToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSent = toDecimal(
      fromAccountBalance.totalSentRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSharesSent = toDecimal(
      fromAccountBalance.totalSharesSentRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
    fromAccountBalance.save();
  }

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(farmer.netDepositsRaw, shareToken.decimals);
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

export function handleElonDeposit(event: Deposit): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateElonFarmer(event.address);
  farmer.underlyingToken = getOrCreateToken(event.params.tokenDeposit).id; // Added deposit token

  let fromAccount = getOrCreateAccount(event.address.toHexString());
  let toAccount = getOrCreateAccount(event.params.caller.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(farmer.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;
  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.sharesMint
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw); // TODO Change to minted shares
  } else {
    amount = event.params.sharesMint;
  }

  let amountInUSD: BigInt;
  amountInUSD = event.params.amtDeposit
  let finalAmountInUSD: BigDecimal;
  finalAmountInUSD = toDecimal(amountInUSD, underlyingToken.decimals);

  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  // Vault deposit
  handleElonDepositTemplate(
    event,
    amount,
    finalAmountInUSD,
    toAccount.id,
    farmer,
    transactionId,
  );
  // We should fact check that the amount deposited is exactly the same as calculated
  // If it's not, we should use a callHandler for deposit(_amount)
  toAccountBalance.account = toAccount.id;
  toAccountBalance.farmer = farmer.id;
  toAccountBalance.shareToken = farmer.id;
  toAccountBalance.underlyingToken = farmer.underlyingToken;
  toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(
    amount
  );
  toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(
    event.params.sharesMint
  ); // TODO change to minted shares
  toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
    amount
  );
  toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
    event.params.sharesMint
  ); // TODO change to minted shares

  toAccountBalance.totalDeposited = toDecimal(
    toAccountBalance.totalDepositedRaw,
    underlyingToken.decimals
  );
  toAccountBalance.totalSharesMinted = toDecimal(
    toAccountBalance.totalSharesMintedRaw,
    shareToken.decimals
  );
  toAccountBalance.netDeposits = toDecimal(
    toAccountBalance.netDepositsRaw,
    underlyingToken.decimals
  );
  toAccountBalance.shareBalance = toDecimal(
    toAccountBalance.shareBalanceRaw,
    shareToken.decimals
  );

  farmer.totalDepositedRaw = farmer.totalDepositedRaw.plus(amount);
  farmer.totalSharesMintedRaw = farmer.totalSharesMintedRaw.plus(
    event.params.sharesMint
  ); // TODO change to minted shares

  farmer.totalDeposited = toDecimal(
    farmer.totalDepositedRaw,
    underlyingToken.decimals
  );
  farmer.totalSharesMinted = toDecimal(
    farmer.totalSharesMintedRaw,
    shareToken.decimals
  );

  toAccountBalance.save();

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(
    farmer.netDepositsRaw,
    underlyingToken.decimals
  );
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

export function handleElonWithdraw(event: Withdraw): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateElonFarmer(event.address);
  farmer.underlyingToken = getOrCreateToken(event.params.tokenWithdraw).id; // Added withdrawal token

  let fromAccount = getOrCreateAccount(event.params.caller.toHexString());
  let toAccount = getOrCreateAccount(event.address.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(farmer.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;

  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.sharesBurn
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.sharesBurn;
  }

  let amountInUSD: BigInt;
  amountInUSD = event.params.amtWithdraw;
  let finalAmountInUSD: BigDecimal;
  finalAmountInUSD = toDecimal(amountInUSD, underlyingToken.decimals);

  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  // Vault withdraw
  handleElonWithdrawalTemplate(
    event,
    amount,
    finalAmountInUSD,
    fromAccount.id,
    farmer,
    transactionId
  );
  // We should fact check that the amount withdrawn is exactly the same as calculated
  // If it's not, we should use a callHandler for withdraw(_amount)

  fromAccountBalance.account = fromAccount.id;
  fromAccountBalance.farmer = farmer.id;
  fromAccountBalance.shareToken = farmer.id;
  fromAccountBalance.underlyingToken = farmer.underlyingToken;
  fromAccountBalance.totalWithdrawnRaw = fromAccountBalance.totalWithdrawnRaw.plus(
    amount
  );
  fromAccountBalance.totalSharesBurnedRaw = fromAccountBalance.totalSharesBurnedRaw.plus(
    event.params.sharesBurn
  );
  fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
    amount
  );
  fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
    event.params.sharesBurn
  );

  fromAccountBalance.totalWithdrawn = toDecimal(
    fromAccountBalance.totalWithdrawnRaw,
    underlyingToken.decimals
  );
  fromAccountBalance.totalSharesBurned = toDecimal(
    fromAccountBalance.totalSharesBurnedRaw,
    shareToken.decimals
  );
  fromAccountBalance.netDeposits = toDecimal(
    fromAccountBalance.netDepositsRaw,
    underlyingToken.decimals
  );
  fromAccountBalance.shareBalance = toDecimal(
    fromAccountBalance.shareBalanceRaw,
    shareToken.decimals
  );

  farmer.totalWithdrawnRaw = farmer.totalWithdrawnRaw.plus(amount);
  farmer.totalSharesBurnedRaw = farmer.totalSharesBurnedRaw.plus(
    event.params.sharesBurn
  );

  farmer.totalWithdrawn = toDecimal(
    farmer.totalWithdrawnRaw,
    underlyingToken.decimals
  );
  farmer.totalSharesBurned = toDecimal(
    farmer.totalSharesBurnedRaw,
    shareToken.decimals
  );

  fromAccountBalance.save();

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(
    farmer.netDepositsRaw,
    underlyingToken.decimals
  );
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

/** DAO FAANG Stonk */
export function handleFaangDeposit(event: FaangDeposit): void {
  let transactionId = event.address
  .toHexString()
  .concat("-")
  .concat(event.transaction.hash.toHexString())
  .concat("-")
  .concat(event.logIndex.toString());

  let farmer = getOrCreateFaangFarmer(event.address);
  farmer.underlyingToken = getOrCreateToken(event.params.token).id;

  let fromAccount = getOrCreateAccount(event.address.toHexString());
  let toAccount = getOrCreateAccount(event.params.from.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(farmer.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;
  if(farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.sharesMinted
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.sharesMinted;
  }

  // Amount in USD
  let amountInUSD: BigInt= event.params.amount
  let finalAmountInUSD: BigDecimal = toDecimal(amountInUSD, underlyingToken.decimals);

  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(farmer.id)
  )

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  // Vault Deposit
  handleFaangDepositTemplate(
    event,
    amount,
    finalAmountInUSD,
    toAccount.id,
    farmer,
    transactionId
  );

  toAccountBalance.account = toAccount.id;
  toAccountBalance.farmer = farmer.id;
  toAccountBalance.shareToken = farmer.id;
  toAccountBalance.underlyingToken = farmer.underlyingToken;
  toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(
    amount
  );
  toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(
    event.params.sharesMinted
  );
  toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
    amount
  );
  toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
    event.params.sharesMinted
  );
  toAccountBalance.totalDeposited = toDecimal(
    toAccountBalance.totalDepositedRaw,
    underlyingToken.decimals
  );
  toAccountBalance.totalSharesMinted = toDecimal(
    toAccountBalance.totalSharesMintedRaw,
    shareToken.decimals
  );
  toAccountBalance.netDeposits = toDecimal(
    toAccountBalance.netDepositsRaw,
    underlyingToken.decimals
  );
  toAccountBalance.shareBalance = toDecimal(
    toAccountBalance.shareBalanceRaw,
    shareToken.decimals
  );

  farmer.totalDepositedRaw = farmer.totalDepositedRaw.plus(amount);
  farmer.totalSharesMintedRaw = farmer.totalSharesMintedRaw.plus(
    event.params.sharesMinted
  ); // TODO change to minted shares

  farmer.totalDeposited = toDecimal(
    farmer.totalDepositedRaw,
    underlyingToken.decimals
  );
  farmer.totalSharesMinted = toDecimal(
    farmer.totalSharesMintedRaw,
    shareToken.decimals
  );

  toAccountBalance.save();

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(
    farmer.netDepositsRaw,
    underlyingToken.decimals
  );
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

export function handleFaangWithdrawal(event: FaangWithdrawal) : void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateFaangFarmer(event.address);
  farmer.underlyingToken = getOrCreateToken(event.params.token).id; // Added withdrawal token

  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.address.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(farmer.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;
  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.sharesBurned
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.sharesBurned;
  }

  let amountInUSD: BigInt = event.params.amount;
  let finalAmountInUSD: BigDecimal = toDecimal(amountInUSD, underlyingToken.decimals);

  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  // Vault withdraw
  handleFaangWithdrawalTemplate(
    event,
    amount,
    finalAmountInUSD,
    fromAccount.id,
    farmer,
    transactionId
  );

  fromAccountBalance.account = fromAccount.id;
  fromAccountBalance.farmer = farmer.id;
  fromAccountBalance.shareToken = farmer.id;
  fromAccountBalance.underlyingToken = farmer.underlyingToken;
  fromAccountBalance.totalWithdrawnRaw = fromAccountBalance.totalWithdrawnRaw.plus(
    amount
  );
  fromAccountBalance.totalSharesBurnedRaw = fromAccountBalance.totalSharesBurnedRaw.plus(
    event.params.sharesBurned
  );
  fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
    amount
  );
  fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
    event.params.sharesBurned
  );

  fromAccountBalance.totalWithdrawn = toDecimal(
    fromAccountBalance.totalWithdrawnRaw,
    underlyingToken.decimals
  );
  fromAccountBalance.totalSharesBurned = toDecimal(
    fromAccountBalance.totalSharesBurnedRaw,
    shareToken.decimals
  );
  fromAccountBalance.netDeposits = toDecimal(
    fromAccountBalance.netDepositsRaw,
    underlyingToken.decimals
  );
  fromAccountBalance.shareBalance = toDecimal(
    fromAccountBalance.shareBalanceRaw,
    shareToken.decimals
  );

  farmer.totalWithdrawnRaw = farmer.totalWithdrawnRaw.plus(amount);
  farmer.totalSharesBurnedRaw = farmer.totalSharesBurnedRaw.plus(
    event.params.sharesBurned
  );

  farmer.totalWithdrawn = toDecimal(
    farmer.totalWithdrawnRaw,
    underlyingToken.decimals
  );
  farmer.totalSharesBurned = toDecimal(
    farmer.totalSharesBurnedRaw,
    shareToken.decimals
  );

  fromAccountBalance.save();

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(
    farmer.netDepositsRaw,
    underlyingToken.decimals
  );
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}

export function handleFaangShareTransfer(event: Transfer): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let farmer = getOrCreateFaangFarmer(event.address);
  farmer.underlyingToken = getOrCreateToken(event.address).id; // Added deposit token
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());
  let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

  let amount: BigInt;

  // Actual value (amount) in underlying token
  if (farmer.totalSupplyRaw != BIGINT_ZERO) {
    amount = event.params.value
      .times(farmer.poolRaw)
      .div(farmer.totalSupplyRaw);
  } else {
    amount = event.params.value;
  }

  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(farmer.id)
  );
  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(farmer.id)
  );

  let transaction = getOrCreateTransaction(
    event.transaction.hash.toHexString()
  );
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  farmer.transaction = transaction.id;

  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    handleFaangTransferTemplate(
      event,
      amount,
      fromAccount.id,
      toAccount.id,
      farmer,
      transactionId
    );

     // Update toAccount totals and balances
     toAccountBalance.account = toAccount.id;
     toAccountBalance.farmer = farmer.id;
     toAccountBalance.shareToken = farmer.id;
     toAccountBalance.underlyingToken = farmer.underlyingToken;
     toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
       amount
     );
     toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
       event.params.value
     );
     toAccountBalance.totalReceivedRaw = toAccountBalance.totalReceivedRaw.plus(
       amount
     );
     toAccountBalance.totalSharesReceivedRaw = toAccountBalance.totalSharesReceivedRaw.plus(
       event.params.value
     );
 
     toAccountBalance.netDeposits = toDecimal(
       toAccountBalance.netDepositsRaw,
       shareToken.decimals
     );
     toAccountBalance.shareBalance = toDecimal(
       toAccountBalance.shareBalanceRaw,
       shareToken.decimals
     );
     toAccountBalance.totalReceived = toDecimal(
       toAccountBalance.totalReceivedRaw,
       shareToken.decimals
     );
     toAccountBalance.totalSharesReceived = toDecimal(
       toAccountBalance.totalSharesReceivedRaw,
       shareToken.decimals
     );

      // Update fromAccount totals and balances
    fromAccountBalance.account = toAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(
      amount
    );
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value
    );
    fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw.plus(
      amount
    );
    fromAccountBalance.totalSharesSentRaw = fromAccountBalance.totalSharesSentRaw.plus(
      event.params.value
    );

    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      shareToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSent = toDecimal(
      fromAccountBalance.totalSentRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSharesSent = toDecimal(
      fromAccountBalance.totalSharesSentRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
    fromAccountBalance.save();
  }

  farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
    farmer.totalWithdrawnRaw
  );
  farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
    farmer.totalSharesBurnedRaw
  );

  farmer.netDeposits = toDecimal(farmer.netDepositsRaw, shareToken.decimals);
  farmer.totalActiveShares = toDecimal(
    farmer.totalActiveSharesRaw,
    shareToken.decimals
  );

  farmer.save();
  fromAccount.save();
  toAccount.save();
}