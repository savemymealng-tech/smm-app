import { api } from '@/lib/api';
import type { InitializePaymentRequest } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useInitializePayment() {
  return useMutation({
    mutationFn: (paymentData: InitializePaymentRequest) => 
      api.payments.initializePayment(paymentData),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reference: string) => api.payments.verifyPayment(reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function usePaymentHistory(orderId: number) {
  return useQuery({
    queryKey: ['payments', 'history', orderId],
    queryFn: () => api.payments.getPaymentHistory(orderId),
    enabled: !!orderId,
  });
}
