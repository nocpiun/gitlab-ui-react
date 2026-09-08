import { useState } from "react";
import {
  GlBadge,
  GlButton,
  GlButtonGroup,
  GlFormInput,
  GlFormSelect,
  GlFormSelectItem,
} from "gitlab-ui-react";
import { BlockHeader, ShowcaseCard } from "./showcase-card";

export function CheckoutBlock() {
  const [quantity, setQuantity] = useState(1);
  const subtotal = 68 + 24 * quantity;
  const total = subtotal + 6;

  return (
    <ShowcaseCard labelledBy="checkout-block-title">
      <BlockHeader
        action={<GlBadge icon="package" variant="info">{1 + quantity} items</GlBadge>}
        description="Review the details and choose how your order should arrive."
        id="checkout-block-title"
        title="Complete your order" />

      <div className="divide-y divide-section border-y border-section">
        <div className="flex items-center gap-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate font-semibold text-heading">Ambient desk lamp</p>
            <p className="m-0 mt-0.5 text-sm text-subtle">Sand · One size</p>
          </div>
          <span className="font-semibold text-default">$68</span>
        </div>

        <div className="flex items-center gap-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate font-semibold text-heading">Grid notebook</p>
            <p className="m-0 mt-0.5 text-sm text-subtle">Moss · A5</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="font-semibold text-default">${24 * quantity}</span>
            <GlButtonGroup>
              <GlButton
                aria-label="Decrease notebook quantity"
                category="tertiary"
                disabled={quantity === 1}
                icon="dash"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                size="small" />
              <GlButton aria-label={`Notebook quantity: ${quantity}`} size="small">
                {quantity}
              </GlButton>
              <GlButton
                aria-label="Increase notebook quantity"
                category="tertiary"
                icon="plus"
                onClick={() => setQuantity((current) => current + 1)}
                size="small" />
            </GlButtonGroup>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <label className="text-sm font-semibold text-default" htmlFor="showcase-delivery">
          Delivery method
        </label>
        <GlFormSelect defaultValue="standard" id="showcase-delivery">
          <GlFormSelectItem value="standard">Standard · 3–5 days · $6</GlFormSelectItem>
          <GlFormSelectItem value="express">Express · Next day · $18</GlFormSelectItem>
          <GlFormSelectItem value="pickup">Store pickup · Free</GlFormSelectItem>
        </GlFormSelect>
      </div>

      <div className="mt-5 border-t border-section pt-4">
        <h3 className="m-0 text-base font-semibold text-heading">Order summary</h3>
        <dl className="mb-0 mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-subtle">Subtotal</dt>
            <dd className="m-0 text-default">${subtotal}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-subtle">Delivery</dt>
            <dd className="m-0 text-default">$6</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-section pt-2 font-semibold">
            <dt className="text-heading">Total</dt>
            <dd className="m-0 text-heading">${total}</dd>
          </div>
        </dl>

        <div className="mt-4 flex gap-2">
          <GlFormInput className="min-w-0" placeholder="Promo code" />
          <GlButton className="min-w-fit!">Apply</GlButton>
        </div>
        <GlButton block className="mt-3!" icon="credit-card" variant="confirm">Continue to payment</GlButton>
        <p className="mb-0 mt-3! text-center text-xs text-subtle">Taxes calculated at payment</p>
      </div>
    </ShowcaseCard>
  );
}
