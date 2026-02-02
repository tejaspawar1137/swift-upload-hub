export interface RFIOption {
  id: string;
  label: string;
  value: string;
}

export const tradeIntelligenceRFIs: RFIOption[] = [
  { id: 'ti-1', label: 'FEMA', value: 'fema' },
  { id: 'ti-2', label: 'DGFT', value: 'dgft' },
  { id: 'ti-3', label: 'RBI Guidelines', value: 'rbi' },
  { id: 'ti-4', label: 'Customs', value: 'customs' },
  { id: 'ti-5', label: 'Trade Finance', value: 'trade-finance' },
];

export const masterExcelRFIs: RFIOption[] = [
  { id: 'me-1', label: 'Customer Master', value: 'customer-master' },
  { id: 'me-2', label: 'Product Master', value: 'product-master' },
  { id: 'me-3', label: 'Country Master', value: 'country-master' },
  { id: 'me-4', label: 'Currency Master', value: 'currency-master' },
];

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
