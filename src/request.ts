import { inspectPayment, type InspectionResult, type PaymentRequirement, type X402Payment } from './inspect.js';
import { decodeXPaymentHeader } from './xpayment.js';

export type InspectRequestInput = {
  requirement: PaymentRequirement;
  payment?: X402Payment;
  xPayment?: string;
};

export function inspectRequest(input: InspectRequestInput): InspectionResult {
  const payment = input.payment ?? (input.xPayment ? decodeXPaymentHeader(input.xPayment) : undefined);
  if (!payment) {
    return {
      status: 'invalid',
      diagnostics: [{
        code: 'MISSING_PAYMENT',
        message: 'No payment object or X-PAYMENT header was provided.',
        fix: 'Send either payment or xPayment.'
      }],
      receipt: {
        seller: input.requirement.payTo,
        endpoint: input.requirement.resource ?? input.requirement.endpoint,
        network: input.requirement.network,
        token: input.requirement.asset,
        amount: '0'
      }
    };
  }

  return inspectPayment({ requirement: input.requirement, payment });
}
