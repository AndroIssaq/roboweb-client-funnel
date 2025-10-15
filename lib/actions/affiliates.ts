"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Affiliate Management
export async function getAllAffiliates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("affiliates")
    .select(`
      *,
      user:users!affiliates_user_id_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching affiliates:", error)
    return []
  }

  // Get contract counts for each affiliate
  const affiliatesWithCounts = await Promise.all(
    (data || []).map(async (affiliate) => {
      const { count } = await supabase
        .from("contracts")
        .select("*", { count: "exact", head: true })
        .eq("affiliate_id", affiliate.id)

      return {
        ...affiliate,
        name: affiliate.user?.full_name || affiliate.user?.email || 'غير معروف',
        email: affiliate.user?.email || '',
        contracts_count: count || 0,
      }
    })
  )

  return affiliatesWithCounts
}

export async function getAffiliateByCode(code: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("affiliates").select("*").eq("referral_code", code).single()

  if (error) {
    console.error("Error fetching affiliate:", error)
    return null
  }

  return data
}

export async function getAffiliateStats(affiliateId: string) {
  const supabase = await createClient()

  // Get total referrals
  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select("id, total_amount")
    .eq("affiliate_id", affiliateId)

  if (contractsError) {
    console.error("Error fetching affiliate contracts:", contractsError)
    return null
  }

  // Get total payouts
  const { data: payouts, error: payoutsError } = await supabase
    .from("payouts")
    .select("amount, status")
    .eq("affiliate_id", affiliateId)

  if (payoutsError) {
    console.error("Error fetching affiliate payouts:", payoutsError)
    return null
  }

  const totalReferrals = contracts?.length || 0
  const totalRevenue = contracts?.reduce((sum, contract) => sum + (contract.total_amount || 0), 0) || 0
  const totalPaid = payouts?.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0) || 0
  const totalPending = payouts?.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0) || 0

  return {
    totalReferrals,
    totalRevenue,
    totalPaid,
    totalPending,
    totalEarnings: totalPaid + totalPending,
  }
}

export async function createAffiliate(affiliateData: any) {
  const supabase = await createClient()

  let code: string
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 10) {
    code = `AFF${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const { data: existing } = await supabase.from("affiliates").select("id").eq("referral_code", code).single()

    if (!existing) {
      isUnique = true
      break
    }
    attempts++
  }

  if (!isUnique) {
    return { success: false, error: "فشل في إنشاء كود فريد" }
  }

  const { data, error } = await supabase
    .from("affiliates")
    .insert({
      ...affiliateData,
      referral_code: code!,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating affiliate:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/affiliates")
  return { success: true, data }
}

export async function updateAffiliate(id: string, updates: any) {
  const supabase = await createClient()

  const { error } = await supabase.from("affiliates").update(updates).eq("id", id)

  if (error) {
    console.error("Error updating affiliate:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/affiliates")
  return { success: true }
}

// Payout Management
export async function getAllPayouts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payouts")
    .select(`
      *,
      affiliate:affiliates!payouts_affiliate_id_fkey(
        id,
        referral_code,
        user:users!affiliates_user_id_fkey(full_name, email)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching payouts:", error)
    return []
  }

  // Map data for compatibility
  const mappedData = data?.map(payout => ({
    ...payout,
    affiliates: {
      name: payout.affiliate?.user?.full_name || 'غير معروف',
      email: payout.affiliate?.user?.email || '',
      affiliate_code: payout.affiliate?.referral_code || '',
    }
  })) || []

  return mappedData
}

export async function getAffiliatePayouts(affiliateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payouts")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching affiliate payouts:", error)
    return []
  }

  return data || []
}

export async function createPayout(payoutData: any) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("payouts").insert(payoutData).select().single()

  if (error) {
    console.error("Error creating payout:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/payouts")
  return { success: true, data }
}

export async function updatePayoutStatus(id: string, status: string, paidAt?: string) {
  const supabase = await createClient()

  const updates: any = { status }
  if (status === "paid" && paidAt) {
    updates.paid_at = paidAt
  }

  const { error } = await supabase.from("payouts").update(updates).eq("id", id)

  if (error) {
    console.error("Error updating payout status:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/payouts")
  return { success: true }
}

// Server action for confirming payout from form
export async function handlePayoutConfirmation(payoutId: string) {
  await updatePayoutStatus(payoutId, "paid", new Date().toISOString())
  revalidatePath("/admin/payouts")
}

// Calculate commission for a contract
export async function calculateCommission(contractId: string) {
  const supabase = await createClient()

  // Get contract with affiliate info
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(`
      *,
      affiliates (
        id,
        commission_rate
      )
    `)
    .eq("id", contractId)
    .single()

  if (contractError || !contract || !contract.affiliates) {
    return null
  }

  const commissionRate = contract.affiliates.commission_rate || 0
  const commissionAmount = (contract.total_amount * commissionRate) / 100

  return {
    affiliateId: contract.affiliates.id,
    contractId: contract.id,
    amount: commissionAmount,
    rate: commissionRate,
  }
}

// Get affiliate referrals
export async function getAffiliateReferrals(affiliateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contracts")
    .select(`
      *,
      client:users!contracts_client_id_fkey(full_name, email)
    `)
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching affiliate referrals:", error)
    return []
  }

  // Map data to include client info
  const mappedData = data?.map(contract => ({
    ...contract,
    clients: {
      company_name: contract.client?.full_name || contract.client?.email || 'غير معروف',
      email: contract.client?.email || '',
    }
  })) || []

  return mappedData
}
