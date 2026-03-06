const User = require('../models/User');
const Commission = require('../models/Commission');
const Transaction = require('../models/Transaction');
const { sendCommissionCreditedEmail } = require('./emailService');

const COMMISSION_PERCENTAGES = {
  1: 10,
  2: 7,
  3: 5,
  4: 2,
};

const REGISTRATION_AMOUNT = 100;

/** Deposit commission: L1 7%, L2 3%, L3 2%, L4 2%, L5 1%. L2+ only if ancestor's L1 total deposit > threshold */
const DEPOSIT_COMMISSION_PERCENTAGES = { 1: 7, 2: 3, 3: 2, 4: 2, 5: 1 };
const L1_TOTAL_DEPOSIT_THRESHOLD = 20000;

function getPercentage(level) {
  return COMMISSION_PERCENTAGES[level] ?? COMMISSION_PERCENTAGES[4];
}

function getDepositPercentage(level) {
  return DEPOSIT_COMMISSION_PERCENTAGES[level] ?? 0;
}

/** Sum of totalDeposit of all direct referrals (Level 1) of userId */
async function getL1TotalDeposit(userId) {
  const direct = await User.find({ parentId: userId }).select('totalDeposit').lean();
  return direct.reduce((sum, u) => sum + (u.totalDeposit || 0), 0);
}

/**
 * Process commission for all ancestors when a new user registers
 * Level 1: 10%, Level 2: 7%, Level 3: 5%, Level 4+: 2%
 */
async function processRegistrationCommission(newUser) {
  const amount = REGISTRATION_AMOUNT;
  const ancestors = await User.find({ _id: { $in: newUser.ancestors } })
    .sort({ level: 1 })
    .select('name email memberId walletBalance')
    .lean();

  for (let i = 0; i < ancestors.length; i++) {
    const level = i + 1;
    const percentage = getPercentage(level);
    const commissionAmount = Math.round((amount * percentage) / 100);

    const ancestor = ancestors[i];
    await Commission.create({
      userId: ancestor._id,
      fromUserId: newUser._id,
      fromMemberId: newUser.memberId,
      fromName: newUser.name,
      level,
      amount: commissionAmount,
      percentage,
      status: 'credited',
      referenceType: 'registration',
      referenceId: newUser._id,
    });

    const updated = await User.findByIdAndUpdate(
      ancestor._id,
      {
        $inc: {
          walletBalance: commissionAmount,
          totalIncome: commissionAmount,
          totalBonus: commissionAmount,
        },
      },
      { new: true }
    );

    await Transaction.create({
      userId: ancestor._id,
      type: 'credit',
      amount: commissionAmount,
      balanceAfter: updated.walletBalance,
      description: `Commission from ${newUser.memberId} (Level ${level})`,
      referenceType: 'commission',
      referenceId: newUser._id,
    });

    try {
      await sendCommissionCreditedEmail(
        { email: ancestor.email },
        commissionAmount,
        newUser.memberId,
        level
      );
    } catch (e) {
      console.error('Commission email error:', e.message);
    }
  }
}

/**
 * Process commission when a user makes a deposit.
 * L1: 7%, L2: 3%, L3: 2%, L4: 2%, L5: 1%.
 * L2 and above: ancestor receives commission only if their L1 total deposit > L1_TOTAL_DEPOSIT_THRESHOLD.
 */
async function processDepositCommission(depositingUser, depositAmount) {
  const ancestors = await User.find({ _id: { $in: depositingUser.ancestors } })
    .sort({ level: 1 })
    .limit(5)
    .select('name email memberId walletBalance')
    .lean();

  for (let i = 0; i < ancestors.length; i++) {
    const level = i + 1;
    const percentage = getDepositPercentage(level);
    if (percentage <= 0) continue;

    const ancestor = ancestors[i];
    if (level >= 2) {
      const l1Total = await getL1TotalDeposit(ancestor._id);
      if (l1Total < L1_TOTAL_DEPOSIT_THRESHOLD) continue;
    }

    const commissionAmount = Math.round((depositAmount * percentage) / 100);
    if (commissionAmount <= 0) continue;

    await Commission.create({
      userId: ancestor._id,
      fromUserId: depositingUser._id,
      fromMemberId: depositingUser.memberId,
      fromName: depositingUser.name,
      level,
      amount: commissionAmount,
      percentage,
      status: 'credited',
      referenceType: 'deposit',
      referenceId: depositingUser._id,
    });

    const updated = await User.findByIdAndUpdate(
      ancestor._id,
      {
        $inc: {
          walletBalance: commissionAmount,
          totalIncome: commissionAmount,
          totalBonus: commissionAmount,
        },
      },
      { new: true }
    );

    await Transaction.create({
      userId: ancestor._id,
      type: 'credit',
      amount: commissionAmount,
      balanceAfter: updated.walletBalance,
      description: `Commission from ${depositingUser.memberId} deposit (Level ${level})`,
      referenceType: 'commission',
      referenceId: depositingUser._id,
    });

    try {
      await sendCommissionCreditedEmail(
        { email: ancestor.email },
        commissionAmount,
        depositingUser.memberId,
        level
      );
    } catch (e) {
      console.error('Commission email error:', e.message);
    }
  }
}

module.exports = {
  processRegistrationCommission,
  processDepositCommission,
  getPercentage,
  getDepositPercentage,
  REGISTRATION_AMOUNT,
  L1_TOTAL_DEPOSIT_THRESHOLD,
};
