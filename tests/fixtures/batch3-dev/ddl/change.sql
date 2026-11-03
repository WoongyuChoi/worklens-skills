UPDATE invoice SET amount = ROUND(amount, 0);
ALTER TABLE invoice RENAME COLUMN counterparty_code TO partner_code;
ALTER TABLE invoice MODIFY partner_code VARCHAR2(12 BYTE) NOT NULL;
