<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'destructive'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const alertVariants = computed(() => {
  const base = 'relative w-full rounded-lg border p-4'

  const variants = {
    default: 'bg-background text-foreground',
    destructive:
      'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
  }

  return cn(base, variants[props.variant])
})
</script>

<template>
  <div :class="alertVariants" role="alert">
    <slot />
  </div>
</template>
