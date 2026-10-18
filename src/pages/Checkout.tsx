import { FC, useEffect, useMemo, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCurrency } from "@/utils/formatters";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { trackInitiateCheckout, trackPurchase } from "@/lib/tracking";
import { useConsent } from "@/contexts/ConsentContext";
import { useDeliveryLocations } from "@/services/queries/deliveryLocationQueries";

function cairoDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const item = (type: string) =>
    parts.find((part) => part.type === type)?.value;
  return `${item("year")}-${item("month")}-${item("day")}`;
}
const timeOptions = Array.from({ length: 31 }, (_, index) => {
  const minutes = (10 * 60 + index * 30) % (24 * 60);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const suffix = hour <= 1 ? " (after midnight)" : "";
  return {
    value,
    label:
      new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(2000, 0, 1, hour, minute)) + suffix,
  };
});

export const Checkout: FC = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { choice } = useConsent();
  const locationsQuery = useDeliveryLocations();

  const [formData, setFormData] = useState({
    firstName: user?.name.split(" ")[0] || "",
    lastName: user?.name.split(" ")[1] || "",
    email: user?.email || "",
    phone: "",
    address: "",
    deliveryLocationId: "",
    postalCode: "",
    deliveryDate: "",
    deliveryTime: "",
    notes: "",
  });

  const today = cairoDate();
  const location = locationsQuery.data?.find(
    (item) => item.id === formData.deliveryLocationId,
  );
  useEffect(() => {
    if (
      formData.deliveryLocationId &&
      !locationsQuery.data?.some(
        (item) => item.id === formData.deliveryLocationId,
      )
    )
      setFormData((current) => ({ ...current, deliveryLocationId: "" }));
  }, [formData.deliveryLocationId, locationsQuery.data]);
  const quoteRequired = Boolean(location?.requiresQuote);
  const shippingCost = useMemo(
    () =>
      quoteRequired
        ? null
        : cart.total > 2000
          ? 0
          : (location?.deliveryFee ?? null),
    [cart.total, location, quoteRequired],
  );
  const total =
    shippingCost === null ? null : cart.total + Number(shippingCost);

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-wardity-bg py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-8">
              Add items to your cart before checkout
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "deliveryDate" && value === today
        ? { deliveryTime: "" }
        : {}),
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const eventId =
        choice === "accepted"
          ? trackInitiateCheckout(
              cart.total,
              cart.items.map((item) => ({
                id: item.product.id,
                price: item.product.salePrice ?? item.product.price,
                quantity: item.quantity,
              })),
            )
          : undefined;
      const order = await api.post<{
        id: string;
        total: number | null;
        requiresShippingQuote?: boolean | number;
        items: Array<{
          product: { id: string };
          quantity: number;
          price: number;
        }>;
      }>("/orders", {
        shippingAddress: `${formData.address}, ${location?.name || ""}, ${formData.postalCode}`,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        paymentMethod: "cash_on_delivery",
        eventId,
        consent: choice === "accepted",
        email: formData.email,
        phone: formData.phone,
        sourceUrl: window.location.href,
        deliveryLocationId: formData.deliveryLocationId,
        requestedDeliveryDate: formData.deliveryDate,
        requestedDeliveryTime:
          formData.deliveryDate === today
            ? null
            : formData.deliveryTime || null,
      });
      clearCart();
      if (
        choice === "accepted" &&
        order.total !== null &&
        !order.requiresShippingQuote
      )
        trackPurchase(
          order.id,
          order.total,
          order.items.map((item) => ({
            id: item.product.id,
            price: item.price,
            quantity: item.quantity,
          })),
          eventId,
        );
      navigate(`/orders/${encodeURIComponent(order.id)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-wardity-bg py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8">
          <Link
            to="/cart"
            className="text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBlock message={error} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Shipping Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="deliveryLocationId"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Delivery location *
                    </label>
                    <select
                      id="deliveryLocationId"
                      name="deliveryLocationId"
                      value={formData.deliveryLocationId}
                      onChange={handleChange}
                      required
                      disabled={
                        locationsQuery.isLoading || locationsQuery.isError
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    >
                      <option value="">
                        {locationsQuery.isLoading
                          ? "Loading locations…"
                          : "Select location"}
                      </option>
                      {locationsQuery.data?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.requiresQuote
                            ? " — quote required"
                            : item.deliveryFee === null
                              ? " — price not configured"
                              : ""}
                        </option>
                      ))}
                    </select>
                    {locationsQuery.isError && (
                      <p className="mt-2 text-sm text-red-600">
                        Locations could not load.{" "}
                        <button
                          type="button"
                          className="underline"
                          onClick={() => locationsQuery.refetch()}
                        >
                          Retry
                        </button>
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="postalCode"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Postal Code
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Delivery Options
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="deliveryDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Delivery Date *
                    </label>
                    <input
                      id="deliveryDate"
                      name="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={handleChange}
                      required
                      min={today}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  {formData.deliveryDate !== today && (
                    <div>
                      <label
                        htmlFor="deliveryTime"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Delivery Time *
                      </label>
                      <select
                        id="deliveryTime"
                        name="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={handleChange}
                        required={Boolean(
                          formData.deliveryDate &&
                          formData.deliveryDate !== today,
                        )}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      >
                        <option value="">Select time</option>
                        {timeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any special instructions for delivery..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      defaultChecked
                      className="text-primary focus:ring-primary"
                    />
                    <span className="ml-3 font-medium">Cash on Delivery</span>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      className="text-primary focus:ring-primary"
                    />
                    <span className="ml-3 font-medium">Credit/Debit Card</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Placing Order...
                  </>
                ) : total === null ? (
                  "Place quote request"
                ) : (
                  `Place Order - ${formatCurrency(total)}`
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize || "default"}`}
                    className="flex gap-3"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? "text-success" : ""}>
                    {quoteRequired
                      ? "Quote required"
                      : shippingCost === null
                        ? "Select a priced location"
                        : shippingCost === 0
                          ? "Free"
                          : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-primary">
                    {total === null
                      ? "Calculated after quote"
                      : formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
