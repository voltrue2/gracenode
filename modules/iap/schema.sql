DROP TABLE IF EXISTS iap;

CREATE TABLE iap (
    receiptHashId VARCHAR(64) NOT NULL,
    receipt TEXT NOT NULL,
    response TEXT NOT NULL,
    service ENUM('apple', 'google') NOT NULL,
    validateState ENUM('validated', 'canceled', 'error') NOT NULL,
    status ENUM('handled', 'pending', 'canceled') NOT NULL,
    created BIGINT(13) UNSIGNED NOT NULL,
    modtime BIGINT(13) UNSIGNED NOT NULL,
    PRIMARY KEY(receiptHashId)
)ENGINE=INNODB DEFAULT CHARSET=utf8;
