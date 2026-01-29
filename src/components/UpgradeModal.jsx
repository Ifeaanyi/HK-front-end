import { useState } from 'react';

export default function UpgradeModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpgrade = (plan) => {
    const paymentLinks = {
      monthly: 'https://paystack.shop/pay/n8x6mqs2vq',
      yearly: 'https://paystack.shop/pay/l10ib7q9q9'
    };
    window.open(paymentLinks[plan], '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Upgrade to Pro 👑</h2>
              <p className="text-purple-100 mt-1">Unlock all features and compete with friends!</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Monthly Plan */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 transition-colors">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Monthly</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">₦4,500</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Billed monthly</p>
                <button
                  onClick={() => handleUpgrade('monthly')}
                  className="mt-6 w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Choose Monthly
                </button>
              </div>
            </div>

            {/* Yearly Plan */}
            <div className="border-2 border-purple-500 rounded-xl p-6 relative bg-purple-50">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  SAVE 39%
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Yearly</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">₦33,000</span>
                  <span className="text-gray-500">/year</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  <span className="line-through">₦54,000</span> Save ₦21,000
                </p>
                <button
                  onClick={() => handleUpgrade('yearly')}
                  className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition"
                >
                  Choose Yearly
                </button>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-8">
            <h4 className="font-semibold text-gray-900 mb-4">Pro Features Include:</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Create & join groups</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Leaderboard access</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Hall of Fame</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Add friends</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Daily stats & insights</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">Priority support</span>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>🔒 Secure payment powered by Paystack</p>
            <p className="mt-1">Cancel anytime from your dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
}