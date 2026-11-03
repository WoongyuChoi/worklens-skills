CREATE TABLE payment (
  payment_id VARCHAR2(20 BYTE) PRIMARY KEY,
  client_code VARCHAR2(30 BYTE),
  status_code VARCHAR2(4 BYTE)
);
CREATE INDEX ix_payment_client ON payment(client_code);
CREATE TABLE payment_status (
  status_code VARCHAR2(4 BYTE) PRIMARY KEY,
  label VARCHAR2(40 CHAR),
  active CHAR(1)
);
