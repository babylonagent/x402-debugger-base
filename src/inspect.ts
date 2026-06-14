export type PaymentRequirement = {
  scheme?: string;
  network?: string;
  maxAmountRequired?: string;
  amount?: string;
  resource?: string;
  endpoint?: string;
  payTo?: string;
  asset?: string;
};

export type X402Payment = {
  network?: string;
  payload?: {
    authorization?: {
      from?: string;
      to?: string;
      value?: string;
    };
  };
};

export type Diagnostic = {
  code: string;
  message: string;
  expected?: string;
  received?: string;
  fix: string;
};

export type Receipt = {
  buyer?: string;
  seller?: string;
  endpoint?: string;
  network?: string;
  token?: string;
  amount?: string;
};

export type InspectionInput = {
  requirement: PaymentRequirement;
  payment: X402Payment;
};

export type InspectionResult = {
  status: 'valid' | 'invalid';
  diagnostics: Diagnostic[];
  receipt: Receipt;
};

export function inspectPayment(input: InspectionInput): InspectionResult {
  const { requirement, payment } = input;
  const auth = payment.payload?.authorization ?? {};
  const requiredAmount = requirement.maxAmountRequired ?? requirement.amount ?? '0';
  const paidAmount = auth.value ?? '0';
  const diagnostics: Diagnostic[] = [];

  if (requirement.network && payment.network !== requirement.network) {
    diagnostics.push({
      code: 'NETWORK_MISMATCH',
      message: `Payment network ${payment.network ?? 'missing'} does not match requirement ${requirement.network}.`,
      expected: requirement.network,
      received: payment.network,
      fix: `Retry with network=${requirement.network}.`
    });
  }

  if (requirement.payTo && auth.to && auth.to.toLowerCase() !== requirement.payTo.toLowerCase()) {
    diagnostics.push({
      code: 'SELLER_MISMATCH',
      message: `Payment receiver ${auth.to} does not match required seller ${requirement.payTo}.`,
      expected: requirement.payTo,
      received: auth.to,
      fix: `Retry with to=${requirement.payTo}.`
    });
  }

  if (BigInt(paidAmount) < BigInt(requiredAmount)) {
    diagnostics.push({
      code: 'AMOUNT_TOO_LOW',
      message: `Payment value ${paidAmount} is below required amount ${requiredAmount}.`,
      expected: requiredAmount,
      received: paidAmount,
      fix: `Retry with value >= ${requiredAmount}.`
    });
  }

  return {
    status: diagnostics.length === 0 ? 'valid' : 'invalid',
    diagnostics,
    receipt: {
      buyer: auth.from,
      seller: requirement.payTo,
      endpoint: requirement.resource ?? requirement.endpoint,
      network: requirement.network,
      token: requirement.asset,
      amount: paidAmount
    }
  };
}
