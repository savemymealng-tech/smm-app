/**
 * Reviews Atoms
 * State management for reviews using Jotai
 */

import { atom } from 'jotai';
import type { Review, ProductReviewsResponse, CustomerReviewsResponse } from '@/types/api';

// Customer's reviews atom
export const customerReviewsAtom = atom<Review[]>([]);

// Product reviews atom (keyed by product ID)
export const productReviewsAtom = atom<Record<number, ProductReviewsResponse>>({});

// Vendor reviews atom (keyed by vendor ID)
export const vendorReviewsAtom = atom<Record<number, ProductReviewsResponse>>({});

// Currently editing review
export const editingReviewAtom = atom<Review | null>(null);

// Review form visibility
export const showReviewFormAtom = atom<boolean>(false);

// Review submission loading state
export const reviewSubmittingAtom = atom<boolean>(false);
