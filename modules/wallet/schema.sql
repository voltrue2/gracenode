DROP TABLE IF EXISTS wallet_balance;

DROP TABLE IF EXISTS wallet_spent;

CREATE TABLE wallet_balance (
    receiptHashId VARCHAR(64) NOT NULL,
    userId VARCHAR(100) NOT NULL,
    name VARCHAR(20) NOT NULL,
	price INT(6) NOT NULL,
	value INT(7) NOT NULL,
	valueType ENUM('paid', 'free') NOT NULL,		
    created BIGINT(13) UNSIGNED NOT NULL,
    PRIMARY KEY(receiptHashId)
)ENGINE=INNODB DEFAULT CHARSET=utf8;

CREATE TABLE wallet_spent (
	userId VARCHAR(100) NOT NULL,
    name VARCHAR(20) NOT NULL,
	value INT(7) NOT NULL,
	spentFor VARCHAR(100) NOT NULL,
	created BIGINT(13) UNSIGNED NOT NULL
)ENGINE=INNODB DEFAULT CHARSET=utf8;
