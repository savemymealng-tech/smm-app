import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import type { InitializePaymentRequest } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useInitializePayment() {
  return useMutation({
    mutationFn: (paymentData: InitializePaymentRequest) => 
      api.payments.initializePayment(paymentData),
    onError: (error: any) => {
      toast.error('Payment Error', error.message || 'Failed to initialize payment');
    },
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
    onError: (error: any) => {
      toast.error('Verification Failed', error.message || 'Failed to verify payment');
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
