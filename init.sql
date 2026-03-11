CREATE DATABASE IF NOT EXISTS restaurant_db;
USE restaurant_db;


CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'en preparación',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS inventory (
    ingredient_name VARCHAR(50) PRIMARY KEY,
    quantity INT DEFAULT 5
);


INSERT IGNORE INTO inventory (ingredient_name, quantity) VALUES 
('tomato', 5), ('lemon', 5), ('potato', 5), ('rice', 5), ('ketchup', 5), 
('lettuce', 5), ('onion', 5), ('cheese', 5), ('meat', 5), ('chicken', 5);


CREATE TABLE IF NOT EXISTS purchase_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ingredient_name VARCHAR(50),
    quantity_bought INT,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);