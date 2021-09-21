import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Deposit } from "../../generated/DAOVaultCitadelV2/CitadelV2";
import { Farmer } from "../../generated/schema";
import { BIGINT_ZERO } from "../utils/constants";
import { toDecimal } from "../utils/decimals";
import { getOrCreateAccount, getOrCreateToken } from "../utils/helpers";
import { getOrCreateCitadelV2Farmer, getOrCreateTransaction, getOrCreateVaultDeposit } from "../utils/helpers/yearn-farmer/vault";

function handleCitadelV2DepositTemplate(
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
    deposit.shares =  BIGINT_ZERO; // need admin to trigger invest() in order to mint shares, so at deposit moment we cannot get user's shares.
    deposit.amountInUSD = amountInUSD;
    deposit.totalSupply = vault.totalSupplyRaw;
    deposit.transaction = transactionId;
    
    deposit.save();
}

export function handleCitadelV2Deposit(event: Deposit): void {
    let farmer = getOrCreateCitadelV2Farmer(event.address);
    let toAccount = getOrCreateAccount(event.params.caller.toHexString());
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

    // Deposited amount from USDC, USDT or DAI in 18 decimals
    let amountInUSDRaw: BigInt= event.params.depositAmt;
    let amountInUSD: BigDecimal = toDecimal(amountInUSDRaw, 18);

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
    handleCitadelV2DepositTemplate(
        event, 
        amountInUSD,
        toAccount.id,
        farmer,
        transaction.id
    );

    toAccount.save();
    farmer.save();
}
