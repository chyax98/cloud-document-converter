import { watch } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'
import { SettingKey } from '@/common/settings'
import { defaultSettings, useSettings } from './settings'

export const i18n = createI18n({
  locale:
    localStorage.getItem('cache.locale') ?? defaultSettings[SettingKey.Locale],
  fallbackLocale: 'en-US',
  messages: {
    'en-US': {
      general: 'General',
      save: 'Save',
      settings: 'Settings',
      home: 'Home',
      download: 'Download',
      'language.en-US': 'English (American)',
      'language.zh-CN': 'Chinese (simplified)',
      'general.language': 'Language',
      'general.language.placeholder': 'Select language',
      'general.theme': 'Theme',
      'general.theme.placeholder': 'Select theme',
      'general.theme.light': 'Light',
      'general.theme.dark': 'Dark',
      'general.theme.system': 'System',
      'download.method': 'Download Method',
      'download.method.placeholder': 'Select download method',
      'download.method.direct': 'Direct Download',
      'download.method.showSaveFilePicker': 'Show Save File Picker',
      'download.method.direct.description':
        'How browsers treat downloads varies by browser, user settings, and other factors.The user may be prompted before a download starts, or the file may be saved automatically, or it may open automatically, either in an external application or in the browser itself.',
      'download.method.showSaveFilePicker.description':
        'Shows a file picker that allows a user to save a file. Either by selecting an existing file, or entering a name for a new file.',
      'lark.docx.download': 'Download as Markdown',
      'lark.docx.copy': 'Copy as Markdown',
      'lark.docx.view': 'View as Markdown',
      'help.and.feedback': 'Help and Feedback',
      domains: 'Domains',
      'domains.description':
        'Manage custom domains for Lark/Feishu enterprise deployments',
      'domains.builtin': 'Built-in Domains',
      'domains.builtin.count': 'domains',
      'domains.custom': 'Custom Domains',
      'domains.custom.count': 'domains',
      'domains.placeholder': 'e.g., custom.feishu-enterprise.com',
      'domains.add': 'Add',
      'domains.add.title': 'Add Domain',
      'domains.add.description':
        'Enter a custom domain to enable the extension',
      'domains.empty': 'No custom domains added yet',
      'domains.help.title': 'How to add a custom domain:',
      'domains.help.format':
        'Enter domain without protocol (https://) or path (/)',
      'domains.help.example': 'Example: custom.feishu-enterprise.com',
      'domains.help.permission':
        'You will be prompted to grant permissions for the domain',
      'domains.error.empty': 'Please enter a domain',
      'domains.error.invalid_format': 'Invalid domain format',
      'domains.error.domain_already_builtin': 'This domain is already built-in',
      'domains.error.domain_already_exists': 'This domain already exists',
      'domains.error.permission_denied': 'Permission denied',
      'domains.error.domain_not_found': 'Domain not found',
      'domains.error.unknown': 'An unknown error occurred',
      'domains.success.added': 'Domain added successfully',
      'domains.success.removed': 'Domain removed successfully',
    },
    'zh-CN': {
      general: '通用',
      save: '保存',
      settings: '设置',
      home: '首页',
      download: '下载',
      'language.en-US': '英语（美式）',
      'language.zh-CN': '中文（简体）',
      'general.language': '语言',
      'general.language.placeholder': '选择语言',
      'general.theme': '主题',
      'general.theme.placeholder': '选择主题',
      'general.theme.light': '浅色',
      'general.theme.dark': '深色',
      'general.theme.system': '跟随系统',
      'download.method': '下载方式',
      'download.method.placeholder': '选择下载方式',
      'download.method.direct': '直接下载',
      'download.method.showSaveFilePicker': '显示保存文件选择器',
      'download.method.direct.description':
        '浏览器对下载文件的处理方式因浏览器类型、用户设置及其他因素而异。下载开始前可能出现用户确认提示，文件也可能自动保存，或直接在外部应用程序或浏览器本身中自动打开。',
      'download.method.showSaveFilePicker.description':
        '显示一个文件选择器，允许用户保存文件。用户既可选择现有文件，也可输入新文件的名称。',
      'lark.docx.download': '下载为 Markdown',
      'lark.docx.copy': '复制为 Markdown',
      'lark.docx.view': '查看为 Markdown',
      'help.and.feedback': '帮助和反馈',
      domains: '域名管理',
      'domains.description': '管理飞书企业定制版本的自定义域名',
      'domains.builtin': '内置域名',
      'domains.builtin.count': '个域名',
      'domains.custom': '自定义域名',
      'domains.custom.count': '个域名',
      'domains.placeholder': '例如: custom.feishu-enterprise.com',
      'domains.add': '添加',
      'domains.add.title': '添加域名',
      'domains.add.description': '输入自定义域名以启用扩展功能',
      'domains.empty': '暂无自定义域名',
      'domains.help.title': '如何添加自定义域名:',
      'domains.help.format': '输入域名时不包含协议 (https://) 和路径 (/)',
      'domains.help.example': '示例: custom.feishu-enterprise.com',
      'domains.help.permission': '添加时会提示您授予域名权限',
      'domains.error.empty': '请输入域名',
      'domains.error.invalid_format': '域名格式无效',
      'domains.error.domain_already_builtin': '该域名已内置',
      'domains.error.domain_already_exists': '该域名已存在',
      'domains.error.permission_denied': '权限被拒绝',
      'domains.error.domain_not_found': '域名未找到',
      'domains.error.unknown': '发生未知错误',
      'domains.success.added': '域名添加成功',
      'domains.success.removed': '域名删除成功',
    },
  },
})

export const useInitLocale = () => {
  const i18n = useI18n()
  const { locale, availableLocales } = i18n

  const { query } = useSettings()
  watch(query.data, newSettings => {
    if (newSettings !== undefined) {
      const newLocale = newSettings[SettingKey.Locale]
      const isAvailable = (
        input: string,
      ): input is (typeof availableLocales.value)[number] =>
        availableLocales.value.includes(input)

      locale.value = isAvailable(newLocale)
        ? newLocale
        : defaultSettings[SettingKey.Locale]
    }
  })

  return i18n
}
