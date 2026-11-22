export type InformationSourceRegistryEntry = {
  id: string
  names: readonly string[]
  homeUrl: string
  logoUrl: string
  articleHosts?: readonly string[]
}

/** 资讯来源机构注册表：名称、官网、专属 logo（public/information-sources） */
export const INFORMATION_SOURCE_REGISTRY: readonly InformationSourceRegistryEntry[] = [
  {
    id: 'nesdc',
    names: ['国家生态科学数据中心'],
    homeUrl: 'https://www.nesdc.org.cn/',
    logoUrl: '/information-sources/nesdc.png',
    articleHosts: ['www.nesdc.org.cn', 'nesdc.org.cn']
  },
  {
    id: 'tpdc',
    names: ['国家青藏高原科学数据中心'],
    homeUrl: 'https://www.tpdc.ac.cn/',
    logoUrl: '/information-sources/tpdc.jpg',
    articleHosts: ['www.tpdc.ac.cn', 'tpdc.ac.cn', 'data.tpdc.ac.cn']
  },
  {
    id: 'nbsdc',
    names: ['国家基础学科公共科学数据中心'],
    homeUrl: 'https://www.nbsdc.cn/',
    logoUrl: '/information-sources/nbsdc.png',
    articleHosts: ['www.nbsdc.cn', 'nbsdc.cn']
  },
  {
    id: 'matsci',
    names: ['材料科学数据中心'],
    homeUrl: 'https://www.matsci.cn/',
    logoUrl: '/information-sources/matsci.svg',
    articleHosts: ['www.matsci.cn', 'matsci.cn']
  },
  {
    id: 'scsio',
    names: ['中国科学院南海海洋研究所科学数据中心'],
    homeUrl: 'https://www.scsio.cas.cn/',
    logoUrl: '/information-sources/scsio.svg',
    articleHosts: ['www.scsio.cas.cn', 'scsio.cas.cn']
  },
  {
    id: 'aircas',
    names: ['中国科学院空天信息创新研究院'],
    homeUrl: 'https://www.aircas.cas.cn/',
    logoUrl: '/information-sources/aircas.svg',
    articleHosts: ['www.aircas.cas.cn', 'aircas.cas.cn']
  },
  {
    id: 'geodata',
    names: ['国家地球系统科学数据中心'],
    homeUrl: 'https://www.geodata.cn/',
    logoUrl: '/information-sources/geodata.png',
    articleHosts: ['www.geodata.cn', 'geodata.cn']
  },
  {
    id: 'chinageoss',
    names: ['国家对地观测科学数据中心'],
    homeUrl: 'https://www.chinageoss.cn/',
    logoUrl: '/information-sources/chinageoss.png',
    articleHosts: ['www.chinageoss.cn', 'chinageoss.cn']
  },
  {
    id: 'ncdc',
    names: ['国家冰川冻土沙漠科学数据中心'],
    homeUrl: 'https://www.ncdc.ac.cn/',
    logoUrl: '/information-sources/ncdc.png',
    articleHosts: ['www.ncdc.ac.cn', 'ncdc.ac.cn']
  },
  {
    id: 'nmdc',
    names: ['国家计量科学数据中心'],
    homeUrl: 'https://www.nmdc.ac.cn/',
    logoUrl: '/information-sources/nmdc.svg',
    articleHosts: ['www.nmdc.ac.cn', 'nmdc.ac.cn']
  },
  {
    id: 'nssdc',
    names: ['国家空间科学数据中心'],
    homeUrl: 'https://www.nssdc.ac.cn/nssdc_zh/html/index.html',
    logoUrl: '/information-sources/nssdc.png',
    articleHosts: ['www.nssdc.ac.cn', 'nssdc.ac.cn']
  },
  {
    id: 'china-vo',
    names: ['国家天文科学数据中心'],
    homeUrl: 'https://www.china-vo.org/',
    logoUrl: '/information-sources/china-vo.svg',
    articleHosts: ['www.china-vo.org', 'china-vo.org']
  },
  {
    id: 'nmdc-cn',
    names: ['国家微生物科学数据中心'],
    homeUrl: 'https://www.nmdc.cn/',
    logoUrl: '/information-sources/nmdc-cn.ico',
    articleHosts: ['www.nmdc.cn', 'nmdc.cn']
  },
  {
    id: 'ngdc',
    names: ['国家基因组科学数据中心'],
    homeUrl: 'https://www.ngdc.cn/',
    logoUrl: '/information-sources/ngdc.png',
    articleHosts: ['www.ngdc.cn', 'ngdc.cn']
  },
  {
    id: 'cncb',
    names: ['国家生物信息中心', '中国国家生物信息中心'],
    homeUrl: 'https://www.cncb.ac.cn/',
    logoUrl: '/information-sources/cncb.png',
    articleHosts: ['www.cncb.ac.cn', 'cncb.ac.cn']
  },
  {
    id: 'nhepsdc',
    names: ['国家高能物理科学数据中心'],
    homeUrl: 'https://www.nhepsdc.cn/',
    logoUrl: '/information-sources/nhepsdc.png',
    articleHosts: ['www.nhepsdc.cn', 'nhepsdc.cn', 'www.hepcc.ac.cn', 'hepcc.ac.cn']
  },
  {
    id: 'cma',
    names: ['国家气象科学数据中心', '中国气象'],
    homeUrl: 'https://data.cma.cn/weatherGis/interface/interfaceIndex',
    logoUrl: '/information-sources/cma.png',
    articleHosts: ['data.cma.cn', 'www.data.cma.cn']
  },
  {
    id: 'nmdis',
    names: ['国家海洋科学数据中心'],
    homeUrl: 'https://mds.nmdis.org.cn/',
    logoUrl: '/information-sources/nmdis.png',
    articleHosts: ['mds.nmdis.org.cn', 'www.mds.nmdis.org.cn', 'nmdis.org.cn', 'www.nmdis.org.cn']
  },
  {
    id: 'forestdata',
    names: ['国家林业和草原科学数据中心'],
    homeUrl: 'https://www.forestdata.cn/',
    logoUrl: '/information-sources/forestdata.png',
    articleHosts: ['www.forestdata.cn', 'forestdata.cn']
  }
] as const

const DEFAULT_LOGO_URL = '/information-sources/default.svg'

const IGNORED_ARTICLE_HOSTS = new Set([
  'mp.weixin.qq.com',
  'www.weixin.qq.com',
  'fairspace.cn'
])

function normalizeSourceLabel(value: string): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
}

function matchRegistryByName(source: string): InformationSourceRegistryEntry | null {
  const normalized = normalizeSourceLabel(source)
  if (!normalized) return null

  for (const entry of INFORMATION_SOURCE_REGISTRY) {
    for (const name of entry.names) {
      const key = normalizeSourceLabel(name)
      if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
        return entry
      }
    }
  }

  return null
}

function matchRegistryByArticleHost(articleUrl: string): InformationSourceRegistryEntry | null {
  const raw = String(articleUrl || '').trim()
  if (!raw) return null

  try {
    const host = new URL(raw).hostname.toLowerCase()
    if (IGNORED_ARTICLE_HOSTS.has(host)) return null

    for (const entry of INFORMATION_SOURCE_REGISTRY) {
      if (entry.articleHosts?.includes(host)) {
        return entry
      }
    }
  } catch {
    return null
  }

  return null
}

function resolveLogoUrl(
  entry: InformationSourceRegistryEntry | null,
  sourceLogoUrl?: string | null
): string {
  const explicit = String(sourceLogoUrl || '').trim()
  if (explicit) return explicit
  return entry?.logoUrl || DEFAULT_LOGO_URL
}

export type InformationSourceCard = {
  name: string
  homeUrl: string
  logoUrl: string
}

/**
 * 解析资讯来源机构官网与 logo。
 * 优先使用记录中的 sourceUrl / sourceLogoUrl；否则按注册表匹配。
 */
export function resolveInformationSourceCard(input: {
  source?: string | null
  sourceUrl?: string | null
  sourceLogoUrl?: string | null
  articleUrl?: string | null
}): InformationSourceCard | null {
  const name = String(input.source || '').trim()
  if (!name) return null

  const explicitHome = String(input.sourceUrl || '').trim()
  const fromName = matchRegistryByName(name)
  const fromArticle = matchRegistryByArticleHost(String(input.articleUrl || ''))
  const entry = fromName || fromArticle

  if (/^https?:\/\//i.test(explicitHome)) {
    return {
      name,
      homeUrl: explicitHome,
      logoUrl: resolveLogoUrl(entry, input.sourceLogoUrl)
    }
  }

  if (entry) {
    return {
      name,
      homeUrl: entry.homeUrl,
      logoUrl: resolveLogoUrl(entry, input.sourceLogoUrl)
    }
  }

  return {
    name,
    homeUrl: '',
    logoUrl: resolveLogoUrl(null, input.sourceLogoUrl)
  }
}
