import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CitadelV2, Deposit, DistributeLPToken, Transfer, Withdraw } from "../../generated/DAOVaultCitadelV2/CitadelV2";
import { Farmer } from "../../generated/schema";
import { BIGINT_ZERO, ZERO_ADDRESS } from "../utils/constants";
import { getPrecision, toDecimal } from "../utils/decimals";
import { getOrCreateAccount, getOrCreateAccountVaultBalance, getOrCreateToken } from "../utils/helpers";
import { getOrCreateCitadelV2Farmer, getOrCreateTransaction, getOrCreateVaultDeposit, getOrCreateVaultDistributeLPToken, getOrCreateVaultTransfer, getOrCreateVaultWithdrawal } from "../utils/helpers/yearn-farmer/vault";

function handleCitadelV2DepositTemplate(
    event: Deposit,
    amountInUSD: BigDecimal,
    accountId: string,
    vault: Farmer,
    transactionId: string
): void {
    let deposit = getOrCreateVaultDeposit(transactionId);

    deposit.farmer = vault.id;
    deposit.account = accountId;
    deposit.amount = BIGINT_ZERO; // need admin to trigger invest() in order to mint shares, so at deposit moment we cannot get user's shares.
    deposit.shares = BIGINT_ZERO; // need admin to trigger invest() in order to mint shares, so at deposit moment we cannot get user's shares.
    deposit.amountInUSD = amountInUSD;
    deposit.totalSupply = vault.totalSupplyRaw;
    deposit.transaction = transactionId;

    deposit.save();
}

function handleCitadelV2WithdrawTemplate(
    event: Withdraw,
    sharesAmountRaw: BigInt,
    sharesAmount: BigDecimal,
    pricePerFullShareUSD: BigDecimal,
    accountId: string,
    vault: Farmer,
    transactionId: string
): void {
    let withdraw = getOrCreateVaultWithdrawal(transactionId);
    
    withdraw.farmer = vault.id;
    withdraw.account = accountId;
    withdraw.amount = sharesAmountRaw;
    withdraw.amountInUSD = sharesAmount;
    withdraw.shares = event.params.sharesBurn;
    withdraw.pricePerFullShare = pricePerFullShareUSD;
    withdraw.totalSupply = vault.totalSupplyRaw;
    withdraw.transaction = transactionId;

    withdraw.save();
}

function handleCitadelV2TransferTemplate(
    event: Transfer,
    amount: BigInt,
    amountInUSD: BigDecimal,
    pricePerFullShare: BigDecimal,
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
    transfer.amountInUSD = amountInUSD;
    transfer.pricePerFullShare = pricePerFullShare;
    
    transfer.save();
}

export function handleCitadelV2Deposit(event: Deposit): void {
    let farmer = getOrCreateCitadelV2Farmer(event.address);
    let toAccount = getOrCreateAccount(event.params.caller.toHexString());
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

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

export function handleCitadelV2ShareMinted(event: DistributeLPToken): void {
    let farmer = getOrCreateCitadelV2Farmer(event.address);
    let toAccount = getOrCreateAccount(event.params.receiver.toHexString());
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

    let citadelv2Contract = CitadelV2.bind(Address.fromString(farmer.id));

    // Price per full share
    let ppfs = citadelv2Contract.try_getPricePerFullShare();
    let ppfsRaw = !ppfs.reverted
        ? ppfs.value
        : BIGINT_ZERO;
    let pricePerFullShareUSD: BigDecimal = toDecimal(
        ppfsRaw,
        18
    );

    // Shares Minted
    let sharesRaw: BigInt = event.params.shareMint;
    let shares: BigDecimal = toDecimal(
        sharesRaw,
        18
    );

    let sharesAmount = shares.times(pricePerFullShareUSD);
    let sharesAmountRaw = sharesRaw.times(ppfsRaw).div(getPrecision(18));

    // Update recipient's Account Balance
    let toAccountBalance = getOrCreateAccountVaultBalance(
        toAccount.id.concat("-").concat(farmer.id)
    );

    toAccountBalance.account = toAccount.id;
    toAccountBalance.farmer = farmer.id;
    toAccountBalance.shareToken = farmer.id;
    toAccountBalance.underlyingToken = farmer.id;

    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(sharesAmountRaw);
    toAccountBalance.netDeposits = toDecimal(
        toAccountBalance.netDepositsRaw,
        shareToken.decimals
    );

    toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(sharesAmountRaw);
    toAccountBalance.totalDeposited = toDecimal(
        toAccountBalance.totalDepositedRaw,
        shareToken.decimals
    );

    toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(sharesRaw);
    toAccountBalance.totalSharesMinted = toDecimal(
        toAccountBalance.totalSharesMintedRaw,
        shareToken.decimals
    );

    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(sharesRaw);
    toAccountBalance.shareBalance = toDecimal(
        toAccountBalance.shareBalanceRaw,
        shareToken.decimals
    );

    toAccountBalance.save();

    // Update Distribute Token Entity
    let transactionHash = event.transaction.hash.toHexString();
    let distributeToken = getOrCreateVaultDistributeLPToken(
        transactionHash.concat("-").concat(toAccount.id)
    );
    distributeToken.timestamp = event.block.timestamp;
    distributeToken.blockNumber = event.block.number;
    distributeToken.transactionHash = event.transaction.hash;

    distributeToken.totalSharesMintedRaw = event.params.shareMint;
    distributeToken.totalSharesMinted = toDecimal(
        distributeToken.totalSharesMintedRaw,
        shareToken.decimals
    );

    distributeToken.amountRaw = sharesAmountRaw,
        distributeToken.amount = sharesAmount;

    distributeToken.pricePerFullShareUSD = pricePerFullShareUSD;
    distributeToken.pricePerFullShareUSDRaw = ppfsRaw;

    distributeToken.account = toAccount.id;

    // Update Farmer Balance
    farmer.totalDepositedRaw = farmer.totalDepositedRaw.plus(sharesAmountRaw);
    farmer.totalDeposited = toDecimal(
        farmer.totalDepositedRaw,
        shareToken.decimals
    );

    farmer.totalSharesMintedRaw = farmer.totalSharesMintedRaw.plus(sharesRaw);
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
    toAccount.save();
    distributeToken.save();
}

export function handleCitadelV2Withdraw(event: Withdraw): void {
    let farmer = getOrCreateCitadelV2Farmer(event.address);
   farmer.underlyingToken = getOrCreateToken(event.params.tokenWithdraw).id;
  
   let fromAccount = getOrCreateAccount(event.params.caller.toHexString());
   let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));
   let citadelv2Contract = CitadelV2.bind(event.address);

   // Price per full share
   let ppfs = citadelv2Contract.try_getPricePerFullShare();
   let ppfsRaw = !ppfs.reverted
       ? ppfs.value
       : BIGINT_ZERO;
   let pricePerFullShareUSD: BigDecimal = toDecimal(
       ppfsRaw,
       18
   );

   // Shares
   let sharesRaw: BigInt = event.params.sharesBurn;
   let shares:BigDecimal = toDecimal(
       sharesRaw,
       shareToken.decimals
   );

   // Calculate shares amount based on price per full share
   let sharesAmount = (farmer.totalSupplyRaw !== BIGINT_ZERO)
       ? shares.times(pricePerFullShareUSD)
       : shares;
       let sharesAmountRaw = sharesRaw.times(ppfsRaw).div(getPrecision(18));

   // Save Withdrawal transaction
   let transaction = getOrCreateTransaction(
       event.transaction.hash.toHexString()
   );
   transaction.blockNumber = event.block.number;
   transaction.timestamp = event.block.timestamp;
   transaction.transactionHash = event.transaction.hash;
   transaction.save();

   farmer.transaction = transaction.id;

   // Save Withdraw Object
   handleCitadelV2WithdrawTemplate(
       event, 
       sharesAmountRaw, // Raw price is calculated in USD using price per full share in USD
       sharesAmount, // price is calculated in USD
       pricePerFullShareUSD,
       fromAccount.id,
       farmer,
       transaction.id
   );

   // Update Owner's Account Balance Entity
   let fromAccountBalance = getOrCreateAccountVaultBalance(
       fromAccount.id.concat("-").concat(farmer.id)
   );
   fromAccountBalance.account = fromAccount.id;
   fromAccountBalance.farmer = farmer.id;
   fromAccountBalance.shareToken = farmer.id;
   fromAccountBalance.underlyingToken = farmer.underlyingToken;

   fromAccountBalance.totalWithdrawnRaw = fromAccountBalance.totalWithdrawnRaw.plus(sharesAmountRaw);
   fromAccountBalance.totalWithdrawn = toDecimal(
       fromAccountBalance.totalWithdrawnRaw,
       shareToken.decimals
   );
   
   fromAccountBalance.totalSharesBurnedRaw = fromAccountBalance.totalSharesBurnedRaw.plus(sharesRaw);
   fromAccountBalance.totalSharesBurned = toDecimal(
       fromAccountBalance.totalSharesBurnedRaw,
       shareToken.decimals
   );

   fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(sharesAmountRaw);
   fromAccountBalance.netDeposits = toDecimal(
       fromAccountBalance.netDepositsRaw,
       shareToken.decimals
   );

   fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(sharesRaw);
   fromAccountBalance.shareBalance = toDecimal(
       fromAccountBalance.shareBalanceRaw,
       shareToken.decimals
   );

   fromAccountBalance.save();

   // Update Strategies Balances
   farmer.totalWithdrawnRaw = farmer.totalWithdrawnRaw.plus(sharesAmountRaw);
   farmer.totalWithdrawn = toDecimal(
       farmer.totalWithdrawnRaw,
       shareToken.decimals
   );

   farmer.totalSharesBurnedRaw = farmer.totalSharesBurnedRaw.plus(sharesRaw);
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

export function handleCitadelV2ShareTransfer(event: Transfer): void {
    let farmer = getOrCreateCitadelV2Farmer(event.address);
    farmer.underlyingToken = getOrCreateToken(event.address).id;
    let fromAccount = getOrCreateAccount(event.params.from.toHexString()); // sender
    let toAccount = getOrCreateAccount(event.params.to.toHexString()); // recipient
    let shareToken = getOrCreateToken(Address.fromString(farmer.shareToken));

    let metaverseContract = CitadelV2.bind(event.address);

    // Price per full share
    let ppfs = metaverseContract.try_getPricePerFullShare();
    let ppfsRaw = !ppfs.reverted
        ? ppfs.value
        : BIGINT_ZERO;
    let pricePerFullShareUSD: BigDecimal = toDecimal(
        ppfsRaw,
        18
    );

    // Shares
    let sharesRaw: BigInt = event.params.value;
    let shares:BigDecimal = toDecimal(
        sharesRaw,
        shareToken.decimals
    );

    // Calculate shares amount based on price per full share
    let sharesAmount = (farmer.totalSupplyRaw !== BIGINT_ZERO)
        ? shares.times(pricePerFullShareUSD)
        : shares;
    let sharesAmountRaw = sharesRaw.times(ppfsRaw).div(getPrecision(18));


    // Save Transaction Entity
    let transaction = getOrCreateTransaction(
        event.transaction.hash.toHexString()
    );
    transaction.blockNumber = event.block.number;
    transaction.timestamp = event.block.timestamp;
    transaction.transactionHash = event.transaction.hash;
    transaction.save();

    farmer.transaction = transaction.id;
    farmer.save();

    // Create Receipient and Sender Account Balance Entity
    let toAccountBalance = getOrCreateAccountVaultBalance(
        toAccount.id.concat("-").concat(farmer.id)
    );
    let fromAccountBalance = getOrCreateAccountVaultBalance(
        fromAccount.id.concat("-").concat(farmer.id)
    )

    // To ensure Transfer event is not for Shares Minted and Shares Burned
    if(
        event.params.to.toHexString() != ZERO_ADDRESS &&
        event.params.from.toHexString() != ZERO_ADDRESS
    ) {
        handleCitadelV2TransferTemplate(
            event, 
            sharesAmountRaw,
            sharesAmount,
            pricePerFullShareUSD,
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

        toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(sharesAmountRaw);
        toAccountBalance.netDeposits = toDecimal(
            toAccountBalance.netDepositsRaw, 
            shareToken.decimals
        );
        
        toAccountBalance.totalReceivedRaw = toAccountBalance.totalReceivedRaw.plus(sharesAmountRaw);
        toAccountBalance.netDeposits = toDecimal(
            toAccountBalance.netDepositsRaw,
            shareToken.decimals
        );

        toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(sharesRaw);
        toAccountBalance.shareBalance = toDecimal(
            toAccountBalance.shareBalanceRaw,
            shareToken.decimals
        );

        toAccountBalance.totalSharesReceivedRaw = toAccountBalance.totalSharesReceivedRaw.plus(sharesRaw);
        toAccountBalance.totalSharesReceived = toDecimal(
            toAccountBalance.totalSharesReceivedRaw,
            shareToken.decimals
        ); 

        // Update sender account total and balances
        fromAccountBalance.account = fromAccount.id;
        fromAccountBalance.farmer = farmer.id;
        fromAccountBalance.shareToken = farmer.id;
        fromAccountBalance.underlyingToken = farmer.underlyingToken;

        fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(sharesAmountRaw);
        fromAccountBalance.netDeposits = toDecimal( 
            fromAccountBalance.netDepositsRaw,
            shareToken.decimals
        );

        fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw.plus(sharesAmountRaw);
        fromAccountBalance.totalSent = toDecimal(
            fromAccountBalance.totalSentRaw,
            shareToken.decimals
        );

      
        fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(sharesRaw);
        fromAccountBalance.shareBalance = toDecimal(
             fromAccountBalance.shareBalanceRaw,
             shareToken.decimals
         );
 
        fromAccountBalance.totalSharesSentRaw = fromAccountBalance.totalSharesSentRaw.plus(sharesRaw);
        fromAccountBalance.totalSharesSent = toDecimal(
            fromAccountBalance.totalSharesSentRaw,
            shareToken.decimals
        );    

        toAccount.save();
        fromAccount.save();
        toAccountBalance.save();
        fromAccountBalance.save();
    }
}
