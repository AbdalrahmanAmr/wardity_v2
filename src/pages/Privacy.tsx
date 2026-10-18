import { FC } from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export const Privacy: FC = () => {
  return (
    <div className="min-h-screen bg-wardity-bg dark:bg-wardity-bg-dark py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              At Wardity ("we," "our," or "us"), we are committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you visit our website and use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Personal Information
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Name and contact information (email, phone number, address)</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Order history and preferences</li>
                  <li>Account credentials (if you create an account)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Automatically Collected Information
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  When you visit our website, we automatically collect certain information, including:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>IP address and browser type</li>
                  <li>Device information</li>
                  <li>Pages visited and time spent on pages</li>
                  <li>Referring website addresses</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and delivery updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              4. Information Sharing and Disclosure
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              We do not sell your personal information. We may share your information only in the
              following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li>
                <strong>Service Providers:</strong> With trusted third parties who assist in
                operating our website and conducting our business (payment processors, delivery
                services)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights
                and safety
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with any merger, sale, or
                acquisition
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect
              your personal information. However, no method of transmission over the internet is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              6. Your Rights
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li>Access and receive a copy of your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Withdraw consent for marketing communications</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              7. Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your browsing experience,
              analyze website traffic, and personalize content. You can control cookie preferences
              through your browser settings.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              8. Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
              If you have questions about this Privacy Policy or wish to exercise your rights,
              please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> privacy@wardity.com
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
