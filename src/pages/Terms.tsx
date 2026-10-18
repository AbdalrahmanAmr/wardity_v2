import { FC } from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export const Terms: FC = () => {
  return (
    <div className="min-h-screen bg-wardity-bg dark:bg-wardity-bg-dark py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Terms & Conditions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
          {/* Acceptance */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              By accessing and using the Wardity website and services, you
              accept and agree to be bound by these Terms and Conditions. If you
              do not agree to these terms, please do not use our services.
            </p>
          </section>

          {/* Use of Service */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              2. Use of Service
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Eligibility
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  You must be at least 18 years old to use our services. By
                  using our services, you represent that you meet this age
                  requirement.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Account Responsibility
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  You are responsible for maintaining the confidentiality of
                  your account credentials and for all activities that occur
                  under your account.
                </p>
              </div>
            </div>
          </section>

          {/* Orders */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              3. Orders and Payment
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Order Acceptance
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  All orders are subject to acceptance by Wardity. We reserve
                  the right to refuse or cancel any order for any reason,
                  including product availability, errors in pricing, or
                  suspected fraud.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Pricing
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  All prices are displayed in Egyptian Pounds (EGP) and are
                  subject to change without notice. We strive to ensure accurate
                  pricing, but errors may occur. If we discover a pricing error,
                  we will notify you and provide options to proceed or cancel.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Payment
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Payment must be made at the time of order placement. We accept
                  cash on delivery, credit/debit cards, and other payment
                  methods as specified on our website. All payments are
                  processed securely through trusted payment processors.
                </p>
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              4. Delivery
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Delivery Areas
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We currently deliver in Cairo only. Delivery times and fees
                  are specified at checkout based on location. We are not
                  responsible for delays caused by factors beyond our control.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Delivery Responsibility
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Please ensure someone is available to receive the delivery. If
                  no one is available, we will attempt to contact you to
                  reschedule. Additional delivery attempts may incur additional
                  fees.
                </p>
              </div>
            </div>
          </section>

          {/* Returns and Refunds */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              5. Returns and Refunds
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Satisfaction Guarantee
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We offer a 100% satisfaction guarantee. If you're not
                  satisfied with your order, please contact us within 24 hours
                  of delivery. We will work with you to resolve the issue, which
                  may include replacement or refund.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Refund Policy
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Refunds will be processed to the original payment method
                  within 5-10 business days. For cash on delivery orders,
                  refunds will be processed via bank transfer or store credit.
                </p>
              </div>
            </div>
          </section>

          {/* Cancellations */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              6. Order Cancellations
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              You may cancel your order within 30 minutes of placement by
              contacting our customer service. After this period, orders are
              processed and cannot be cancelled. For scheduled deliveries,
              cancellations must be made at least 24 hours before the scheduled
              delivery time.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              All content on the Wardity website, including text, graphics,
              logos, images, and software, is the property of Wardity and is
              protected by copyright and trademark laws. You may not reproduce,
              distribute, or use any content without our written permission.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              To the maximum extent permitted by law, Wardity shall not be
              liable for any indirect, incidental, special, or consequential
              damages arising from your use of our services. Our total liability
              shall not exceed the amount you paid for the specific order in
              question.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              9. Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We reserve the right to modify these Terms and Conditions at any
              time. Changes will be effective immediately upon posting on our
              website. Your continued use of our services after changes are
              posted constitutes acceptance of the modified terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              10. Contact Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              If you have questions about these Terms and Conditions, please
              contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> legal@wardity.com
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <strong>Phone:</strong> 01100374039 / 01007906629
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
