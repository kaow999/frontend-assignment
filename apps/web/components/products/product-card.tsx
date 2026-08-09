import Image from "next/image";

import type { Product } from "../../lib/api/products";
import { PriceTag } from "../ui/price-tag";
import { RatingStars } from "../ui/rating-stars";
import { AddToCartControl } from "./add-to-cart-control";

export const ProductCard = ({
  product,
  priority,
}: {
  product: Product;
  /** Set on the first row so the largest-contentful image is not lazy-loaded. */
  priority?: boolean;
}) => (
  <article className="flex flex-col">
    <div className="relative aspect-square overflow-hidden rounded-card bg-surface">
      <Image
        src={product.imageUrl}
        alt={product.name}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
        className="object-cover"
      />

      <div className="absolute right-3 bottom-3">
        <AddToCartControl productId={product.id} productName={product.name} />
      </div>
    </div>

    <h3 className="mt-4 line-clamp-2-safe text-base font-bold">
      {product.name}
    </h3>

    <div className="mt-2">
      <RatingStars rating={product.rating} />
    </div>

    <PriceTag
      className="mt-2"
      price={product.price}
      discountedPrice={product.discountedPrice}
      percentageDiscount={product.percentageDiscount}
    />
  </article>
);
