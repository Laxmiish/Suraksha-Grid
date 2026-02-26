CREATE TABLE IF NOT EXISTS users (
    reference_id VARCHAR(255) PRIMARY KEY,
    phone VARCHAR(20) ,
    email VARCHAR(255),
    name VARCHAR(255),
    dob DATE,
    gender VARCHAR(10),
    address VARCHAR(1000),
    usertype VARCHAR(100),
    rating int,
    supervisoryacc BOOL,
    managerid VARCHAR(255)   
)

CREATE TABLE IF NOT stateandbenifit(
    sno AUTO INCREMENT PRIMARY KEY ,
    state VARCHAR(200),
    benifitname VARCHAR(500),
    benifittype VARCHAR(100),
    minimumyear INT,
    workdays INT,
    conditions VARCHAR(MAX)
)