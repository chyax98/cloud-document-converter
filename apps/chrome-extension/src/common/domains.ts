/**
 * 域名配置管理模块
 * 支持默认域名 + 用户自定义域名
 */

/**
 * 默认支持的飞书域名列表
 */
export const DEFAULT_DOMAINS = [
  'feishu.cn',
  'feishu.net',
  'larksuite.com',
  'feishu-pre.net',
  'larkoffice.com',
  'larkenterprise.com',
] as const

/**
 * 存储键
 */
const STORAGE_KEY = 'customDomains'

/**
 * 域名配置接口
 */
export interface DomainConfig {
  /** 自定义域名列表 (不包含协议和通配符) */
  customDomains: string[]
}

/**
 * 默认配置
 */
export const DEFAULT_DOMAIN_CONFIG: DomainConfig = {
  customDomains: [],
}

/**
 * 验证域名格式
 * @param domain - 域名 (如: "custom.feishu-enterprise.com")
 * @returns 是否有效
 */
export const validateDomain = (domain: string): boolean => {
  // 移除前后空格
  const trimmed = domain.trim()

  // 基本格式检查: 不能为空,不能包含协议,不能包含路径
  if (!trimmed || trimmed.includes('://') || trimmed.includes('/')) {
    return false
  }

  // 域名格式检查: 至少包含一个点,由字母数字和横杠点组成
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  return domainRegex.test(trimmed)
}

/**
 * 规范化域名
 * @param domain - 原始域名
 * @returns 规范化后的域名
 */
export const normalizeDomain = (domain: string): string => {
  return domain.trim().toLowerCase()
}

/**
 * 将域名转换为 URL 模式
 * @param domain - 域名
 * @returns URL 模式数组 (精确匹配 + 子域名通配符)
 * @example
 * domainToUrlPatterns("xfchat.iflytek.com")
 * // => ["https://xfchat.iflytek.com/*", "https://*.xfchat.iflytek.com/*"]
 */
export const domainToUrlPatterns = (domain: string): string[] => {
  return [
    `https://${domain}/*`, // 精确匹配: https://yf2ljykclb.xfchat.iflytek.com/*
    `https://*.${domain}/*`, // 子域名通配: https://*.xfchat.iflytek.com/*
  ]
}

/**
 * 获取所有 URL 模式 (默认 + 自定义)
 * @param customDomains - 自定义域名列表
 * @returns URL 模式数组
 */
export const getAllUrlPatterns = (customDomains: string[] = []): string[] => {
  const defaultPatterns = DEFAULT_DOMAINS.flatMap(domainToUrlPatterns)
  const customPatterns = customDomains.flatMap(domainToUrlPatterns)
  return [...defaultPatterns, ...customPatterns]
}

/**
 * 保存域名配置到 storage
 * @param config - 域名配置
 */
export const saveDomainConfig = async (config: DomainConfig): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await chrome.storage.sync.set({ [STORAGE_KEY]: config } as Record<
    string,
    unknown
  >)
}

/**
 * 从 storage 读取域名配置
 * @returns 域名配置
 */
export const loadDomainConfig = async (): Promise<DomainConfig> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result = (await chrome.storage.sync.get(STORAGE_KEY)) as Record<
      string,
      unknown
    >
    const config = result[STORAGE_KEY] as DomainConfig | undefined

    if (!config) {
      return DEFAULT_DOMAIN_CONFIG
    }

    // 验证和过滤无效域名
    const validDomains = config.customDomains.filter(validateDomain)

    return {
      customDomains: validDomains,
    }
  } catch (error: unknown) {
    console.error('Failed to load domain config:', error)
    return DEFAULT_DOMAIN_CONFIG
  }
}

/**
 * 添加自定义域名
 * @param domain - 要添加的域名
 * @returns 添加结果
 */
export const addCustomDomain = async (
  domain: string,
): Promise<{ success: boolean; message: string }> => {
  const normalized = normalizeDomain(domain)

  // 验证格式
  if (!validateDomain(normalized)) {
    return {
      success: false,
      message: 'invalid_domain_format',
    }
  }

  // 检查是否为默认域名
  if (
    DEFAULT_DOMAINS.includes(normalized as (typeof DEFAULT_DOMAINS)[number])
  ) {
    return {
      success: false,
      message: 'domain_already_builtin',
    }
  }

  // 加载当前配置
  const config = await loadDomainConfig()

  // 检查是否已存在
  if (config.customDomains.includes(normalized)) {
    return {
      success: false,
      message: 'domain_already_exists',
    }
  }

  // 请求权限 (精确域名 + 子域名通配符)
  const urlPatterns = domainToUrlPatterns(normalized)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const granted = (await chrome.permissions.request({
    origins: urlPatterns,
  })) as boolean

  if (!granted) {
    return {
      success: false,
      message: 'permission_denied',
    }
  }

  // 添加并保存
  config.customDomains.push(normalized)
  await saveDomainConfig(config)

  return {
    success: true,
    message: 'domain_added',
  }
}

/**
 * 删除自定义域名
 * @param domain - 要删除的域名
 * @returns 删除结果
 */
export const removeCustomDomain = async (
  domain: string,
): Promise<{ success: boolean; message: string }> => {
  const normalized = normalizeDomain(domain)

  // 加载当前配置
  const config = await loadDomainConfig()

  // 检查是否存在
  const index = config.customDomains.indexOf(normalized)
  if (index === -1) {
    return {
      success: false,
      message: 'domain_not_found',
    }
  }

  // 删除并保存
  config.customDomains.splice(index, 1)
  await saveDomainConfig(config)

  // 可选: 移除权限 (用户可能想保留权限给其他扩展使用)
  // const urlPattern = domainToUrlPattern(normalized)
  // await chrome.permissions.remove({ origins: [urlPattern] })

  return {
    success: true,
    message: 'domain_removed',
  }
}

/**
 * 监听域名配置变化
 * @param callback - 配置变化时的回调
 * @returns 取消监听的函数
 */
export const onDomainConfigChange = (
  callback: (config: DomainConfig) => void,
): (() => void) => {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName === 'sync' && STORAGE_KEY in changes) {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      const change = changes[STORAGE_KEY]
      const newConfig =
        (change?.newValue as DomainConfig | undefined) ?? DEFAULT_DOMAIN_CONFIG
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      callback(newConfig)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  chrome.storage.onChanged.addListener(listener)

  return () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    chrome.storage.onChanged.removeListener(listener)
  }
}
