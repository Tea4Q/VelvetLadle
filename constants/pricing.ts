export const PRICING = {
  premium: {
    monthlyAmount: "$4.99",
    monthlyDisplay: "$4.99 / month",
    yearlyDisplay: "$49.99 / year",
  },
} as const;

export const PRICING_COPY = {
  upgradeTitle: "Choose Your Premium Plan",
  premiumStartingPrice: `Premium starts at ${PRICING.premium.monthlyAmount}.`,
  premiumFeaturePrompt: `Unlock unlimited recipe storage with Velvet Ladle Premium at ${PRICING.premium.monthlyAmount}/month.`,
} as const;
