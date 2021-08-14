import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  Deposit,
  Farmer,
  Transaction,
  Transfer,
  Withdrawal,
} from "../../../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../../constants";
import { toDecimal } from "../../decimals";
import { getOrCreateToken, getOrCreateTokenPolygon } from "./token";
import {
  getOrCreateEarnFarmerToken,
  getOrCreateVaultFarmerToken,
} from "./farmerToken";

// Vaults
import { YearnFighter } from "../../../../generated/YearnFighterUSDT/YearnFighter";
import { CompoundFighter } from "../../../../generated/CompoundFighterUSDT/CompoundFighter";
import { HarvestFighter } from "../../../../generated/HarvestFighterUSDT/HarvestFighter";
import { Citadel } from "../../../../generated/DAOVaultCitadel/Citadel";
import { ElonApe } from "../../../../generated/DAOVaultElon/ElonApe";
import { CubanApe } from "../../../../generated/DAOVaultCuban/CubanApe";
import { FaangStonk } from "../../../../generated/DAOVaultFaangStonk/FaangStonk";
import { DAOEarn } from "../../../../generated/DAOVaultEarnLUSD/DAOEarn";
import { MoneyPrinterContract as MoneyPrinter } from "../../../../generated/MoneyPrinter/MoneyPrinterContract"

// Strategies
import { YearnFarmerv2 } from "../../../../generated/YearnFighterUSDT/YearnFarmerv2";
import { CompoundFarmer } from "../../../../generated/CompoundFighterUSDT/CompoundFarmer";
import { HarvestFarmer } from "../../../../generated/HarvestFighterUSDT/HarvestFarmer";
import { EACAggregatorProxy } from "../../../../generated/DAOVaultCitadel/EACAggregatorProxy";
import { Farmer } from "../../../../generated/schema";

export function getOrCreateFarmer(
  vaultAddress: Address,
  update: boolean = true
): Farmer {
  let vault = Farmer.load(vaultAddress.toHexString());
  let vaultContract = YearnFighter.bind(vaultAddress);

  if (vault == null) {
    vault = new Farmer(vaultAddress.toHexString());

    // Initialize parsed values as BigDecimal 0
    vault.earnPricePerFullShare = BIGDECIMAL_ZERO;
    vault.vaultPricePerFullShare = BIGDECIMAL_ZERO;
    vault.netDeposits = BIGDECIMAL_ZERO;
    vault.totalDeposited = BIGDECIMAL_ZERO;
    vault.totalWithdrawn = BIGDECIMAL_ZERO;
    vault.totalActiveShares = BIGDECIMAL_ZERO;
    vault.totalSharesMinted = BIGDECIMAL_ZERO;
    vault.totalSharesBurned = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;
    vault.totalSupply = BIGDECIMAL_ZERO;
    vault.totalEarnings = BIGDECIMAL_ZERO;
    vault.pool = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.totalEarningsRaw = BIGINT_ZERO;
    vault.earnPricePerFullShareRaw = BIGINT_ZERO;
    vault.vaultPricePerFullShareRaw = BIGINT_ZERO;
    vault.poolRaw = BIGINT_ZERO;
  }

  if (update) {
    let strategyAddress = vaultContract.try_strategy();
    if (!strategyAddress.reverted) {
      let strategyContract = YearnFarmerv2.bind(vaultContract.strategy());

      // Might be worth using the "try_" version of these calls in the future.
      let underlyingTokenAddress = vaultContract.token();
      let underlyingToken = getOrCreateToken(underlyingTokenAddress);

      // Earn Token
      let earnTokenAddress = strategyContract.earn();
      let earnToken = getOrCreateEarnFarmerToken(earnTokenAddress);

      // Vault Token
      let vaultTokenAddress = strategyContract.vault();
      let vaultToken = getOrCreateVaultFarmerToken(vaultTokenAddress);

      // The vault itself is an ERC20
      let shareToken = getOrCreateToken(vaultAddress);

      let totalSupply = vaultContract.try_totalSupply();

      vault.earnBalanceRaw = earnToken.balanceRaw;
      vault.vaultBalanceRaw = vaultToken.balanceRaw;
      vault.earnPricePerFullShareRaw = earnToken.getPricePerFullShare;
      vault.vaultPricePerFullShareRaw = vaultToken.getPricePerFullShare;
      vault.poolRaw = strategyContract.pool();
      // vault.pricePerFullShareRaw = (earnToken.getPricePerFullShare.plus(vaultToken.getPricePerFullShare)).div(BigInt.fromI32(2));
      vault.totalSupplyRaw = !totalSupply.reverted
        ? totalSupply.value
        : vault.totalSupplyRaw;
      vault.underlyingToken = underlyingToken.id;
      vault.shareToken = shareToken.id;

      vault.earnBalance = toDecimal(vault.earnBalanceRaw, earnToken.decimals);
      vault.vaultBalance = toDecimal(
        vault.vaultBalanceRaw,
        vaultToken.decimals
      );
      vault.totalSupply = toDecimal(
        vault.totalSupplyRaw,
        vaultContract.decimals()
      );
      vault.pool = toDecimal(vault.poolRaw, strategyContract.decimals());
      // Uses the default decimals since it's a floating point representation
      vault.earnPricePerFullShare = toDecimal(
        vault.earnPricePerFullShareRaw,
        earnToken.decimals
      );
      vault.vaultPricePerFullShare = toDecimal(
        vault.vaultPricePerFullShareRaw,
        vaultToken.decimals
      );
    }
  }

  return vault as Farmer;
}

export function getOrCreateCompoundFarmer(
  vaultAddress: Address,
  update: boolean = true
): Farmer {
  let vault = Farmer.load(vaultAddress.toHexString());
  let vaultContract = CompoundFighter.bind(vaultAddress);

  if (vault == null) {
    vault = new Farmer(vaultAddress.toHexString());

    // Initialize parsed values as BigDecimal 0
    vault.earnPricePerFullShare = BIGDECIMAL_ZERO;
    vault.vaultPricePerFullShare = BIGDECIMAL_ZERO;
    vault.netDeposits = BIGDECIMAL_ZERO;
    vault.totalDeposited = BIGDECIMAL_ZERO;
    vault.totalWithdrawn = BIGDECIMAL_ZERO;
    vault.totalActiveShares = BIGDECIMAL_ZERO;
    vault.totalSharesMinted = BIGDECIMAL_ZERO;
    vault.totalSharesBurned = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;
    vault.totalSupply = BIGDECIMAL_ZERO;
    vault.totalEarnings = BIGDECIMAL_ZERO;
    vault.pool = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.totalEarningsRaw = BIGINT_ZERO;
    vault.earnPricePerFullShareRaw = BIGINT_ZERO;
    vault.vaultPricePerFullShareRaw = BIGINT_ZERO;
    vault.poolRaw = BIGINT_ZERO;
    vault.earnBalanceRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
  }

  if (update) {
    let strategyAddress = vaultContract.try_strategy();
    if (!strategyAddress.reverted) {
      let strategyContract = CompoundFarmer.bind(vaultContract.strategy());

      // Might be worth using the "try_" version of these calls in the future.
      let underlyingTokenAddress = vaultContract.token();
      let underlyingToken = getOrCreateToken(underlyingTokenAddress);

      // The vault itself is an ERC20
      let shareToken = getOrCreateToken(vaultAddress);

      let totalSupply = vaultContract.try_totalSupply();
      vault.poolRaw = strategyContract.pool();
      vault.totalSupplyRaw = !totalSupply.reverted
        ? totalSupply.value
        : vault.totalSupplyRaw;
      vault.underlyingToken = underlyingToken.id;
      vault.shareToken = shareToken.id;

      vault.totalSupply = toDecimal(
        vault.totalSupplyRaw,
        vaultContract.decimals()
      );
      vault.pool = toDecimal(vault.poolRaw, strategyContract.decimals());
    }
  }

  return vault as Farmer;
}

export function getOrCreateHarvestFarmer(
  vaultAddress: Address,
  update: boolean = true
): Farmer {
  let vault = Farmer.load(vaultAddress.toHexString());
  let vaultContract = HarvestFighter.bind(vaultAddress);

  if (vault == null) {
    vault = new Farmer(vaultAddress.toHexString());

    // Initialize parsed values as BigDecimal 0
    vault.earnPricePerFullShare = BIGDECIMAL_ZERO;
    vault.vaultPricePerFullShare = BIGDECIMAL_ZERO;
    vault.netDeposits = BIGDECIMAL_ZERO;
    vault.totalDeposited = BIGDECIMAL_ZERO;
    vault.totalWithdrawn = BIGDECIMAL_ZERO;
    vault.totalActiveShares = BIGDECIMAL_ZERO;
    vault.totalSharesMinted = BIGDECIMAL_ZERO;
    vault.totalSharesBurned = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;
    vault.totalSupply = BIGDECIMAL_ZERO;
    vault.totalEarnings = BIGDECIMAL_ZERO;
    vault.pool = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.totalEarningsRaw = BIGINT_ZERO;
    vault.earnPricePerFullShareRaw = BIGINT_ZERO;
    vault.vaultPricePerFullShareRaw = BIGINT_ZERO;
    vault.poolRaw = BIGINT_ZERO;
    vault.earnBalanceRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
  }

  if (update) {
    let strategyAddress = vaultContract.try_strategy();
    if (!strategyAddress.reverted) {
      let strategyContract = HarvestFarmer.bind(vaultContract.strategy());

      // Might be worth using the "try_" version of these calls in the future.
      let underlyingTokenAddress = vaultContract.token();
      let underlyingToken = getOrCreateToken(underlyingTokenAddress);

      // The vault itself is an ERC20
      let shareToken = getOrCreateToken(vaultAddress);

      let totalSupply = vaultContract.try_totalSupply();
      vault.poolRaw = strategyContract.pool();
      vault.totalSupplyRaw = !totalSupply.reverted
        ? totalSupply.value
        : vault.totalSupplyRaw;
      vault.underlyingToken = underlyingToken.id;
      vault.shareToken = shareToken.id;

      vault.totalSupply = toDecimal(
        vault.totalSupplyRaw,
        vaultContract.decimals()
      );
      vault.pool = toDecimal(vault.poolRaw, vaultContract.decimals());
    }
  }

  return vault as Farmer;
}

export function getOrCreateCitadelFarmer(
  vaultAddress: Address,
  update: boolean = true
): Farmer {
  let vault = Farmer.load(vaultAddress.toHexString());
  let vaultContract = Citadel.bind(vaultAddress);

  if (vault == null) {
    vault = new Farmer(vaultAddress.toHexString());

    // Initialize parsed values as BigDecimal 0
    vault.earnPricePerFullShare = BIGDECIMAL_ZERO;
    vault.vaultPricePerFullShare = BIGDECIMAL_ZERO;
    vault.netDeposits = BIGDECIMAL_ZERO;
    vault.totalDeposited = BIGDECIMAL_ZERO;
    vault.totalWithdrawn = BIGDECIMAL_ZERO;
    vault.totalActiveShares = BIGDECIMAL_ZERO;
    vault.totalSharesMinted = BIGDECIMAL_ZERO;
    vault.totalSharesBurned = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;
    vault.totalSupply = BIGDECIMAL_ZERO;
    vault.totalEarnings = BIGDECIMAL_ZERO;
    vault.pool = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.totalEarningsRaw = BIGINT_ZERO;
    vault.earnPricePerFullShareRaw = BIGINT_ZERO;
    vault.vaultPricePerFullShareRaw = BIGINT_ZERO;
    vault.poolRaw = BIGINT_ZERO;
    vault.earnBalanceRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
  }

  if (update) {
    let strategyAddress = vaultContract.try_strategy();
    if (!strategyAddress.reverted) {
      // Might be worth using the "try_" version of these calls in the future.
      // let underlyingTokenAddress = vaultContract.token();
      // let underlyingToken = getOrCreateToken(underlyingTokenAddress);

      // Get ETH Price from External Contract
      let proxyContract = EACAggregatorProxy.bind(Address.fromString("0x0bF499444525a23E7Bb61997539725cA2e928138"));
      let ethPrice = proxyContract.latestAnswer();

      // The vault itself is an ERC20
      let shareToken = getOrCreateToken(vaultAddress);

      let totalSupply = vaultContract.try_totalSupply();
      vault.poolRaw = vaultContract.getAllPoolInETH(ethPrice);
      vault.totalSupplyRaw = !totalSupply.reverted
        ? totalSupply.value
        : vault.totalSupplyRaw;
      // vault.underlyingToken = underlyingToken.id;
      vault.shareToken = shareToken.id;

      vault.totalSupply = toDecimal(
        vault.totalSupplyRaw,
        vaultContract.decimals()
      );
      vault.pool = toDecimal(vault.poolRaw, vaultContract.decimals());
    }
  }

  return vault as Farmer;
}

export function getOrCreateElonFarmer(
  vaultAddress: Address,
  update: boolean = true
): Farmer {
  let vault = Farmer.load(vaultAddress.toHexString());
  let vaultContract = ElonApe.bind(vaultAddress);

  if (vault == null) {
    vault = new Farmer(vaultAddress.toHexString());

    // Initialize parsed values as BigDecimal 0
    vault.earnPricePerFullShare = BIGDECIMAL_ZERO;
    vault.vaultPricePerFullShare = BIGDECIMAL_ZERO;
    vault.netDeposits = BIGDECIMAL_ZERO;
    vault.totalDeposited = BIGDECIMAL_ZERO;
    vault.totalWithdrawn = BIGDECIMAL_ZERO;
    vault.totalActiveShares = BIGDECIMAL_ZERO;
    vault.totalSharesMinted = BIGDECIMAL_ZERO;
    vault.totalSharesBurned = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;
    vault.totalSupply = BIGDECIMAL_ZERO;
    vault.totalEarnings = BIGDECIMAL_ZERO;
    vault.pool = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.totalEarningsRaw = BIGINT_ZERO;
    vault.earnPricePerFullShareRaw = BIGINT_ZERO;
    vault.vaultPricePerFullShareRaw = BIGINT_ZERO;
    vault.poolRaw = BIGINT_ZERO;
    vault.earnBalanceRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
  }

  if (update) {
    let strategyAddress = vaultContract.try_strategy();
    if (!strategyAddress.reverted) {
      // The vault itself is an ERC20
      let shareToken = getOrCreateToken(vaultAddress);
      vault.shareToken = shareToken.id;

      let poolInUsd = vaultContract.getAllPoolInUSD(); // All pool in USD (6 decimals)
      vault.poolRaw = poolInUsd.times(BigInt.fromI32(10).pow(12));

      let totalSupply = vaultContract.try_totalSupply();
      vault.totalSupplyRaw = !totalSupply.reverted
        ? totalSupply.value
        : vault.totalSupplyRaw;
      vault.totalSupply = toDecimal(
        vault.totalSupplyRaw,
        vaultContract.decimals()
      );
      vault.pool = toDecimal(vault.poolRaw, vaultContract.decimals());
    }
  }
  return vault as Farmer;
}

export function getOrCreateCubanFarmer(
  vaultAddress: Address,
  update: boolean = true
): Farmer {
  let vault = Farmer.load(vaultAddress.toHexString());
  let vaultContract = CubanApe.bind(vaultAddress);

  if (vault == null) {
    vault = new Farmer(vaultAddress.toHexString());

    // Initialize parsed values as BigDecimal 0
    vault.earnPricePerFullShare = BIGDECIMAL_ZERO;
    vault.vaultPricePerFullShare = BIGDECIMAL_ZERO;
    vault.netDeposits = BIGDECIMAL_ZERO;
    vault.totalDeposited = BIGDECIMAL_ZERO;
    vault.totalWithdrawn = BIGDECIMAL_ZERO;
    vault.totalActiveShares = BIGDECIMAL_ZERO;
    vault.totalSharesMinted = BIGDECIMAL_ZERO;
    vault.totalSharesBurned = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;
    vault.totalSupply = BIGDECIMAL_ZERO;
    vault.totalEarnings = BIGDECIMAL_ZERO;
    vault.pool = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.totalEarningsRaw = BIGINT_ZERO;
    vault.earnPricePerFullShareRaw = BIGINT_ZERO;
    vault.vaultPricePerFullShareRaw = BIGINT_ZERO;
    vault.poolRaw = BIGINT_ZERO;
    vault.earnBalanceRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
  }

  if (update) {
    let strategyAddress = vaultContract.try_strategy();
    if (!strategyAddress.reverted) {
      // The vault itself is an ERC20
      let shareToken = getOrCreateToken(vaultAddress);
      vault.shareToken = shareToken.id;

      let poolInUsd = vaultContract.getAllPoolInUSD(); // All pool in USD (6 decimals)
      vault.poolRaw = poolInUsd.times(BigInt.fromI32(10).pow(12));

      let totalSupply = vaultContract.try_totalSupply();
      vault.totalSupplyRaw = !totalSupply.reverted
        ? totalSupply.value
        : vault.totalSupplyRaw;
      vault.totalSupply = toDecimal(
        vault.totalSupplyRaw,
        vaultContract.decimals()
      );
      vault.pool = toDecimal(vault.poolRaw, vaultContract.decimals());
    }
  }
  return vault as Farmer;
}

export function getOrCreateFaangFarmer(
  vaultAddress: Address,
  update: boolean = true
): Farmer {
  let vault = Farmer.load(vaultAddress.toHexString());
  let vaultContract = FaangStonk.bind(vaultAddress);

  if (vault == null) {
    vault = new Farmer(vaultAddress.toHexString());

    // Initialize parsed values as BigDecimal 0
    vault.earnPricePerFullShare = BIGDECIMAL_ZERO;
    vault.vaultPricePerFullShare = BIGDECIMAL_ZERO;
    vault.netDeposits = BIGDECIMAL_ZERO;
    vault.totalDeposited = BIGDECIMAL_ZERO;
    vault.totalWithdrawn = BIGDECIMAL_ZERO;
    vault.totalActiveShares = BIGDECIMAL_ZERO;
    vault.totalSharesMinted = BIGDECIMAL_ZERO;
    vault.totalSharesBurned = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;
    vault.totalSupply = BIGDECIMAL_ZERO;
    vault.totalEarnings = BIGDECIMAL_ZERO;
    vault.pool = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.totalEarningsRaw = BIGINT_ZERO;
    vault.earnPricePerFullShareRaw = BIGINT_ZERO;
    vault.vaultPricePerFullShareRaw = BIGINT_ZERO;
    vault.poolRaw = BIGINT_ZERO;
    vault.earnBalanceRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
  }

  if(update) {
    let strategyAddress = vaultContract.try_strategy();
    if (!strategyAddress.reverted) {
      // The vault itself is an ERC20
      let shareToken = getOrCreateToken(vaultAddress);

      let totalSupply = vaultContract.try_totalSupply();
      vault.poolRaw = vaultContract.getTotalValueInPool();
      vault.totalSupplyRaw = !totalSupply.reverted
        ? totalSupply.value
        : vault.totalSupplyRaw;
      // vault.underlyingToken = underlyingToken.id;
      vault.shareToken = shareToken.id;

      vault.totalSupply = toDecimal(
        vault.totalSupplyRaw,
        vaultContract.decimals()
      );
      vault.pool = toDecimal(vault.poolRaw, vaultContract.decimals());
    }
  }
  return vault as Farmer;
}

export function getOrCreateMoneyPrinterFarmer(
  vaultAddress : Address,
  update: boolean = false
): Farmer {
  let vault = Farmer.load(vaultAddress.toHexString());
  let vaultContract = MoneyPrinter.bind(vaultAddress);

  if(vault == null) {
    vault = new Farmer(vaultAddress.toHexString());

    // Initialize parsed values as BigDecimal 0
    vault.earnPricePerFullShare = BIGDECIMAL_ZERO;
    vault.vaultPricePerFullShare = BIGDECIMAL_ZERO;
    vault.netDeposits = BIGDECIMAL_ZERO;
    vault.totalDeposited = BIGDECIMAL_ZERO;
    vault.totalWithdrawn = BIGDECIMAL_ZERO;
    vault.totalActiveShares = BIGDECIMAL_ZERO;
    vault.totalSharesMinted = BIGDECIMAL_ZERO;
    vault.totalSharesBurned = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;
    vault.totalSupply = BIGDECIMAL_ZERO;
    vault.totalEarnings = BIGDECIMAL_ZERO;
    vault.pool = BIGDECIMAL_ZERO;
    vault.earnBalance = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.totalEarningsRaw = BIGINT_ZERO;
    vault.earnPricePerFullShareRaw = BIGINT_ZERO;
    vault.vaultPricePerFullShareRaw = BIGINT_ZERO;
    vault.poolRaw = BIGINT_ZERO;
    vault.earnBalanceRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
  }

  let shareToken = getOrCreateToken(vaultAddress);
  vault.shareToken = shareToken.id;

  if(update) {
    let strategyAddress = vaultContract.try_strategy();
    if(!strategyAddress.reverted) {
        // The vault itself is an ERC20
        // let shareToken = getOrCreateToken(vaultAddress);

        let totalSupply = vaultContract.try_totalSupply();
        vault.poolRaw = vaultContract.getValueInPool();
        vault.totalSupplyRaw = !totalSupply.reverted
          ? totalSupply.value
          : vault.totalSupplyRaw;
        // vault.underlyingToken = underlyingToken.id;
       
        vault.totalSupply = toDecimal(
          vault.totalSupplyRaw,
          vaultContract.decimals()
        );
        vault.pool = toDecimal(vault.poolRaw, vaultContract.decimals());
    }
  }
  return vault as Farmer;
}

export function getOrCreateDAOEarnFarmer(
  vaultAddress: Address,
  update: boolean = false
): Farmer {
  let vault = Farmer.load(vaultAddress.toHexString());
  let vaultContract = DAOEarn.bind(vaultAddress);

  if(vault == null) {
    vault = new Farmer(vaultAddress.toHexString());
     // Initialize parsed values as BigDecimal 0
     vault.earnPricePerFullShare = BIGDECIMAL_ZERO;
     vault.vaultPricePerFullShare = BIGDECIMAL_ZERO;
     vault.netDeposits = BIGDECIMAL_ZERO;
     vault.totalDeposited = BIGDECIMAL_ZERO;
     vault.totalWithdrawn = BIGDECIMAL_ZERO;
     vault.totalActiveShares = BIGDECIMAL_ZERO;
     vault.totalSharesMinted = BIGDECIMAL_ZERO;
     vault.totalSharesBurned = BIGDECIMAL_ZERO;
     vault.earnBalance = BIGDECIMAL_ZERO;
     vault.vaultBalance = BIGDECIMAL_ZERO;
     vault.totalSupply = BIGDECIMAL_ZERO;
     vault.totalEarnings = BIGDECIMAL_ZERO;
     vault.pool = BIGDECIMAL_ZERO;
     vault.earnBalance = BIGDECIMAL_ZERO;
     vault.vaultBalance = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.totalEarningsRaw = BIGINT_ZERO;
    vault.earnPricePerFullShareRaw = BIGINT_ZERO;
    vault.vaultPricePerFullShareRaw = BIGINT_ZERO;
    vault.poolRaw = BIGINT_ZERO;
    vault.earnBalanceRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
  }

  let shareToken = getOrCreateToken(vaultAddress);
  vault.shareToken = shareToken.id;

  if(update) {
    let strategyAddress = vaultContract.try_strategy();
    if (!strategyAddress.reverted) {
      // The vault itself is an ERC20
      let totalSupply = vaultContract.try_totalSupply();
      vault.totalSupply = toDecimal(
        vault.totalSupplyRaw,
        vaultContract.decimals()
      );

      vault.poolRaw = vaultContract.getAllPoolInUSD();
      vault.totalSupplyRaw = !totalSupply.reverted
        ? totalSupply.value
        : vault.totalSupplyRaw;
      vault.pool = toDecimal(vault.poolRaw, vaultContract.decimals());
    }
  }
  return vault as Farmer;
}

export function getOrCreateTransaction(
  id: string,
  createIfNotFound: boolean = true
): Transaction {
  let transaction = Transaction.load(id);

  if (transaction == null && createIfNotFound) {
    transaction = new Transaction(id);
  }

  return transaction as Transaction;
}

export function getOrCreateVaultDeposit(
  id: string,
  createIfNotFound: boolean = true
): Deposit {
  let action = Deposit.load(id);

  if (action == null && createIfNotFound) {
    action = new Deposit(id);
  }

  return action as Deposit;
}

export function getOrCreateVaultTransfer(
  id: string,
  createIfNotFound: boolean = true
): Transfer {
  let action = Transfer.load(id);

  if (action == null && createIfNotFound) {
    action = new Transfer(id);
  }

  return action as Transfer;
}

export function getOrCreateVaultWithdrawal(
  id: string,
  createIfNotFound: boolean = true
): Withdrawal {
  let action = Withdrawal.load(id);

  if (action == null && createIfNotFound) {
    action = new Withdrawal(id);
  }

  return action as Withdrawal;
}
