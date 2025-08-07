-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 06, 2025 at 05:10 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `finance_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `tipe` varchar(50) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `nominal_total` decimal(15,2) NOT NULL,
  `sisa_tagihan` decimal(15,2) NOT NULL,
  `place` varchar(100) NOT NULL,
  `tanggal_transaksi` date NOT NULL,
  `jatuh_tempo` date NOT NULL,
  `status` enum('BELUM LUNAS','JATUH TEMPO','LUNAS') NOT NULL DEFAULT 'BELUM LUNAS',
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `name`, `tipe`, `deskripsi`, `nominal_total`, `sisa_tagihan`, `place`, `tanggal_transaksi`, `jatuh_tempo`, `status`, `catatan`, `created_at`, `updated_at`) VALUES
(1, 'Doni', 'UTANG', 'Ngutang dulu bos.', 200000.00, 200000.00, 'Toko', '2025-08-06', '2025-08-12', 'BELUM LUNAS', NULL, '2025-08-06 14:57:30', '2025-08-06 14:57:30'),
(2, 'Anto', 'PIUTANG', 'Pinjam dulu tiga ratus.', 300000.00, 300000.00, 'Toko', '2025-08-06', '2025-08-11', 'BELUM LUNAS', NULL, '2025-08-06 14:57:57', '2025-08-06 14:57:57');

--
-- Triggers `accounts`
--
DELIMITER $$
CREATE TRIGGER `update_account_status_before_update` BEFORE UPDATE ON `accounts` FOR EACH ROW BEGIN
    IF NEW.sisa_tagihan <= 0 THEN
        SET NEW.status = 'LUNAS';
    ELSEIF NEW.jatuh_tempo <= CURDATE() AND NEW.sisa_tagihan > 0 THEN
        SET NEW.status = 'JATUH TEMPO';
    ELSE
        SET NEW.status = 'BELUM LUNAS';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `conversions`
--

CREATE TABLE `conversions` (
  `conversion_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `from_unit` varchar(50) NOT NULL,
  `to_unit` varchar(50) NOT NULL,
  `multiplier` decimal(15,5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conversions`
--

INSERT INTO `conversions` (`conversion_id`, `product_id`, `from_unit`, `to_unit`, `multiplier`) VALUES
(1, 1, 'Pack', 'Pack', 1.00000),
(2, 1, 'Box', 'Pack', 30.00000);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `purchase_price` decimal(15,2) DEFAULT 0.00,
  `selling_price` decimal(15,2) DEFAULT 0.00,
  `min_stock_level` decimal(10,2) DEFAULT 0.00,
  `units` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `sku`, `name`, `description`, `purchase_price`, `selling_price`, `min_stock_level`, `units`, `created_at`) VALUES
(1, 'SK001', 'Asam Biji', 'Asam berbiji.', 100000.00, 120000.00, 5.00, '[\"Pack\",\"Box\"]', '2025-08-06 14:56:12');

-- --------------------------------------------------------

--
-- Table structure for table `products_stocks`
--

CREATE TABLE `products_stocks` (
  `stock_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `place` varchar(100) NOT NULL,
  `stock_levels` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`stock_levels`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products_stocks`
--

INSERT INTO `products_stocks` (`stock_id`, `product_id`, `place`, `stock_levels`) VALUES
(1, 1, 'Toko', '{\"Pack\":3,\"Box\":0}'),
(2, 1, 'Gudang', '{\"Pack\":15,\"Box\":0}');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `report_type` varchar(50) NOT NULL,
  `place` varchar(100) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `as_of_date` date DEFAULT NULL,
  `pdf_path` varchar(255) NOT NULL,
  `status` varchar(20) DEFAULT 'final',
  `closing_cash` decimal(15,2) DEFAULT 0.00,
  `closing_inventory` decimal(15,2) DEFAULT 0.00,
  `closing_receivables` decimal(15,2) DEFAULT 0.00,
  `closing_payables` decimal(15,2) DEFAULT 0.00,
  `closing_retained_earnings` decimal(15,2) DEFAULT 0.00,
  `closing_equipment` decimal(15,2) DEFAULT 0.00,
  `closing_supplies` decimal(15,2) DEFAULT 0.00,
  `closing_modal` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `report_type`, `place`, `start_date`, `end_date`, `as_of_date`, `pdf_path`, `status`, `closing_cash`, `closing_inventory`, `closing_receivables`, `closing_payables`, `closing_retained_earnings`, `closing_equipment`, `closing_supplies`, `closing_modal`, `created_at`) VALUES
(1, 'profit-loss', 'Toko', '2025-07-01', '2025-07-31', NULL, 'C:\\Users\\anggr\\Downloads/LabaRugi-Toko-2025-07-31.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:00:35'),
(2, 'cash-flow', 'Toko', '2025-08-01', '2025-08-31', NULL, 'C:\\Users\\anggr\\Downloads/ArusKas-Toko-2025-08-31.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:00:39'),
(3, 'balance-sheet', 'Toko', '2025-07-01', '2025-07-31', '2025-07-31', 'C:\\Users\\anggr\\Downloads/Neraca-Bulanan-Toko-2025-07-31.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:01:21'),
(4, 'balance-sheet', 'Toko', NULL, NULL, '2025-08-05', 'C:\\Users\\anggr\\Downloads/Neraca-Toko-2025-08-05.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:01:30'),
(5, 'recap', 'Toko', '2025-08-05', '2025-08-05', NULL, 'C:\\Users\\anggr\\Downloads/Rekap-Harian-Toko-2025-08-05.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:01:34'),
(6, 'recap', 'Toko', '2025-07-01', '2025-07-31', NULL, 'C:\\Users\\anggr\\Downloads/Rekap-Bulanan-Toko-2025-07-01-2025-07-31.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:01:35'),
(7, 'recap', 'Toko', '2024-01-01', '2024-12-31', NULL, 'C:\\Users\\anggr\\Downloads/Rekap-Tahunan-Toko-2024-01-01-2024-12-31.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:01:35'),
(8, 'recap', 'Toko', '2025-07-31', '2025-08-06', NULL, 'C:\\Users\\anggr\\Downloads/Rekap-Mingguan-Toko-2025-07-31-2025-08-06.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:06:33'),
(9, 'recap', 'Toko', '2025-07-30', '2025-08-05', NULL, 'C:\\Users\\anggr\\Downloads/Rekap-Mingguan-Toko-2025-07-30-2025-08-05.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:07:13'),
(10, 'cash-flow', 'Toko', '2025-07-01', '2025-07-31', NULL, 'C:\\Users\\anggr\\Downloads/ArusKas-Toko-2025-07-31.pdf', 'final', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-06 15:08:35');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `transaction_id` int(11) NOT NULL,
  `type` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `place` varchar(100) NOT NULL,
  `quantity` decimal(15,2) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `nominal` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`transaction_id`, `type`, `name`, `product_name`, `description`, `place`, `quantity`, `unit`, `nominal`, `created_at`) VALUES
(1, 'Modal', NULL, NULL, 'idk', 'Toko', NULL, NULL, 100000.00, '2025-08-06 14:55:07'),
(2, 'Stok Masuk', NULL, 'Asam Biji', 'idk', 'Toko', 30.00, 'Pack', 3000000.00, '2025-08-06 14:56:51'),
(3, 'Penjualan', NULL, 'Asam Biji', 'idk', 'Toko', 12.00, 'Pack', 120000.00, '2025-08-06 14:57:04'),
(4, 'Stok Keluar', NULL, 'Asam Biji', 'idk', 'Toko', 12.00, 'Pack', 1200000.00, '2025-08-06 14:57:04'),
(5, 'Utang', 'Doni', NULL, 'Ngutang dulu bos.', 'Toko', NULL, NULL, 200000.00, '2025-08-06 14:57:30'),
(6, 'Piutang', 'Anto', NULL, 'Pinjam dulu tiga ratus.', 'Toko', NULL, NULL, 300000.00, '2025-08-06 14:57:57'),
(7, 'Beban Gaji Staff', NULL, NULL, '3 orang punya', 'Toko', NULL, NULL, 9000000.00, '2025-08-06 14:58:14'),
(8, 'Beban Bonus Staff', NULL, NULL, 'Lembur.', 'Toko', NULL, NULL, 100000.00, '2025-08-06 14:58:30'),
(9, 'Uang Makan Staff', NULL, NULL, '1 orang.', 'Toko', NULL, NULL, 20000.00, '2025-08-06 14:58:45'),
(10, 'Perlengkapan', NULL, NULL, 'Tas Gucci.', 'Toko', NULL, NULL, 900000.00, '2025-08-06 14:58:59'),
(11, 'Peralatan', NULL, NULL, 'Palu-palu', 'Toko', NULL, NULL, 1000000.00, '2025-08-06 14:59:25'),
(12, 'Biaya Lain Lain', NULL, NULL, 'Jalan-jalan.', 'Toko', NULL, NULL, 2000000.00, '2025-08-06 14:59:42'),
(13, 'Stok Keluar', NULL, 'Asam Biji', 'Transfer ke Gudang', 'Toko', 15.00, 'Pack', 0.00, '2025-08-06 15:00:04'),
(14, 'Stok Masuk', NULL, 'Asam Biji', 'Transfer dari Toko', 'Gudang', 15.00, 'Pack', 0.00, '2025-08-06 15:00:04');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `conversions`
--
ALTER TABLE `conversions`
  ADD PRIMARY KEY (`conversion_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `sku` (`sku`);

--
-- Indexes for table `products_stocks`
--
ALTER TABLE `products_stocks`
  ADD PRIMARY KEY (`stock_id`),
  ADD UNIQUE KEY `product_place` (`product_id`,`place`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`transaction_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `conversions`
--
ALTER TABLE `conversions`
  MODIFY `conversion_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `products_stocks`
--
ALTER TABLE `products_stocks`
  MODIFY `stock_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `conversions`
--
ALTER TABLE `conversions`
  ADD CONSTRAINT `conversions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `products_stocks`
--
ALTER TABLE `products_stocks`
  ADD CONSTRAINT `products_stocks_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`localhost` EVENT `daily_check_jatuh_tempo` ON SCHEDULE EVERY 1 DAY STARTS '2025-08-07 22:50:58' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE accounts 
    SET status = 'JATUH TEMPO' 
    WHERE jatuh_tempo <= CURDATE() 
      AND sisa_tagihan > 0 
      AND status = 'BELUM LUNAS'$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
