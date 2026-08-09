--> Added by hand: guest carts are being withdrawn, and their rows have a null
--> user_id that the NOT NULL column below would reject. Discarding them is the
--> intent of the change, not a side effect of it.
DELETE FROM `cart_items` WHERE `user_id` IS NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`user_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_cart_items`("id", "product_id", "user_id", "quantity", "created_at") SELECT "id", "product_id", "user_id", "quantity", "created_at" FROM `cart_items`;--> statement-breakpoint
DROP TABLE `cart_items`;--> statement-breakpoint
ALTER TABLE `__new_cart_items` RENAME TO `cart_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;