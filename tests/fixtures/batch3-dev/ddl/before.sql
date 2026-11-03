CREATE TABLE invoice (
  invoice_id VARCHAR2(20 BYTE) PRIMARY KEY,
  counterparty_code VARCHAR2(30 CHAR),
  amount NUMBER(12,2)
);
