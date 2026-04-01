import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useContext(CartContext);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const page = searchParams.get('page') || 1;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [category, search, sort, page]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/tree`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        status: 'active'
      });

      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleAddToCart = async (productId) => {
    const result = await addToCart(productId, 1);
    if (result.success) {
      alert('Added to cart!');
    } else {
      alert(result.message || 'Failed to add to cart');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Products</h1>
        
        {/* Search */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-6 sticky top-20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>

            {/* Categories */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">Categories</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={!category}
                    onChange={() => handleFilterChange('category', '')}
                    className="mr-2 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">All Categories</span>
                </label>
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={category === cat.id}
                        onChange={() => handleFilterChange('category', cat.id)}
                        className="mr-2 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-600">{cat.name}</span>
                    </label>
                    {cat.children && cat.children.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {cat.children.map((subcat) => (
                          <label key={subcat.id} className="flex items-center">
                            <input
                              type="radio"
                              name="category"
                              checked={category === subcat.id}
                              onChange={() => handleFilterChange('category', subcat.id)}
                              className="mr-2 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-xs text-gray-500">{subcat.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Sort By</h4>
              <select
                value={sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-ratings.average">Best Rated</option>
                <option value="name">Name: A to Z</option>
                <option value="-name">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-grow">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg shadow p-4">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
              <p className="text-gray-500 text-lg">No products found</p>
              <Link to="/products" className="text-orange-600 hover:text-orange-700 mt-2 inline-block">
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                  >
                    <Link to={`/products/${product.id}`}>
                      <div className="relative">
                        <img
                          src={product.thumbnail_url || product.images?.[0]?.url || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                        />
                        {product.compare_price && product.compare_price > product.price && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
                          </span>
                        )}
                        {product.is_featured && (
                          <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        {product.category && (
                          <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xl font-bold text-orange-600">
                              ₹{product.price.toLocaleString()}
                            </span>
                            {product.compare_price && product.compare_price > product.price && (
                              <span className="text-sm text-gray-400 line-through ml-2">
                                ₹{product.compare_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {product.ratings?.average > 0 && (
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                              {product.ratings.average.toFixed(1)}
                            </div>
                          )}
                        </div>
                        {product.track_inventory && product.stock_quantity <= (product.low_stock_threshold || 10) && product.stock_quantity > 0 && (
                          <p className="text-sm text-orange-600 mb-2">Only {product.stock_quantity} left!</p>
                        )}
                      </div>
                    </Link>
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={product.track_inventory && product.stock_quantity === 0}
                        className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {product.track_inventory && product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, parseInt(page) - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  <span className="text-gray-600">
                    Page {page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => handleFilterChange('page', Math.min(pagination.pages, parseInt(page) + 1))}
                    disabled={page >= pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;