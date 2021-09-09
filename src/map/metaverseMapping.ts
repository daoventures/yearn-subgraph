import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Deposit, DistributeLPToken, Metaverse, Transfer, Withdraw } from "../../generated/DAOVaultMetaverse/Metaverse";
import { Farmer } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, ZERO_ADDRESS } from "../utils/constants";
import { toDecimal } from "../utils/decimals";
import { getOrCreateAccount, getOrCreateAccountVaultBalance, getOrCreateMetaverseFarmer, getOrCreateToken } from "../utils/helpers";
import { getOrCreateTransaction, getOrCreateVaultDeposit, getOrCreateVaultTransfer, getOrCreateVaultWithdrawal } from "../utils/helpers/yearn-farmer/vault";

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
    deposit.shares =  BIGINT_ZERO; // need admin to trigger invest() in order to mint shares, so at deposit moment we cannot get user's shares.
    deposit.amountInUSD = amountInUSD;
    deposit.totalSupply = vault.totalSupplyRaw;
    deposit.transaction = event.transaction.hash.toHexString();

    deposit.save();
}

function handleMetaverseWithdrawTemplate(
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
    withdraw.transaction = transactionId;

    withdraw.save();
}

function handleMetaverseTransferTemplate(
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

    // TODO: Find transfer share in USD
    // transfer.amountInUSD = BIGINT_ZERO;
    transfer.amountInUSD = BIGDECIMAL_ZERO;
    
    transfer.save();
}

export function handleMetaverseDeposit(event: Deposit): void {
    let farmer = getOrCreateMetaverseFarmer(event.address);
    let toAccount = getOrCreateAccount(event.params.caller.toHexString());
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));
    let metaverseContract = Metaverse.bind(event.address);

    // Deposited amount from USDC, USDT or DAI in 18 decimals
    let amountInUSDRaw: BigInt = event.params.depositAmt;
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
    handleMetaverseDepositTemplate(
        event, 
        amountInUSD,
        toAccount.id,
        farmer,
        event.transaction.hash.toHexString()
    );

    farmer.save();
}

export function handleMetaverseShareMinted(event: DistributeLPToken): void {
    let farmer = getOrCreateMetaverseFarmer(event.address);
    let toAccount = getOrCreateAccount(event.params.receiver.toHexString());
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

    let metaverseContract = Metaverse.bind(event.address);

    let shares: BigInt = event.params.shareMint;
    let sharesAmount: BigInt;
    if (farmer.totalSupplyRaw !== BIGINT_ZERO) {
        let ppfs = metaverseContract.try_getPricePerFullShare();
        let pricePerFullShare = !ppfs.reverted
            ? ppfs.value
            : BIGINT_ZERO;

        sharesAmount = shares.times(pricePerFullShare);
    } else {
        sharesAmount = shares;
    }

    let toAccountBalance = getOrCreateAccountVaultBalance(
        toAccount.id.concat("-").concat(farmer.id)
    );

    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.id;

    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(sharesAmount);
    toAccountBalance.netDeposits = toDecimal(
        toAccountBalance.netDepositsRaw,
        shareToken.decimals
    );

    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(shares);
    toAccountBalance.shareBalance = toDecimal(
        toAccountBalance.shareBalanceRaw,
        shareToken.decimals
    );

    // Shares Minted
    toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(sharesAmount);
    toAccountBalance.totalDeposited = toDecimal(
        toAccountBalance.totalDepositedRaw,
        shareToken.decimals
    );

    toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(shares);
    toAccountBalance.totalSharesMinted = toDecimal(
        toAccountBalance.totalSharesMintedRaw,
        shareToken.decimals
    );

    toAccountBalance.save();

    // Update Farmer
    farmer.totalDepositedRaw = farmer.totalDepositedRaw.plus(sharesAmount);
    farmer.totalDeposited = toDecimal(
        farmer.totalDepositedRaw,
        shareToken.decimals
    );

    farmer.totalSharesMintedRaw = farmer.totalSharesMintedRaw.plus(shares);
    farmer.totalSharesMinted = toDecimal(
        farmer.totalSharesMintedRaw,
        shareToken.decimals
    );

    farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(farmer.totalWithdrawnRaw);
    farmer.netDeposits = toDecimal(
        farmer.netDepositsRaw,
        shareToken.decimals
    );

    farmer.totalActiveSharesRaw = farmer.totalSharesMintedRaw.minus(farmer.totalSharesBurnedRaw);
    farmer.totalActiveShares = toDecimal(
        farmer.totalActiveSharesRaw,
        shareToken.decimals
    );

    farmer.save();
}

export function handleMetaverseWithdraw(event: Withdraw): void {
    let farmer = getOrCreateMetaverseFarmer(event.address);
    farmer.underlyingToken = getOrCreateToken(event.params.tokenWithdraw).id;
   
    let fromAccount = getOrCreateAccount(event.params.caller.toHexString());
    let underlyingToken = getOrCreateToken(Address.fromString(farmer.underlyingToken));
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));
    let metaverseContract = Metaverse.bind(event.address);

    let amount: BigInt;
    let sharesBurn = event.params.sharesBurn;
    if(farmer.totalSupplyRaw != BIGINT_ZERO) {
        let ppfs = metaverseContract.try_getPricePerFullShare();
        let pricePerFullShare = !ppfs.reverted
            ? ppfs.value
            : BIGINT_ZERO
        amount = sharesBurn.times(pricePerFullShare);
    } else {
        amount = sharesBurn;
    }

    let amountInUSDRaw: BigInt = event.params.withdrawAmt;
    let amountInUSD = toDecimal(amountInUSDRaw, underlyingToken.decimals);

    let transaction = getOrCreateTransaction(
        event.transaction.hash.toHexString()
    );
    transaction.blockNumber = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.transactionHash = event.transaction.hash;
    transaction.save();

    farmer.transaction = transaction.id;

    // Vault withdraw
    handleMetaverseWithdrawTemplate(
        event, 
        amount,
        amountInUSD,
        fromAccount.id,
        farmer,
        transaction.id
    );

    let fromAccountBalance = getOrCreateAccountVaultBalance(
        fromAccount.id.concat("-").concat(farmer.id)
    );
    fromAccountBalance.account = fromAccount.id;
    fromAccountBalance.farmer = farmer.id;
    fromAccountBalance.shareToken = farmer.id;
    fromAccountBalance.underlyingToken = farmer.underlyingToken;

    fromAccountBalance.totalWithdrawnRaw = fromAccountBalance.totalWithdrawnRaw.plus(amount);
    fromAccountBalance.totalWithdrawn = toDecimal(
        fromAccountBalance.totalWithdrawnRaw,
        shareToken.decimals
    );
    
    fromAccountBalance.totalSharesBurnedRaw = fromAccountBalance.totalSharesBurnedRaw.plus(sharesBurn);
    fromAccountBalance.totalSharesBurned = toDecimal(
        fromAccountBalance.totalSharesBurnedRaw,
        shareToken.decimals
    );

    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(amount);
    fromAccountBalance.netDeposits = toDecimal(
        fromAccountBalance.netDepositsRaw,
        shareToken.decimals
    );

    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(sharesBurn);
    fromAccountBalance.shareBalance = toDecimal(
        fromAccountBalance.shareBalanceRaw,
        shareToken.decimals
    );

    fromAccountBalance.save();

    farmer.totalWithdrawnRaw = farmer.totalWithdrawnRaw.plus(amount);
    farmer.totalWithdrawn = toDecimal(
        farmer.totalWithdrawnRaw,
        shareToken.decimals
    );

    farmer.totalSharesBurnedRaw = farmer.totalSharesBurnedRaw.plus(sharesBurn);
    farmer.totalSharesBurned = toDecimal(
        farmer.totalSharesBurnedRaw,
        shareToken.decimals
    );

    farmer.netDepositsRaw = farmer.totalDepositedRaw.minus(farmer.totalWithdrawnRaw);
    farmer.netDeposits = toDecimal(
        farmer.netDepositsRaw,
        shareToken.decimals
    );

    farmer.totalActiveSharesRaw = farmer.totalActiveSharesRaw.minus(farmer.totalSharesBurnedRaw);
    farmer.totalActiveShares = toDecimal(
        farmer.totalActiveSharesRaw,
        shareToken.decimals
    );

    farmer.save();
}

export function handleMetaverseShareTransfer(event: Transfer): void {
    let farmer = getOrCreateMetaverseFarmer(event.address);
    farmer.underlyingToken = getOrCreateToken(event.address).id;
    let fromAccount = getOrCreateAccount(event.params.from.toHexString()); // sender
    let toAccount = getOrCreateAccount(event.params.to.toHexString()); // recipient
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

    let amount: BigInt;
    let metaverseContract = Metaverse.bind(event.address);
    if(farmer.totalSupplyRaw != BIGINT_ZERO) {
        let ppfs = metaverseContract.try_getPricePerFullShare();
        let pricePerFullShare = !ppfs.reverted
            ? ppfs.value
            : BIGINT_ZERO;
        amount = event.params.value.times(pricePerFullShare);
    } else {
        amount = event.params.value;
    }

    let transaction = getOrCreateTransaction(
        event.transaction.hash.toHexString()
    );
    transaction.blockNumber = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.transactionHash = event.transaction.hash;
    transaction.save();

    farmer.transaction = transaction.id;

    let toAccountBalance = getOrCreateAccountVaultBalance(
        toAccount.id.concat("-").concat(farmer.id)
    );
    let fromAccountBalance = getOrCreateAccountVaultBalance(
        fromAccount.id.concat("-").concat(farmer.id)
    )

    if(
        event.params.to.toHexString() !== ZERO_ADDRESS &&
        event.params.from.toHexString() !== ZERO_ADDRESS
    ) {
        handleMetaverseTransferTemplate(
            event, 
            amount,
            fromAccount.id,
            toAccount.id,
            farmer,
            transaction.id
        );

        // Update recipient account totals and balances
        toAccountBalance.account = toAccount.id;
        toAccountBalance.farmer = farmer.id;
        toAccountBalance.shareToken = farmer.id;
        toAccountBalance.underlyingToken = farmer.underlyingToken;

        toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(amount);
        toAccountBalance.netDeposits = toDecimal(
            toAccountBalance.netDepositsRaw, 
            shareToken.decimals
        );

        toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(event.params.value);
        toAccountBalance.shareBalance = toDecimal(
            toAccountBalance.shareBalanceRaw,
            shareToken.decimals
        );
        
        toAccountBalance.totalReceivedRaw = toAccountBalance.totalReceivedRaw.plus(amount);
        toAccountBalance.netDeposits = toDecimal(
            toAccountBalance.netDepositsRaw,
            shareToken.decimals
        );

        toAccountBalance.totalSharesReceivedRaw = toAccountBalance.totalSharesReceivedRaw.plus(event.params.value);
        toAccountBalance.totalSharesReceived = toDecimal(
            toAccountBalance.totalSharesReceivedRaw,
            shareToken.decimals
        ); 

        // Update sender account total and balances
        fromAccountBalance.account = fromAccount.id;
        fromAccountBalance.farmer = farmer.id;
        fromAccountBalance.shareToken = farmer.id;
        fromAccountBalance.underlyingToken = farmer.underlyingToken;

        fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(amount);
        fromAccountBalance.netDeposits = toDecimal( 
            fromAccountBalance.netDepositsRaw,
            shareToken.decimals
        );

        fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(event.params.value);
        fromAccountBalance.shareBalance = toDecimal(
            fromAccountBalance.shareBalanceRaw,
            shareToken.decimals
        );

        fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw.plus(amount);
        fromAccountBalance.totalSent = toDecimal(
            fromAccountBalance.totalSentRaw,
            shareToken.decimals
        );

        fromAccountBalance.totalSharesSentRaw = fromAccountBalance.totalSharesSentRaw.plus(event.params.value);
        fromAccountBalance.totalSharesSent = toDecimal(
            fromAccountBalance.totalSharesSentRaw,
            shareToken.decimals
        );    
    }

    toAccountBalance.save();
    fromAccountBalance.save();
}