import { type Message } from './common/message'
import {
  loadDomainConfig,
  getAllUrlPatterns,
  onDomainConfigChange,
} from './common/domains'

/**
 * 获取当前所有有效的 URL 模式 (默认 + 自定义)
 */
const getSharedDocumentUrlPatterns = async (): Promise<string[]> => {
  const config = await loadDomainConfig()
  return getAllUrlPatterns(config.customDomains)
}

enum MenuItemId {
  DOWNLOAD_DOCX_AS_MARKDOWN = 'download_docx_as_markdown',
  COPY_DOCX_AS_MARKDOWN = 'copy_docx_as_markdown',
  VIEW_DOCX_AS_MARKDOWN = 'view_docx_as_markdown',
}

/**
 * 创建或更新上下文菜单
 */
const setupContextMenus = async (): Promise<void> => {
  const urlPatterns = await getSharedDocumentUrlPatterns()

  // 先移除所有菜单
  await chrome.contextMenus.removeAll()

  // 创建新菜单
  chrome.contextMenus.create({
    id: MenuItemId.DOWNLOAD_DOCX_AS_MARKDOWN,
    title: chrome.i18n.getMessage('download_docx_as_markdown'),
    documentUrlPatterns: urlPatterns,
    contexts: ['page', 'editable'],
  })

  chrome.contextMenus.create({
    id: MenuItemId.COPY_DOCX_AS_MARKDOWN,
    title: chrome.i18n.getMessage('copy_docx_as_markdown'),
    documentUrlPatterns: urlPatterns,
    contexts: ['page', 'editable'],
  })

  chrome.contextMenus.create({
    id: MenuItemId.VIEW_DOCX_AS_MARKDOWN,
    title: chrome.i18n.getMessage('view_docx_as_markdown'),
    documentUrlPatterns: urlPatterns,
    contexts: ['page', 'editable'],
  })
}

// 扩展安装或更新时创建菜单
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus().catch(console.error)
})

// 监听域名配置变化,动态更新菜单
onDomainConfigChange(() => {
  setupContextMenus().catch(console.error)
})

/**
 * 检查 URL 是否匹配自定义域名
 */
const matchesCustomDomain = async (url: string): Promise<boolean> => {
  const config = await loadDomainConfig()

  if (config.customDomains.length === 0) {
    return false
  }

  try {
    const urlObj = new URL(url)

    // 检查是否匹配任何自定义域名
    return config.customDomains.some(domain => {
      // 匹配 *.domain 模式
      return (
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      )
    })
  } catch {
    return false
  }
}

/**
 * 动态注入 content script 到自定义域名标签页
 */
const injectContentScript = async (tabId: number): Promise<void> => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['bundles/content.js'],
    })
  } catch (error) {
    // 忽略错误(可能已经注入过)
    console.debug('Content script injection skipped:', error)
  }
}

// 监听标签页更新,为自定义域名注入 content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 只在页面加载完成时检查
  if (changeInfo.status !== 'complete' || !tab.url) {
    return
  }

  // 异步检查并注入
  void (async () => {
    // tab.url 已在上面检查过非空，这里二次确认
    if (!tab.url) return

    // 检查是否匹配自定义域名
    const isCustomDomain = await matchesCustomDomain(tab.url)

    if (isCustomDomain) {
      await injectContentScript(tabId)
    }
  })()
})

const executeScriptByFlag = async (flag: string | number, tabId: number) => {
  switch (flag) {
    case MenuItemId.DOWNLOAD_DOCX_AS_MARKDOWN:
      await chrome.scripting.executeScript({
        files: ['bundles/scripts/download-lark-docx-as-markdown.js'],
        target: { tabId },
        world: 'MAIN',
      })
      break
    case MenuItemId.COPY_DOCX_AS_MARKDOWN:
      await chrome.scripting.executeScript({
        files: ['bundles/scripts/copy-lark-docx-as-markdown.js'],
        target: { tabId },
        world: 'MAIN',
      })
      break
    case MenuItemId.VIEW_DOCX_AS_MARKDOWN:
      await chrome.scripting.executeScript({
        files: ['bundles/scripts/view-lark-docx-as-markdown.js'],
        target: { tabId },
        world: 'MAIN',
      })
      break
    default:
      break
  }
}

chrome.contextMenus.onClicked.addListener(({ menuItemId }, tab) => {
  if (tab?.id !== undefined) {
    executeScriptByFlag(menuItemId, tab.id).catch(console.error)
  }
})

chrome.runtime.onMessage.addListener((_message, sender, sendResponse) => {
  const message = _message as Message

  const executeScript = async () => {
    const activeTabs = await chrome.tabs.query({
      currentWindow: true,
      active: true,
    })

    const activeTabId = activeTabs.at(0)?.id

    if (activeTabs.length === 1 && activeTabId !== undefined) {
      await executeScriptByFlag(message.flag, activeTabId)
    }
  }

  executeScript().then(sendResponse).catch(console.error)

  return true
})
