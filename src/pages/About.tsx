import { FC } from "react";
import {
  HeartIcon,
  SparklesIcon,
  TruckIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";

export const About: FC = () => {
  return (
    <div className="min-h-screen bg-wardity-bg dark:bg-wardity-bg-dark py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            About Wardity
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            A Blooming Connection - Delivering love and joy through beautiful
            flowers
          </p>
        </div>

        {/* Mission Section */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <HeartIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Our Mission
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            At Wardity, we believe that flowers are more than just beautiful
            arrangements—they're a way to express emotions, celebrate moments,
            and connect with the people you care about. Our mission is to make
            it easy and delightful for you to share love, joy, and appreciation
            through the gift of fresh, beautiful flowers.
          </p>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            We're committed to providing exceptional quality, reliable same-day
            delivery, and outstanding customer service to ensure every order
            brings a smile to someone's face.
          </p>
        </section>

        {/* Story Section */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Our Story
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            Wardity was born from a simple idea: everyone deserves to experience
            the joy of giving and receiving beautiful flowers, no matter the
            occasion. What started as a small local flower shop has grown into a
            trusted online flower delivery service serving Cairo and Giza.
          </p>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            We work directly with local growers and florists to ensure the
            freshest flowers reach your doorstep. Every arrangement is carefully
            crafted by our skilled florists, who pour their passion and
            creativity into each bouquet, box, and vase arrangement.
          </p>
        </section>

        {/* Values Section */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            What We Stand For
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <HeartIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Quality
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We source only the freshest, highest-quality flowers and
                  ensure they're handled with care from our suppliers to your
                  doorstep.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <TruckIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Reliability
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Same-day delivery, real-time tracking, and a commitment to
                  getting your order where it needs to be, when it needs to be
                  there.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <GiftIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Customer Care
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your satisfaction is our priority. We're here to help with any
                  questions, concerns, or special requests you might have.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Creativity
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our florists are artists who create unique, beautiful
                  arrangements tailored to your occasion and preferences.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-gradient-to-r from-primary to-primary-600 rounded-2xl shadow-lg p-6 md:p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Why Choose Wardity?</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></span>
              <span>Same-day delivery in Cairo only</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></span>
              <span>Free delivery on orders over 2000 EGP</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></span>
              <span>100% satisfaction guarantee</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></span>
              <span>Free gift wrapping on all orders</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></span>
              <span>Wide selection of fresh flowers and gifts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></span>
              <span>Easy online ordering and real-time tracking</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};
