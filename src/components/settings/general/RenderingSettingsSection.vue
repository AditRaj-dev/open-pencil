<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@open-pencil/vue'

import { appRuntimeConfig } from '@/app/runtime/config'
import { appPreferences, updateCanvasRenderingMode } from '@/app/settings/preferences/store'
import AppSwitch from '@/components/ui/AppSwitch.vue'

const { dialogs } = useI18n()
const changed = ref(false)
const hasURLOverride = new URLSearchParams(window.location.search).has('renderer')

const tiledRendering = computed({
  get: () => appPreferences.value.rendering.canvasMode === 'tiled',
  set: (enabled: boolean) => {
    updateCanvasRenderingMode(enabled ? 'tiled' : 'retained')
    changed.value = appPreferences.value.rendering.canvasMode !== appRuntimeConfig.sceneRenderer
  }
})
</script>

<template>
  <div>
    <h3 class="text-xs font-semibold text-surface">{{ dialogs.settingsRendering }}</h3>
    <p class="mt-1 text-[11px] text-muted">{{ dialogs.settingsRenderingDescription }}</p>
  </div>

  <div class="flex flex-col rounded border border-border">
    <label class="flex items-center justify-between gap-4 px-3 py-2.5">
      <span>
        <span class="block text-xs text-surface">{{ dialogs.progressiveTiledRendering }}</span>
        <span class="block text-[10px] text-muted">{{
          dialogs.progressiveTiledRenderingDescription
        }}</span>
      </span>
      <AppSwitch
        v-model="tiledRendering"
        :label="dialogs.progressiveTiledRendering"
        data-test-id="settings-progressive-tiled-rendering"
      />
    </label>
  </div>

  <p v-if="hasURLOverride" class="text-[10px] text-muted">
    {{ dialogs.rendererURLOverride }}
  </p>
  <p v-else-if="changed" class="text-[10px] text-muted">
    {{ dialogs.rendererReloadRequired }}
  </p>
</template>
