import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data.cart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchCart();
    else setCart({ items: [] });
  }, [user, fetchCart]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    const { data } = await api.post('/cart/items', { productId, quantity });
    setCart(data.cart);
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    const { data } = await api.patch(`/cart/items/${productId}`, { quantity });
    setCart(data.cart);
  }, []);

  const removeItem = useCallback(async (productId) => {
    const { data } = await api.delete(`/cart/items/${productId}`);
    setCart(data.cart);
  }, []);

  const clearCart = useCallback(async () => {
    const { data } = await api.delete('/cart');
    setCart(data.cart);
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, loading, itemCount, fetchCart, addItem, updateItem, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

