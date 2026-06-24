import { GoogleAdsApi } from "google-ads-api"

export interface LiveCampaignData {
  id: string
  name: string
  status: string
  type: string
  budget: number
  budgetType: string
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  conversions: number
  spend: number
  startDate: string
  endDate: string | null
}

/**
 * Fetch campaign performance statistics from Google Ads API using GAQL
 */
export async function fetchLiveCampaigns(
  accessToken: string,
  refreshToken: string,
  customerId: string
): Promise<LiveCampaignData[]> {
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
  })

  // Format customerId to be digits only (Google Ads API expects no hyphens)
  let targetCustomerId = customerId.replace(/-/g, "")

  // If customerId is mock, resolve the first accessible real customer account dynamically
  if (targetCustomerId === "1234567890" || !targetCustomerId) {
    try {
      console.log("Customer ID is mock or empty. Fetching accessible customers...")
      const customers = await client.listAccessibleCustomers(refreshToken)
      if (customers && customers.length > 0) {
        targetCustomerId = customers[0].split("/")[1]
        console.log(`Dynamically resolved Google Ads Customer ID: ${targetCustomerId}`)
      }
    } catch (err: any) {
      console.error("Failed to dynamically list accessible customers:", err?.message || err)
    }
  }

  const customer = client.Customer({
    customer_id: targetCustomerId,
    refresh_token: refreshToken,
  })

  // Google Ads Query Language (GAQL) to fetch campaign stats
  const query = `
    SELECT 
      campaign.id, 
      campaign.name, 
      campaign.status, 
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.clicks, 
      metrics.impressions, 
      metrics.ctr, 
      metrics.average_cpc, 
      metrics.conversions, 
      metrics.cost_micros,
      campaign.start_date,
      campaign.end_date
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `

  const rows = await customer.query(query)

  if (!rows || rows.length === 0) {
    return []
  }

  return rows.map((row: any) => {
    // amount_micros / 1,000,000 = budget in base currency
    const budgetAmount = row.campaign_budget?.amount_micros 
      ? row.campaign_budget.amount_micros / 1_000_000 
      : 0

    // cost_micros / 1,000,000 = total spend
    const spend = row.metrics?.cost_micros 
      ? row.metrics.cost_micros / 1_000_000 
      : 0

    // average_cpc / 1,000,000 = CPC
    const cpc = row.metrics?.average_cpc 
      ? row.metrics.average_cpc / 1_000_000 
      : 0

    return {
      id: String(row.campaign.id),
      name: row.campaign.name || "",
      status: row.campaign.status || "ENABLED",
      type: (row.campaign.advertising_channel_type || "SEARCH").toLowerCase(),
      budget: budgetAmount,
      budgetType: "DAILY",
      clicks: Number(row.metrics?.clicks || 0),
      impressions: Number(row.metrics?.impressions || 0),
      ctr: parseFloat(((row.metrics?.ctr || 0) * 100).toFixed(2)), // convert 0.0566 to 5.66%
      cpc: parseFloat(cpc.toFixed(2)),
      conversions: Number(row.metrics?.conversions || 0),
      spend: parseFloat(spend.toFixed(2)),
      startDate: row.campaign.start_date || "",
      endDate: row.campaign.end_date || null
    }
  })
}

/**
 * Excludes an IP address from a Google Ads campaign
 */
export async function excludeIpFromCampaign(
  accessToken: string,
  refreshToken: string,
  customerId: string,
  googleCampaignId: string,
  ipToExclude: string
): Promise<boolean> {
  const formattedCustomerId = customerId.replace(/-/g, "")

  // Check if it's a mock campaign ID or if we are using mock tokens
  if (googleCampaignId.startsWith("c_") || formattedCustomerId === "1234567890") {
    console.log(`[Simulated IP Exclusion] Excluded IP ${ipToExclude} from campaign ${googleCampaignId}`)
    return true
  }

  try {
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    })

    const customer = client.Customer({
      customer_id: formattedCustomerId,
      refresh_token: refreshToken,
    })

    const operation = {
      create: {
        campaign: `customers/${formattedCustomerId}/campaigns/${googleCampaignId}`,
        type: "IP_BLOCK",
        negative: true,
        ip_block: {
          ip_address: ipToExclude,
        },
      },
    }

    await customer.campaignCriteria.mutate([operation])
    console.log(`Successfully excluded IP ${ipToExclude} from campaign ${googleCampaignId} via Google Ads API.`)
    return true
  } catch (error: any) {
    console.error(`Failed to exclude IP ${ipToExclude} from Google Ads campaign ${googleCampaignId}:`, error?.message || error)
    return false
  }
}

/**
 * Create a new campaign on Google Ads API
 */
export async function createLiveCampaign(
  accessToken: string,
  refreshToken: string,
  customerId: string,
  campaignData: {
    name: string
    budget: number
    type: string
    startDate: string
  }
): Promise<string> {
  const formattedCustomerId = customerId.replace(/-/g, "")

  // Fallback for mock IDs
  if (formattedCustomerId === "1234567890" || !formattedCustomerId) {
    const mockId = "c_gads_" + Math.random().toString(36).substring(2, 9)
    console.log(`[Simulated Google Ads API] Created campaign ${campaignData.name} with mock ID: ${mockId}`)
    return mockId
  }

  try {
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    })

    const customer = client.Customer({
      customer_id: formattedCustomerId,
      refresh_token: refreshToken,
    })

    // 1. Create a campaign budget first (Google Ads campaigns require a budget resource)
    const budgetOperation = {
      create: {
        name: `Budget for ${campaignData.name} - ${Date.now()}`,
        amount_micros: campaignData.budget * 1_000_000, // convert to micros (1 base currency = 1,000,000 micros)
        delivery_method: "STANDARD",
      },
    }

    const budgetResult = await customer.campaignBudgets.mutate([budgetOperation])
    if (!budgetResult.results || budgetResult.results.length === 0) {
      throw new Error("Failed to create campaign budget in Google Ads API")
    }
    const budgetResourceName = budgetResult.results[0].resource_name

    // 2. Create the campaign referencing the budget resource
    // Map advertising channel type
    let advertisingChannelType = "SEARCH"
    if (campaignData.type === "video") {
      advertisingChannelType = "VIDEO"
    } else if (campaignData.type === "shopping") {
      advertisingChannelType = "SHOPPING"
    } else if (campaignData.type === "display") {
      advertisingChannelType = "DISPLAY"
    }

    // Google Ads expects start_date as YYYYMMDD
    const formattedStartDate = campaignData.startDate.replace(/-/g, "")

    const campaignOperation = {
      create: {
        name: campaignData.name,
        advertising_channel_type: advertisingChannelType,
        status: "PAUSED", // start as paused as a best practice
        campaign_budget: budgetResourceName,
        start_date: formattedStartDate,
      },
    }

    const campaignResult = await customer.campaigns.mutate([campaignOperation])
    if (!campaignResult.results || campaignResult.results.length === 0) {
      throw new Error("Failed to create campaign in Google Ads API")
    }
    const createdCampaignResourceName = campaignResult.results[0].resource_name
    
    // Extract numerical campaign ID from resource name "customers/xxx/campaigns/yyy"
    const googleCampaignId = createdCampaignResourceName.split("/").pop() || ""
    console.log(`Successfully created campaign ${campaignData.name} in Google Ads with ID ${googleCampaignId}`)
    
    return googleCampaignId
  } catch (error: any) {
    console.error("Failed to create campaign in Google Ads API:", error?.message || error)
    throw new Error(error?.message || "Failed to create campaign in Google Ads API")
  }
}
