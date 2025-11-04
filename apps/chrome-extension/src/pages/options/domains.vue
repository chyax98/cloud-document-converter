<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoaderCircle, Plus, Trash2, Globe } from 'lucide-vue-next'
import {
  DEFAULT_DOMAINS,
  loadDomainConfig,
  addCustomDomain,
  removeCustomDomain,
  validateDomain,
} from '@/common/domains'

const { t } = useI18n()

const customDomains = ref<string[]>([])
const newDomain = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const loadDomains = async () => {
  try {
    const config = await loadDomainConfig()
    customDomains.value = config.customDomains
  } catch (err) {
    console.error('Failed to load domains:', err)
  }
}

const handleAddDomain = async () => {
  if (!newDomain.value.trim()) {
    error.value = t('domains.error.empty')
    return
  }

  if (!validateDomain(newDomain.value)) {
    error.value = t('domains.error.invalid_format')
    return
  }

  loading.value = true
  error.value = null
  success.value = null

  try {
    const result = await addCustomDomain(newDomain.value)

    if (result.success) {
      success.value = t('domains.success.added')
      newDomain.value = ''
      await loadDomains()

      setTimeout(() => {
        success.value = null
      }, 3000)
    } else {
      error.value = t(`domains.error.${result.message}`)
    }
  } catch (err) {
    error.value = t('domains.error.unknown')
    console.error('Failed to add domain:', err)
  } finally {
    loading.value = false
  }
}

const handleRemoveDomain = async (domain: string) => {
  loading.value = true
  error.value = null
  success.value = null

  try {
    const result = await removeCustomDomain(domain)

    if (result.success) {
      success.value = t('domains.success.removed')
      await loadDomains()

      setTimeout(() => {
        success.value = null
      }, 3000)
    } else {
      error.value = t(`domains.error.${result.message}`)
    }
  } catch (err) {
    error.value = t('domains.error.unknown')
    console.error('Failed to remove domain:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDomains()
})
</script>

<template>
  <div class="space-y-4">
    <!-- 页面标题 -->
    <div class="flex items-center gap-2 mb-6">
      <Globe class="h-6 w-6" />
      <div>
        <h2 class="text-2xl font-bold">{{ t('domains') }}</h2>
        <p class="text-sm text-muted-foreground mt-1">
          {{ t('domains.description') }}
        </p>
      </div>
    </div>

    <!-- 三栏布局 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 左栏：内置域名 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{{ t('domains.builtin') }}</CardTitle>
          <CardDescription class="text-xs">
            {{ DEFAULT_DOMAINS.length }} {{ t('domains.builtin.count') }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="domain in DEFAULT_DOMAINS"
              :key="domain"
              variant="secondary"
              class="text-xs"
            >
              {{ domain }}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <!-- 中栏：自定义域名列表 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{{ t('domains.custom') }}</CardTitle>
          <CardDescription class="text-xs">
            {{ customDomains.length }} {{ t('domains.custom.count') }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- 自定义域名列表 -->
          <div
            v-if="customDomains.length > 0"
            class="space-y-2 max-h-[400px] overflow-y-auto"
          >
            <div
              v-for="domain in customDomains"
              :key="domain"
              class="flex items-center justify-between rounded-md border p-2 hover:bg-accent transition-colors"
            >
              <span class="font-mono text-xs truncate flex-1">{{
                domain
              }}</span>
              <Button
                variant="ghost"
                size="sm"
                :disabled="loading"
                @click="handleRemoveDomain(domain)"
                class="h-7 w-7 p-0"
              >
                <Trash2 class="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-else
            class="text-center py-12 text-sm text-muted-foreground border-2 border-dashed rounded-lg"
          >
            <Globe class="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{{ t('domains.empty') }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- 右栏：添加域名 + 帮助 -->
      <div class="space-y-4">
        <!-- 添加域名卡片 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">{{
              t('domains.add.title')
            }}</CardTitle>
            <CardDescription class="text-xs">
              {{ t('domains.add.description') }}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <!-- 添加表单 -->
            <div class="space-y-2">
              <Input
                v-model="newDomain"
                :placeholder="t('domains.placeholder')"
                :disabled="loading"
                @keyup.enter="handleAddDomain"
                class="text-sm"
              />
              <Button
                @click="handleAddDomain"
                :disabled="loading || !newDomain.trim()"
                class="w-full"
                size="sm"
              >
                <LoaderCircle
                  v-if="loading"
                  class="h-4 w-4 animate-spin mr-2"
                />
                <Plus v-else class="h-4 w-4 mr-2" />
                {{ t('domains.add') }}
              </Button>
            </div>

            <!-- 错误提示 -->
            <Alert v-if="error" variant="destructive" class="py-2">
              <AlertDescription class="text-xs">{{ error }}</AlertDescription>
            </Alert>

            <!-- 成功提示 -->
            <Alert v-if="success" class="py-2">
              <AlertDescription class="text-xs">{{ success }}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <!-- 使用说明卡片 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">{{
              t('domains.help.title')
            }}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul class="space-y-2 text-xs text-muted-foreground">
              <li class="flex items-start gap-2">
                <span class="text-primary mt-0.5">•</span>
                <span>{{ t('domains.help.format') }}</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary mt-0.5">•</span>
                <span>{{ t('domains.help.example') }}</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary mt-0.5">•</span>
                <span>{{ t('domains.help.permission') }}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
