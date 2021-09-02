import { DistDVD } from "../../generated/DVDDistBot/DVDDistributionBot";
import { BuyDVD } from "../../generated/DVDUniBot/DVDUniBot";
import { BuyBack, Cumulative } from "../../generated/schema";
import { BIGINT_ZERO } from "../utils/constants";
import { toDecimal } from "../utils/decimals";

function getOrCreateBuyBack(
    id: string,
    createIfNotFound: boolean = true
): BuyBack {
    let buyBack = BuyBack.load(id);

    if(buyBack == null && createIfNotFound) {
        buyBack = new BuyBack(id);
    }

    return buyBack as BuyBack;
}

function getOrCreateCumulativeBuyBack(
    id: string,
    createIfNotFound: boolean = true
) : Cumulative {
    let cumulativeBuyBack = Cumulative.load(id);

    if(cumulativeBuyBack == null && createIfNotFound) {
        cumulativeBuyBack = new Cumulative(id);
        cumulativeBuyBack.totalAmountRaw = BIGINT_ZERO;
    }

    return cumulativeBuyBack as Cumulative;
}

// DVD Distribution Bot
export function handleDvdDistributionBuyBack(event: DistDVD): void {
    let transactionId = event.transaction.hash.toHexString();

    let buyBack = getOrCreateBuyBack(transactionId);
    buyBack.from = event.params.user.toHexString();
    buyBack.to = event.transaction.to.toHexString();
    buyBack.transactionHash = event.transaction.hash;
    buyBack.blockNumber = event.block.number;
    buyBack.amountRaw = event.params.dvdAmount;
    buyBack.amount = toDecimal(event.params.dvdAmount, 18);
    buyBack.timestamp = event.block.timestamp;
    buyBack.save();

    let cumulativeBuyBack = getOrCreateCumulativeBuyBack(event.transaction.to.toHexString());

    let cumulativeBuyBackAmount = cumulativeBuyBack.totalAmountRaw;
    cumulativeBuyBackAmount = cumulativeBuyBackAmount.plus(buyBack.amountRaw);
    cumulativeBuyBack.totalAmountRaw = cumulativeBuyBackAmount;
    cumulativeBuyBack.totalAmount = toDecimal(cumulativeBuyBackAmount, 18);

    cumulativeBuyBack.lastUpdate = event.block.timestamp;
    cumulativeBuyBack.save();
}

export function handleDvdUniBotBuyBack(event: BuyDVD): void {
    let transactionId = event.transaction.hash.toHexString();

    let buyBack = getOrCreateBuyBack(transactionId);
    buyBack.from = event.params.user.toHexString();
    buyBack.to = event.transaction.to.toHexString();
    buyBack.transactionHash = event.transaction.hash;
    buyBack.blockNumber = event.block.number;
    buyBack.amountRaw = event.params.dvdAmount;
    buyBack.amount = toDecimal(buyBack.amountRaw, 18);
    buyBack.timestamp = event.block.timestamp;
    buyBack.save();

    let cumulativeBuyBack = getOrCreateCumulativeBuyBack(event.transaction.to.toHexString());
    let cumulativeBuyBackAmountRaw = cumulativeBuyBack.totalAmountRaw.plus(buyBack.amountRaw);
    cumulativeBuyBack.totalAmountRaw = cumulativeBuyBackAmountRaw;
    cumulativeBuyBack.totalAmount = toDecimal(cumulativeBuyBackAmountRaw, 18);

    cumulativeBuyBack.lastUpdate = event.block.timestamp;
    cumulativeBuyBack.save();
}

