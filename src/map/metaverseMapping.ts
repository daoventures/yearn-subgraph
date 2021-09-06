import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Deposit, Metaverse } from "../../generated/DAOVaultMetaverse/Metaverse";
import { Farmer } from "../../generated/schema";
import { BIGINT_ZERO } from "../utils/constants";
import { toDecimal } from "../utils/decimals";
import { getOrCreateAccount, getOrCreateAccountVaultBalance, getOrCreateMetaverseFarmer, getOrCreateToken } from "../utils/helpers";
import { getOrCreateTransaction, getOrCreateVaultDeposit } from "../utils/helpers/yearn-farmer/vault";

function handleMetaverseDepositTemplate(
    event: Deposit,
    amountInUSD: BigDecimal,
    accountId: string,
    vault: Farmer,
    transactionId: string
):void {
    let deposit = getOrCreateVaultDeposit(transactionId);
    
    deposit.farmer = vault.id;
    deposit.account = accountId;
    deposit.amount = BIGINT_ZERO; // need admin to trigger invest() in order to mint shares, so at deposit moment we cannot get user's shares.
    deposit.shares =  BIGINT_ZERO;
    deposit.amountInUSD = amountInUSD;
    deposit.totalSupply = vault.totalSupplyRaw;
    deposit.transaction = event.transaction.hash.toHexString();

    deposit.save();
}

export function handleMetaverseDeposit(event: Deposit): void {
    let farmer = getOrCreateMetaverseFarmer(event.address);
    let toAccount = getOrCreateAccount(event.params.caller.toHexString());
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));
    let metaverseContract = Metaverse.bind(event.address);

    // Deposited amount from USDC, USDT or DAI in 18 decimals
    let amountInUSDRaw: BigInt = event.params.depositAmt;
    let amountInUSD: BigDecimal = toDecimal(event.params.depositAmt, 18);

    let transaction = getOrCreateTransaction(
        event.transaction.hash.toHexString()
    );

    transaction.blockNumber = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.transactionHash = event.transaction.hash;
    transaction.save();

    farmer.transaction = transaction.id;
    farmer.underlyingToken = shareToken.id;

    // Vault Deposit
    handleMetaverseDepositTemplate(
        event, 
        amountInUSD,
        toAccount.id,
        farmer,
        event.transaction.hash.toHexString()
    );

    // To Account Balance
    let toAccountBalance = getOrCreateAccountVaultBalance(
        toAccount.id.concat("-").concat(farmer.id)
    )
    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = shareToken.id;
    toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(amountInUSDRaw);
    toAccountBalance.totalDeposited = toDecimal(
        toAccountBalance.totalDepositedRaw,
        18
    );
    // Set as BIG_INT zero as shares minted after invest() is called.
    toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(BIGINT_ZERO);
    toAccountBalance.totalSharesMinted = toDecimal(
        toAccountBalance.totalSharesMintedRaw,
        shareToken.decimals
    );

    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(amountInUSDRaw);
    toAccountBalance.netDeposits = toDecimal(
        toAccountBalance.netDepositsRaw,
        18
    );

    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(BIGINT_ZERO);
    toAccountBalance.shareBalance = toDecimal(
        toAccountBalance.shareBalanceRaw,
        shareToken.decimals
    );

    toAccountBalance.save();

    // Use amount in USD to sum up, since we don't have shares minted to get back default amount
    // before fee subtraction.
    farmer.totalDepositedRaw = farmer.totalDepositedRaw.plus(amountInUSDRaw);
    farmer.totalDeposited = toDecimal(
        farmer.totalDepositedRaw,
        18
    )

    // Use latest balance of to represent total shares minted, shares after deposit will not be minted until
    // admin is calling invest(), example user A deposit for first time, she will not get her shares
    // minted until admin trigger invest()
    let totalSharesMinted = metaverseContract.try_balanceOf(event.params.caller);
    farmer.totalSharesMintedRaw = !totalSharesMinted.reverted 
        ? totalSharesMinted.value
        : farmer.totalSharesMintedRaw;
    farmer.totalSharesMinted = toDecimal(
        farmer.totalSharesMintedRaw,
        shareToken.decimals
    );

    farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(
        farmer.totalWithdrawnRaw
    );
    farmer.netDeposits = toDecimal(
        farmer.netDepositsRaw,
        shareToken.decimals
    )

    farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(
        farmer.totalSharesBurnedRaw
    )
    farmer.totalActiveShares = toDecimal(
        farmer.totalActiveSharesRaw,
        shareToken.decimals
    )

    farmer.save();
    toAccount.save();
}