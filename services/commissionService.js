const User = require('../models/User');
const Commission = require('../models/Commission');
const Transaction = require('../models/Transaction');
const { sendCommissionCreditedEmail } = require('./emailService');

const COMMISSION_PERCENTAGES = {
  1: 10,
  2: 7,
  3: 5,
  4: 2, // level 4 and above use 2%
};

const REGISTRATION_AMOUNT = 1000; // Joining amount - adjust as needed

/**
 * Get percentage for level (4+ = 2%)
 */
function getPercentage(level) {
  return COMMISSION_PERCENTAGES[level] ?? COMMISSION_PERCENTAGES[4];
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

module.exports = {
  processRegistrationCommission,
  getPercentage,
  REGISTRATION_AMOUNT,
};
