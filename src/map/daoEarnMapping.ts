import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Farmer } from "../../generated/schema";
import { Deposit } from "../../generated/DAOVaultEarnLUSD/DAOEarn";
import { BIGINT_ZERO } from "../utils/constants";
import { 
    getOrCreateAccount, 
    getOrCreateDAOEarnFarmer, 
    getOrCreateToken,
    getOrCreateDAOEarnLPToken ,
    getOrCreateAccountVaultBalance
} from "../utils/helpers";
import {
    getOrCreateTransaction,
    getOrCreateVaultDeposit
} from "../utils/helpers/yearn-farmer/vault";
import { toDecimal } from "../utils/decimals";

function handleDAOEarnDepositTemplate(
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
    deposit.shares = event.params.sharesMint;
    deposit.totalSupply = vault.totalSupplyRaw;
    deposit.transaction = event.transaction.hash.toHexString();

    deposit.save();
}

export function handleDAOEarnDeposit(event: Deposit): void {
    let transactionId = event.address
        .toHexString()
        .concat("-")
        .concat(event.transaction.hash.toHexString())
        .concat("-")
        .concat(event.logIndex.toString());

    let farmer = getOrCreateDAOEarnFarmer(event.address);
    farmer.underlyingToken = getOrCreateDAOEarnLPToken(event.address).id;

    let fromAccount = getOrCreateAccount(event.address.toHexString());
    let toAccount = getOrCreateAccount(event.params.caller.toHexString());
    let underlyingToken = getOrCreateDAOEarnLPToken(event.address);

    // daoERN
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

    let amount: BigInt;
    // Actual value (amount) in underlying token
    if (farmer.totalSupplyRaw != BIGINT_ZERO) {
        amount = event.params.sharesMint
        .times(farmer.poolRaw)
        .div(farmer.totalSupplyRaw);
    } else {
        amount = event.params.sharesMint;
    }
     // Amount In USD
    let amountInUSD: BigInt = event.params.amtDeposit
    let finalAmountInUSD: BigDecimal = toDecimal(amountInUSD, underlyingToken.decimals);

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

    // Vault Deposit
    handleDAOEarnDepositTemplate(
        event,
        amount,
        finalAmountInUSD,
        toAccount.id,
        farmer,
        transaction.id
    );

    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.underlyingToken;
    toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(
        amount
    );
    toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(
        event.params.sharesMint
    );
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(
        amount
    );
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
        event.params.sharesMint
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