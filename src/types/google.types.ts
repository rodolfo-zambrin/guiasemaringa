export interface GoogleAdDaily {
  id: string
  account_id: string
  account_name?: string
  campaign_id: string
  campaign_name: string
  ad_group_id: string
  ad_group_name: string
  ad_id: string
  ad_name?: string
  ad_type?: string
  ad_status?: string
  status?: string
  date: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  average_cpc: number
  conversions: number
  conversion_value: number
  cost_per_conversion: number | null
  all_conversions: number
  synced_at?: string
}

export interface GoogleAccountDaily {
  id: string
  account_id: string
  account_name?: string
  date: string
  // Volume
  spend: number
  impressions: number
  clicks: number
  interactions: number
  // Eficiência
  ctr: number
  avg_cpc: number
  avg_cpm: number
  interaction_rate: number
  // Conversões principais
  conversions: number
  conversion_value: number
  conversion_rate: number
  cost_per_conversion: number | null
  // Todas as conversões (inclui view-through, micro, cross-device)
  all_conversions: number
  all_conversions_value: number
  cross_device_conversions: number
  cost_per_all_conversions: number | null
  roas: number
  // Impression Share — participação de mercado
  search_impression_share: number | null
  search_abs_top_is: number | null       // IS na 1ª posição
  search_top_is: number | null           // IS no topo (posições 1-3)
  search_lost_is_budget: number | null   // IS perdido por orçamento
  search_lost_is_rank: number | null     // IS perdido por qualidade/lance
  // Posição
  abs_top_impression_pct: number | null  // % impressões na pos. absoluta
  top_impression_pct: number | null      // % impressões no topo
  // Qualidade
  invalid_clicks: number
  invalid_click_rate: number
  // Extensões de chamada
  phone_impressions: number
  phone_calls: number
  phone_through_rate: number
  synced_at?: string
}

export interface GoogleCampaignDaily {
  id: string
  account_id: string
  account_name?: string
  campaign_id: string
  campaign_name: string
  campaign_status: string
  status?: string
  campaign_type: string
  date: string
  // Volume
  spend: number
  impressions: number
  clicks: number
  interactions: number
  // Eficiência
  ctr: number
  avg_cpc: number
  avg_cpm: number
  interaction_rate: number
  // Conversões
  conversions: number
  conversion_value: number
  conversion_rate: number
  cost_per_conversion: number | null
  all_conversions: number
  all_conversions_value: number
  cost_per_all_conversions: number | null
  roas: number
  // Impression Share
  search_impression_share: number | null
  search_abs_top_is: number | null
  search_top_is: number | null
  search_lost_is_budget: number | null
  search_lost_is_rank: number | null
  abs_top_impression_pct: number | null
  top_impression_pct: number | null
  // Qualidade
  invalid_clicks: number
  invalid_click_rate: number
  synced_at?: string
}

export interface GoogleAdGroupDaily {
  id: string
  account_id: string
  account_name?: string
  campaign_id: string
  campaign_name: string
  campaign_type: string
  ad_group_id: string
  adgroup_id: string
  ad_group_name: string
  adgroup_name: string
  ad_group_status: string
  status?: string
  date: string
  spend: number
  impressions: number
  clicks: number
  interactions: number
  ctr: number
  avg_cpc: number
  avg_cpm: number
  conversions: number
  conversion_value: number
  conversion_rate: number
  cost_per_conversion: number | null
  all_conversions: number
  all_conversions_value: number
  roas: number
  search_impression_share: number | null
  search_lost_is_budget: number | null
  search_lost_is_rank: number | null
  synced_at?: string
}

export interface GoogleKeywordDaily {
  id: string
  account_id: string
  account_name?: string
  campaign_id: string
  campaign_name: string
  campaign_type: string
  ad_group_id: string
  adgroup_id: string
  ad_group_name: string
  adgroup_name: string
  keyword_id: string

  keyword_text: string
  match_type: 'EXACT' | 'PHRASE' | 'BROAD' | string
  status?: string
  date: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  avg_cpc: number
  conversions: number
  conversion_value: number
  cost_per_conversion: number | null
  all_conversions: number
  all_conversions_value: number
  quality_score: number | null  // 1-10
  search_impression_share: number | null
  search_rank_lost_impression_share: number | null
  synced_at?: string
}

export interface GoogleAccountHourly {
  id: string
  account_id: string
  account_name?: string
  date: string
  hour: number
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversion_value: number
  average_cpc: number
  synced_at?: string
}
