export interface MetaAccountDaily {
  id: string
  account_id: string
  account_name?: string
  date: string
  // Volume
  spend: number
  impressions: number
  reach: number
  frequency: number
  clicks: number
  link_clicks: number
  unique_clicks: number
  unique_link_clicks: number
  // Eficiência
  ctr: number
  cpm: number
  cpc: number
  cpp: number
  unique_ctr: number
  cost_per_unique_click: number | null
  // Conversões
  leads: number
  conversions: number
  conversion_value: number
  add_to_cart: number
  initiate_checkout: number
  view_content: number
  actions_search: number
  actions_add_payment_info: number
  // Vídeo
  video_p25: number
  video_p50: number
  video_p75: number
  video_p100: number
  video_thruplay: number
  synced_at?: string
}

export interface MetaCampaignDaily {
  id: string
  account_id: string
  account_name?: string
  campaign_id: string
  campaign_name: string
  campaign_status: string
  status?: string
  objective: string
  date: string
  spend: number
  impressions: number
  reach: number
  frequency: number
  clicks: number
  link_clicks: number
  unique_clicks: number
  unique_link_clicks: number
  ctr: number
  cpm: number
  cpc: number
  cpp: number
  unique_ctr: number
  cost_per_unique_click: number | null
  leads: number
  conversions: number
  conversion_value: number
  add_to_cart: number
  initiate_checkout: number
  view_content: number
  video_p25: number
  video_p50: number
  video_p75: number
  video_p100: number
  video_thruplay: number
  synced_at?: string
}

export interface MetaAdSetDaily {
  id: string
  account_id: string
  account_name?: string
  campaign_id: string
  campaign_name: string
  adset_id: string
  adset_name: string
  adset_status: string
  status?: string
  date: string
  spend: number
  impressions: number
  reach: number
  frequency: number
  clicks: number
  link_clicks: number
  ctr: number
  cpm: number
  cpc: number
  leads: number
  conversions: number
  conversion_value: number
  add_to_cart: number
  initiate_checkout: number
  video_p25: number
  video_p75: number
  video_thruplay: number
  synced_at?: string
}

export interface MetaAdDaily {
  id: string
  account_id: string
  account_name?: string
  campaign_id: string
  campaign_name: string
  adset_id: string
  adset_name: string
  ad_id: string
  ad_name: string
  ad_status: string
  status?: string
  date: string
  spend: number
  impressions: number
  reach: number
  frequency: number
  clicks: number
  link_clicks: number
  ctr: number
  cpm: number
  cpc: number
  leads: number
  conversions: number
  conversion_value: number
  add_to_cart: number
  initiate_checkout: number
  video_p25: number
  video_p50: number
  video_p75: number
  video_p100: number
  video_thruplay: number
  synced_at?: string
}

export interface MetaAccountHourly {
  id: string
  account_id: string
  account_name?: string
  date: string
  hour: number
  spend: number
  impressions: number
  clicks: number
  reach: number
  leads: number
  purchases: number
  purchase_value: number
  messaging_starts: number
  video_views: number
  add_to_cart: number
  initiate_checkout: number
  conversions: number
  synced_at?: string
}
