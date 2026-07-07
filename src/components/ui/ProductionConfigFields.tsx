import type { TemplateProperty } from '@/lib/production-schema'
import { Tooltip } from '@/components/ui/Tooltip'

export const selectCls =
  'w-full px-3 py-2 rounded bg-[--color-surface-raised] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent] appearance-none cursor-pointer'

export const inputCls =
  'w-full px-3 py-2 rounded bg-[--color-surface-raised] border border-[--color-border-strong] text-sm text-[--color-text-primary] focus:outline-none focus:ring-1 focus:ring-[--color-accent]'

export const PROP_TOOLTIPS: Record<string, string> = {
  mix_latency:          'Audio pipeline latency in milliseconds. Higher values improve stability; lower values reduce delay.',
  clock:                'GStreamer pipeline clock. Use TAI to synchronise EFP cameras by absolute timestamp.',
  pgm_resolution:       'Resolution of the programme output.',
  pgm_framerate:        'Frame rate of the programme output.',
  bitrate:              'Video encoding bitrate for the programme output, in kbps.',
  multiview_resolution: 'Resolution of the multiviewer output.',
  multiview_framerate:  'Frame rate of the multiviewer output.',
  multiview_bitrate:    'Video encoding bitrate for the multiviewer output, in kbps.',
  num_aux_buses:        'Number of auxiliary audio send buses. Each aux bus can feed monitors, IFB returns, or external recordings.',
  num_groups:           'Number of group (submix) buses for routing channels to shared processing before the main mix.',
  ebu_main:             'Enables EBU R128 integrated loudness metering on the main programme bus.',
  num_pips:             'Number of Picture-in-Picture slots available in the vision mixer.',
}

export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip
      className="inline-flex items-center"
      content={<span className="text-xs text-zinc-200 leading-relaxed max-w-52 block">{text}</span>}
    >
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[9px] leading-none text-[--color-text-muted] opacity-40 hover:opacity-80 cursor-help transition-opacity select-none shrink-0">i</span>
    </Tooltip>
  )
}

export function PropertyField({
  property,
  value,
  onChange,
}: {
  property: TemplateProperty
  value: string | number | boolean
  onChange: (v: string | number | boolean) => void
}) {
  if (property.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-orange-500"
        />
        <span className="text-xs text-[--color-text-muted]">Enable</span>
      </label>
    )
  }
  if (property.type === 'select') {
    return (
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={selectCls}
      >
        {property.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value as number}
        min={property.min}
        max={property.max}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className={inputCls}
      />
      {property.unit && (
        <span className="text-[--color-text-muted] text-xs shrink-0">{property.unit}</span>
      )}
    </div>
  )
}

// Renders a named group of config fields with optional aux-send sub-routing.
// Pass onChange to enable editing; omit for read-only display.
export function ConfigFieldGroup({
  label,
  ids,
  properties,
  values,
  onChange,
}: {
  label?: string
  ids: string[]
  properties: TemplateProperty[]
  values: Record<string, string | number | boolean>
  onChange?: (id: string, v: string | number | boolean) => void
}) {
  const props = ids.map((id) => properties.find((p) => p.id === id)).filter((p): p is TemplateProperty => !!p)
  if (!props.length) return null
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs uppercase tracking-wider text-orange-500">{label}</span>}
      <div className="flex flex-col gap-2">
        {props.map((prop) => {
          const value = values[prop.id] ?? prop.default
          if (onChange) {
            return (
              <div key={prop.id}>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-xs text-[--color-text-muted]">{prop.label}</label>
                  {PROP_TOOLTIPS[prop.id] && <InfoTip text={PROP_TOOLTIPS[prop.id]!} />}
                </div>
                <PropertyField property={prop} value={value} onChange={(v) => onChange(prop.id, v)} />
                {prop.id === 'num_aux_buses' && Number(values['num_aux_buses'] ?? 0) > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    <span className="text-xs text-[--color-text-muted]">Aux send routing</span>
                    {Array.from({ length: Number(values['num_aux_buses']) }, (_, i) => i + 1).map((bus) => {
                      const key = `aux${bus}_pre`
                      const isPre = values[key] !== false
                      return (
                        <div key={bus} className="flex items-center gap-3">
                          <span className="text-xs text-[--color-text-muted] w-10">AUX {bus}</span>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input type="radio" name={key} checked={isPre} onChange={() => onChange(key, true)} className="accent-orange-500" />
                            <span className="text-xs text-[--color-text-muted]">Pre</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input type="radio" name={key} checked={!isPre} onChange={() => onChange(key, false)} className="accent-orange-500" />
                            <span className="text-xs text-[--color-text-muted]">Post</span>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          // Read-only
          let display: string
          if (prop.type === 'boolean') display = value ? 'Enabled' : 'Disabled'
          else if (prop.type === 'select') display = prop.options?.find((o) => o.value === String(value))?.label ?? String(value)
          else display = `${value}${prop.unit ? ` ${prop.unit}` : ''}`
          return (
            <div key={prop.id} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-[--color-text-muted]">{prop.label}</span>
                {PROP_TOOLTIPS[prop.id] && <InfoTip text={PROP_TOOLTIPS[prop.id]!} />}
              </div>
              <span className="text-sm text-[--color-text-primary] font-mono">{display}</span>
              {prop.id === 'num_aux_buses' && Number(value) > 0 && (
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-xs text-[--color-text-muted]">Aux send routing</span>
                  {Array.from({ length: Number(value) }, (_, i) => i + 1).map((bus) => (
                    <span key={bus} className="text-sm text-[--color-text-primary] font-mono">
                      AUX {bus}: {values[`aux${bus}_pre`] === false ? 'Post-fader' : 'Pre-fader'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
