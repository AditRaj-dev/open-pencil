import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'

import CommandPaletteDemo from './CommandPaletteDemo.vue'

const meta = {
  title: 'Vue SDK/Primitives/Command Palette',
  component: CommandPaletteDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Headless searchable command list built on Reka UI Listbox primitives.'
      }
    }
  }
} satisfies Meta<typeof CommandPaletteDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('searchbox', { name: 'Command palette' })

    await userEvent.click(input)
    await userEvent.type(input, 'setting')
    await expect(canvas.getByRole('option', { name: /Settings/ })).toBeVisible()
    await expect(canvas.queryByRole('option', { name: 'Undo' })).not.toBeInTheDocument()

    await userEvent.clear(input)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(canvas.getByRole('status', { name: 'Last selection' })).toHaveTextContent(
      'Settings'
    )
  }
}
