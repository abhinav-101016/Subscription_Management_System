import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { Select } from './Select';
import { formatCurrency } from '../../lib/utils';

/**
 * ResourcePicker
 * Fetches real customers and product variants from the live database.
 */
export function ResourcePicker({
  type = 'customer', // 'customer' | 'variant'
  value,
  onChange,
  label,
  error,
  placeholder = 'Select...',
  disabled = false,
  className,
}) {
  const isCustomer = type === 'customer';

  // Fetch real customers
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['picker-customers'],
    queryFn: async () => {
      const res = await api.get('/api/users?role=customer');
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: isCustomer,
  });

  // Fetch real products & variants
  const { data: variants = [], isLoading: loadingVariants } = useQuery({
    queryKey: ['picker-variants'],
    queryFn: async () => {
      const res = await api.get('/api/products');
      const products = Array.isArray(res) ? res : res?.data || [];
      const extractedVariants = [];
      for (const prod of products) {
        if (Array.isArray(prod.variants) && prod.variants.length > 0) {
          for (const v of prod.variants) {
            extractedVariants.push({
              _id: v._id || v.id,
              name: `${prod.name} - ${v.attribute_value || v.variant_name || 'Standard'}`,
              sku: v.sku || 'SKU-STD',
              price: v.final_price !== undefined ? v.final_price : prod.sales_price,
            });
          }
        } else {
          extractedVariants.push({
            _id: prod._id || prod.id,
            name: prod.name,
            sku: 'SKU-BASE',
            price: prod.sales_price || 0,
          });
        }
      }
      return extractedVariants;
    },
    enabled: !isCustomer,
  });

  const isLoading = isCustomer ? loadingCustomers : loadingVariants;
  const items = isCustomer ? customers : variants;

  return (
    <Select
      label={label || (isCustomer ? 'Customer Account' : 'Product Line / Variant')}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      disabled={disabled || isLoading}
      className={className}
    >
      <option value="" disabled>
        {isLoading ? 'Loading ledger options...' : placeholder}
      </option>
      {items.map((item) => (
        <option key={item._id} value={item._id}>
          {item.name}{' '}
          {isCustomer
            ? `(${item.email})`
            : `• ${formatCurrency(item.price)} [${item.sku}]`}
        </option>
      ))}
    </Select>
  );
}
