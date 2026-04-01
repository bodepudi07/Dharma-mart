import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

function OrderSuccess() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = location.state?.orderId || searchParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}`);
      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-pulse">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      {/* Success Icon */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {order ? 'Order Placed Successfully!' : 'Thank You!'}
      </h1>
      
      <p className="text-lg text-gray-600 mb-6">
        {order 
          ? `Your order #${order.order_number} has been placed successfully.`
          : 'Your order has been placed successfully.'
        }
      </p>

      {order && (
        <div className="bg-white rounded-lg shadow p-6 mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Details</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-semibold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold text-orange-600">₹{order.total_amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold capitalize">
                {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Status:</span>
              <span className={`font-semibold capitalize ${
                order.status === 'confirmed' ? 'text-green-600' : 
                order.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_city && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-800 mb-2">Shipping Address</h3>
              <p className="text-gray-600">
                {order.shipping_full_name}<br />
                {order.shipping_street}<br />
                {order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}<br />
                {order.shipping_country}
              </p>
            </div>
          )}

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <img
                      src={item.image_url || item.image?.url || '/placeholder.png'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-grow">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-orange-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-orange-800 mb-2">What's Next?</h3>
        <ul className="text-orange-700 text-left list-disc list-inside space-y-1">
          <li>You will receive an email confirmation shortly</li>
          <li>We will notify you when your order is shipped</li>
          <li>You can track your order in your account</li>
          <li>For any queries, contact our support team</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/products"
          className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Continue Shopping
        </Link>
        <Link
          to="/"
          className="inline-block border border-orange-600 text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
        >
          Back to Home
        </Link>
      </div>

      {/* Contact Support */}
      <div className="mt-12 pt-8 border-t">
        <p className="text-gray-500 text-sm">
          Need help? Contact us at{' '}
          <a href="mailto:support@dharmamart.com" className="text-orange-600 hover:text-orange-700">
            support@dharmamart.com
          </a>
          {' '}or call{' '}
          <a href="tel:+911234567890" className="text-orange-600 hover:text-orange-700">
            +91 123 456 7890
          </a>
        </p>
      </div>
    </div>
  );
}

export default OrderSuccess;