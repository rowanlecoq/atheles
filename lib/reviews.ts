import { supabase } from "./supabase";

export interface Review {
  id: string;
  user_name: string;
  user_email: string;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  product_handle: string | null;
  approved: boolean;
  created_at: string;
}

export interface ReviewInput {
  user_name: string;
  user_email: string;
  rating: number;
  title?: string;
  body: string;
  images?: string[];
  product_handle?: string;
}

export async function getApprovedReviews(
  productHandle?: string,
  limit = 50,
): Promise<Review[]> {
  if (!supabase) return [];
  let query = supabase
    .from("reviews")
    .select("*")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (productHandle) {
    query = query.eq("product_handle", productHandle);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Review[]) || [];
}

export async function getAllReviews(limit = 50): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as Review[]) || [];
}

export async function getPendingReviews(): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("approved", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Review[]) || [];
}

export async function submitReview(
  input: ReviewInput,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "reviews not configured" };
  // Check for duplicate review (same email + product)
  const duplicateQuery = supabase
    .from("reviews")
    .select("id")
    .eq("user_email", input.user_email);

  if (input.product_handle) {
    duplicateQuery.eq("product_handle", input.product_handle);
  } else {
    duplicateQuery.is("product_handle", null);
  }

  const { data: existing } = await duplicateQuery.limit(1);
  if (existing && existing.length > 0) {
    return { success: false, error: "you have already submitted a review" };
  }

  const { error } = await supabase.from("reviews").insert({
    user_name: input.user_name,
    user_email: input.user_email,
    rating: input.rating,
    title: input.title || null,
    body: input.body,
    images: input.images || [],
    product_handle: input.product_handle || null,
    approved: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function approveReview(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("reviews")
    .update({ approved: true })
    .eq("id", id);

  if (error) throw error;
}

export async function rejectReview(id: string): Promise<void> {
  if (!supabase) return;
  // Get images to delete from storage
  const { data: review } = await supabase
    .from("reviews")
    .select("images")
    .eq("id", id)
    .single();

  if (review?.images?.length) {
    const paths = review.images.map((url: string) => {
      const parts = url.split("/review-images/");
      return parts[1] || "";
    }).filter(Boolean);

    if (paths.length) {
      await supabase.storage.from("review-images").remove(paths);
    }
  }

  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadReviewImage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  if (!supabase) throw new Error("reviews not configured");
  const path = `${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from("review-images")
    .upload(path, fileBuffer, { contentType });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("review-images")
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export function getReviewStats(reviews: Review[]): {
  average: number;
  total: number;
} {
  if (reviews.length === 0) return { average: 0, total: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    total: reviews.length,
  };
}
