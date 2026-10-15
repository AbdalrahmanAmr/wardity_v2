import { FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/utils/formatters";
import { useLanguage } from "@/contexts/LanguageContext";

export const Cart: FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const { language } = useLanguage();

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-wardity-bg py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <ShoppingBagIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wardity-bg py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8">
          <Link
            to="/"
            className="text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="text-gray-500">({cart.itemCount} items)</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedSize || "default"}`}
                className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${item.product.status === "Out of stock" ? "border border-red-200" : ""}`}
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link
                    to={`/product/${item.product.id}`}
                    className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className={`w-full h-full object-cover ${item.product.status === "Out of stock" ? "grayscale opacity-60" : ""}`}
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product.id}`}
                      className="block mb-2"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    {item.selectedSize && (
                      <p className="text-sm text-gray-500 mb-2">Size: {item.selectedSize}</p>
                    )}
                    {item.product.status === "Out of stock" && <p className="text-sm font-semibold text-red-600">{language === "ar" ? "غير متوفر - احذف هذا المنتج للمتابعة" : "Out of stock - remove this item to continue"}</p>}
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency((item.product.salePrice ?? item.product.price) * item.quantity)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.product.status === "Out of stock"}
                        className="p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 font-medium min-w-[50px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.product.status === "Out of stock"}
                        className="p-2 text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Clear cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={cart.total >= 500 ? "text-success" : ""}>
                    {cart.total >= 500 ? "Free" : "50 EGP"}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT</span>
                  <span>Included</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatCurrency(cart.total + (cart.total >= 500 ? 0 : 50))}
                    </span>
                  </div>
                </div>
              </div>

              {cart.total < 500 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-6">
                  <p className="text-sm text-primary">
                    Add {formatCurrency(500 - cart.total)} more for free shipping!
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate("/checkout")}
                disabled={cart.items.some((item) => item.product.status === "Out of stock")}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors mb-4 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/"
                className="block text-center text-gray-600 hover:text-primary transition-colors text-sm"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
