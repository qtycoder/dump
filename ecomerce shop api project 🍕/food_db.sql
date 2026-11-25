-- ============================================
-- FOOD EXPRESS DATABASE — food_db
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================
-- DROP EXISTING TABLES (para malinis)
-- ============================================
DROP TABLE IF EXISTS `admin`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `cart`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `messages`;

-- ============================================
-- TABLE: admin
-- ============================================
CREATE TABLE `admin` (
  `id` int(100) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `password` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Default admin: username = admin, password = admin123
INSERT INTO `admin` (`id`, `name`, `password`) VALUES
(1, 'admin', '6216f8a75fd5bb3d5f22b6f9958cdede3fc086c2');

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE `users` (
  `id` int(100) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `email` varchar(50) NOT NULL,
  `number` varchar(10) NOT NULL,
  `password` varchar(50) NOT NULL,
  `remember_me` longtext DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `address` varchar(500) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLE: products
-- ============================================
CREATE TABLE `products` (
  `id` int(100) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `quantity` int(50) NOT NULL DEFAULT 0,
  `price` int(10) NOT NULL,
  `image` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `products` (`id`, `name`, `category`, `quantity`, `price`, `image`) VALUES
(1, 'Strawberry Shake', 'desserts', 20, 50, 'dessert-1.png'),
(2, 'Spaghetti', 'main dish', 15, 60, 'dish-1.png'),
(3, 'Orange Juice', 'drinks', 25, 10, 'drink-1.png'),
(4, 'Pepperoni Pizza', 'fast food', 18, 100, 'pizza-3.png'),
(5, 'Burger', 'fast food', 45, 30, 'burger-1.png'),
(6, 'Steak', 'main dish', 10, 459, 'dish-4.png'),
(7, 'Strawberry Ice Cream', 'desserts', 15, 70, 'dessert-5.png'),
(8, 'Coffee', 'drinks', 30, 20, 'drink-2.png'),
(9, 'Strawberry Juice', 'drinks', 25, 22, 'drink-5.png'),
(10, 'Pasta', 'main dish', 13, 150, 'dish-3.png'),
(11, 'Chocolate Cake', 'desserts', 20, 28, 'dessert-2.png'),
(12, 'Chicken Burger', 'fast food', 34, 32, 'burger-2.png'),
(13, 'Mushroom Pizza', 'fast food', 14, 100, 'pizza-5.png');

-- ============================================
-- TABLE: cart
-- ============================================
CREATE TABLE `cart` (
  `id` int(100) NOT NULL AUTO_INCREMENT,
  `user_id` int(100) NOT NULL,
  `pid` int(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` int(10) NOT NULL,
  `quantity` int(10) NOT NULL,
  `image` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLE: orders
-- ============================================
CREATE TABLE `orders` (
  `id` int(100) NOT NULL AUTO_INCREMENT,
  `user_id` int(100) NOT NULL,
  `name` varchar(20) NOT NULL,
  `number` varchar(10) NOT NULL,
  `email` varchar(50) NOT NULL,
  `method` varchar(50) NOT NULL,
  `address` varchar(500) NOT NULL,
  `total_products` varchar(1000) NOT NULL,
  `total_price` int(100) NOT NULL,
  `placed_on` date NOT NULL DEFAULT current_timestamp(),
  `payment_status` varchar(20) NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- TABLE: messages
-- ============================================
CREATE TABLE `messages` (
  `id` int(100) NOT NULL AUTO_INCREMENT,
  `user_id` int(100) NOT NULL DEFAULT 0,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `number` varchar(12) NOT NULL,
  `message` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

-- ============================================
-- DONE! Dapat 13 products sa products table
-- ============================================