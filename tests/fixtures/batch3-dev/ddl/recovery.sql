ROLLBACK;
ALTER TABLE invoice RENAME COLUMN partner_code TO counterparty_code;
