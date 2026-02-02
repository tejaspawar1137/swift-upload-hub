export interface RFIOption {
  id: string;
  label: string;
  value: string;
}

export const tbmlRFIs: RFIOption[] = [
  { id: 'tbml-1', label: 'RFI-TBML-001 - Trade Based Money Laundering', value: 'tbml-001' },
  { id: 'tbml-2', label: 'RFI-TBML-002 - Invoice Manipulation', value: 'tbml-002' },
  { id: 'tbml-3', label: 'RFI-TBML-003 - Over/Under Invoicing', value: 'tbml-003' },
  { id: 'tbml-4', label: 'RFI-TBML-004 - Multiple Invoicing', value: 'tbml-004' },
  { id: 'tbml-5', label: 'RFI-TBML-005 - Falsely Described Goods', value: 'tbml-005' },
  { id: 'tbml-6', label: 'RFI-TBML-006 - Phantom Shipments', value: 'tbml-006' },
];

export const controlCheckRFIs: RFIOption[] = [
  { id: 'cc-1', label: 'RFI-CC-001 - KYC Verification', value: 'cc-001' },
  { id: 'cc-2', label: 'RFI-CC-002 - AML Compliance Check', value: 'cc-002' },
  { id: 'cc-3', label: 'RFI-CC-003 - Sanctions Screening', value: 'cc-003' },
  { id: 'cc-4', label: 'RFI-CC-004 - PEP Screening', value: 'cc-004' },
  { id: 'cc-5', label: 'RFI-CC-005 - Transaction Monitoring', value: 'cc-005' },
  { id: 'cc-6', label: 'RFI-CC-006 - Risk Assessment', value: 'cc-006' },
];
